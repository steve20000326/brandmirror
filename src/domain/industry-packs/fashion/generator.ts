import {
  AUDIENCE_SCENARIO_BRAND_ABSENT_COUNT,
  AUDIENCE_SCENARIO_BRAND_PRESENT_COUNT,
  FASHION_FALLBACKS,
  FASHION_PACK_VERSION,
  FASHION_PLAN_QUOTA,
} from "./constants";
import { FASHION_QUESTION_BANK } from "./question-bank";
import type {
  BrandGenerationContext,
  GeneratedQuestion,
  QuestionCategory,
  QuestionTemplate,
} from "../types";

/** Stable 32-bit hash for deterministic template ordering. */
export function stableHash(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** Split coreProducts on common Chinese/English separators. */
export function parseCoreProducts(raw?: string | null): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(/[、，,；;\/\|]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 4);
}

type PlaceholderValues = {
  brand: string;
  targetAudience: string;
  priceTier: string;
  product: string;
  competitor1: string;
  competitor2: string;
  competitor3: string;
};

function buildPlaceholders(ctx: BrandGenerationContext): PlaceholderValues {
  const products = parseCoreProducts(ctx.coreProducts);
  const competitors = ctx.competitors.map((c) => c.name.trim()).filter(Boolean);

  return {
    brand: ctx.name.trim(),
    targetAudience: ctx.targetAudience?.trim() || FASHION_FALLBACKS.targetAudience,
    priceTier: ctx.priceTier?.trim() || FASHION_FALLBACKS.priceTier,
    product: products[0] || FASHION_FALLBACKS.product,
    competitor1: competitors[0] || FASHION_FALLBACKS.competitor,
    competitor2: competitors[1] || competitors[0] || FASHION_FALLBACKS.competitor,
    competitor3:
      competitors[2] || competitors[1] || competitors[0] || FASHION_FALLBACKS.competitor,
  };
}

function renderTemplate(template: string, values: PlaceholderValues): string {
  return template
    .replaceAll("{brand}", values.brand)
    .replaceAll("{targetAudience}", values.targetAudience)
    .replaceAll("{priceTier}", values.priceTier)
    .replaceAll("{product}", values.product)
    .replaceAll("{competitor1}", values.competitor1)
    .replaceAll("{competitor2}", values.competitor2)
    .replaceAll("{competitor3}", values.competitor3)
    .replace(/\s+/g, " ")
    .trim();
}

function templateNeedsCompetitorSlot(template: string, slot: 1 | 2 | 3): boolean {
  return template.includes(`{competitor${slot}}`);
}

/** Filter competitor templates based on how many competitors the brand has. */
export function filterCompetitorTemplates(
  templates: QuestionTemplate[],
  competitorCount: number,
): QuestionTemplate[] {
  return templates.filter((tpl) => {
    if (tpl.category !== "competitor_comparison") return true;

    const needs1 = templateNeedsCompetitorSlot(tpl.template, 1);
    const needs2 = templateNeedsCompetitorSlot(tpl.template, 2);
    const needs3 = templateNeedsCompetitorSlot(tpl.template, 3);

    if (competitorCount === 0) {
      // Only templates without competitor placeholders
      return !needs1 && !needs2 && !needs3;
    }
    if (competitorCount === 1) {
      return !needs2 && !needs3;
    }
    if (competitorCount === 2) {
      return !needs3;
    }
    return true;
  });
}

function sortBySeed(
  templates: QuestionTemplate[],
  brandId: string,
): QuestionTemplate[] {
  return [...templates].sort((a, b) => {
    const ha = stableHash(`${brandId}|${a.id}|${FASHION_PACK_VERSION}`);
    const hb = stableHash(`${brandId}|${b.id}|${FASHION_PACK_VERSION}`);
    if (ha !== hb) return ha - hb;
    return a.id.localeCompare(b.id);
  });
}

function pickTemplates(
  pool: QuestionTemplate[],
  count: number,
  brandId: string,
): QuestionTemplate[] {
  return sortBySeed(pool, brandId).slice(0, count);
}

function assertQuality(
  questions: GeneratedQuestion[],
  brandName: string,
): GeneratedQuestion[] {
  const seen = new Set<string>();
  const cleaned: GeneratedQuestion[] = [];

  for (const q of questions) {
    const text = q.text.trim();
    if (!text) {
      throw new Error("Generated empty question text");
    }
    if (/\{[a-zA-Z0-9_]+\}/.test(text)) {
      throw new Error(`Unresolved placeholder in: ${text}`);
    }
    if (/\bundefined\b|\bnull\b/i.test(text)) {
      throw new Error(`Invalid token in: ${text}`);
    }
    if (seen.has(text)) {
      throw new Error(`Duplicate question: ${text}`);
    }
    seen.add(text);

    const mentionsBrand = text.includes(brandName);
    if (q.brandPresent && !mentionsBrand) {
      throw new Error(`Brand-present question missing brand name: ${text}`);
    }
    if (!q.brandPresent && mentionsBrand) {
      throw new Error(`Brand-absent question unexpectedly contains brand: ${text}`);
    }

    cleaned.push({ ...q, text });
  }

  return cleaned;
}

/**
 * Deterministic Fashion Pack question generator.
 * Same brand.id + fashion-v0.1 → same 30 questions.
 */
export function generateFashionQuestions(
  ctx: BrandGenerationContext,
): GeneratedQuestion[] {
  const brandId = ctx.id;
  const competitorCount = ctx.competitors.filter((c) => c.name.trim()).length;
  const values = buildPlaceholders(ctx);

  const byCategory = (category: QuestionCategory) =>
    FASHION_QUESTION_BANK.filter((t) => t.category === category);

  const selected: QuestionTemplate[] = [];

  selected.push(
    ...pickTemplates(byCategory("brand_cognition"), FASHION_PLAN_QUOTA.brand_cognition, brandId),
  );
  selected.push(
    ...pickTemplates(
      byCategory("category_discovery"),
      FASHION_PLAN_QUOTA.category_discovery,
      brandId,
    ),
  );

  // Audience: enforce 2 with brand + 5 without
  const audiencePool = byCategory("audience_scenario");
  selected.push(
    ...pickTemplates(
      audiencePool.filter((t) => t.brandPresent),
      AUDIENCE_SCENARIO_BRAND_PRESENT_COUNT,
      brandId,
    ),
  );
  selected.push(
    ...pickTemplates(
      audiencePool.filter((t) => !t.brandPresent),
      AUDIENCE_SCENARIO_BRAND_ABSENT_COUNT,
      brandId,
    ),
  );

  const competitorPool = filterCompetitorTemplates(
    byCategory("competitor_comparison"),
    competitorCount,
  );
  selected.push(
    ...pickTemplates(competitorPool, FASHION_PLAN_QUOTA.competitor_comparison, brandId),
  );

  selected.push(
    ...pickTemplates(
      byCategory("purchase_decision"),
      FASHION_PLAN_QUOTA.purchase_decision,
      brandId,
    ),
  );

  if (selected.length !== 30) {
    throw new Error(`Expected 30 templates, got ${selected.length}`);
  }

  // Final stable order for display / storage
  const ordered = sortBySeed(selected, brandId);

  const generated: GeneratedQuestion[] = ordered.map((tpl) => ({
    text: renderTemplate(tpl.template, values),
    questionType: tpl.category,
    persona: tpl.persona,
    scenario: tpl.scenario,
    purchaseIntent: tpl.purchaseIntent,
    brandPresent: tpl.brandPresent,
    source: FASHION_PACK_VERSION,
    templateId: tpl.id,
  }));

  return assertQuality(generated, values.brand);
}
