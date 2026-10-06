import type { AnalyzerResult, ClaimedAttributes } from "@/ai/analyzers/types";
import type { GeoMetrics } from "@/server/analysis/metrics";
import { getIndustryPack } from "@/domain/industry-packs";
import {
  BRAND_PROFILE_VERSION,
  NO_STABLE_COGNITION,
  type BrandPortrait,
  type EvidenceItem,
} from "./types";

const STABLE_MIN_EVIDENCE = 3;
const STABLE_MIN_PROVIDERS = 2;

export type ProfileObservation = {
  provider: string;
  brandPresent: boolean;
  brandMentioned: boolean;
  analysis: AnalyzerResult;
};

export type ProfileBrandInput = {
  name: string;
  industry?: string | null;
  targetAudience: string | null;
  priceTier: string | null;
  desiredPositioning: string | null;
  desiredKeywords: string | null;
  coreProducts: string | null;
};

type Bucket = Map<string, { count: number; providers: Set<string> }>;

function bump(bucket: Bucket, label: string, provider: string) {
  const key = label.trim();
  if (!key) return;
  const existing = bucket.get(key) ?? { count: 0, providers: new Set<string>() };
  existing.count += 1;
  existing.providers.add(provider);
  bucket.set(key, existing);
}

function toItems(bucket: Bucket, min = 1): EvidenceItem[] {
  return [...bucket.entries()]
    .filter(([, v]) => v.count >= min)
    .sort((a, b) => b[1].count - a[1].count)
    .map(([label, v]) => ({
      label,
      evidenceCount: v.count,
      providers: [...v.providers],
    }));
}

function emptyBlock() {
  return {
    summary: NO_STABLE_COGNITION,
    confidence: 0,
    evidenceCount: 0,
    providers: [] as string[],
  };
}

function isStableCognition(analysis: AnalyzerResult): boolean {
  return (
    analysis.recognitionStatus === "known_supported" ||
    analysis.recognitionStatus === "partial_supported"
  );
}

function desiredTokens(text: string | null): string[] {
  if (!text) return [];
  return text
    .split(/[、，,\/｜|；;\s]+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 2);
}

/**
 * Build AI Brand Profile from observations + metrics only.
 * Brand dossier is used for gap comparison, never as AI cognition.
 */
export function buildBrandPortrait(
  brand: ProfileBrandInput,
  observations: ProfileObservation[],
  metrics: GeoMetrics,
): BrandPortrait {
  const audience: Bucket = new Map();
  const price: Bucket = new Map();
  const style: Bucket = new Map();
  const scenarios: Bucket = new Map();
  const products: Bucket = new Map();
  const positioning: Bucket = new Map();
  const competitors: Bucket = new Map();
  const byProviderAttrs: Record<string, ClaimedAttributes[]> = {};

  const present = observations.filter((o) => o.brandPresent);
  const unknownCount = present.filter(
    (o) => o.analysis.recognitionStatus === "unknown" || !o.brandMentioned,
  ).length;
  const unsupportedCount = present.filter(
    (o) =>
      o.analysis.recognitionStatus === "unsupported_specifics" ||
      o.analysis.recognitionStatus === "contradictory",
  ).length;

  for (const obs of observations) {
    if (!obs.brandPresent) {
      if (obs.brandMentioned) {
        for (const c of obs.analysis.competitors) {
          if (c.mentioned) bump(competitors, c.name, obs.provider);
        }
      }
      continue;
    }
    if (!obs.brandMentioned || !isStableCognition(obs.analysis)) continue;
    const attrs = obs.analysis.claimedAttributes;
    (byProviderAttrs[obs.provider] ??= []).push(attrs);
    for (const a of attrs.audience) bump(audience, a, obs.provider);
    if (attrs.priceTier) bump(price, attrs.priceTier, obs.provider);
    for (const s of attrs.style) bump(style, s, obs.provider);
    for (const s of attrs.scenarios) bump(scenarios, s, obs.provider);
    for (const p of attrs.productCategories) bump(products, p, obs.provider);
    for (const p of attrs.positioning) bump(positioning, p, obs.provider);
  }

  const audienceItems = toItems(audience);
  const priceItems = toItems(price);
  const styleItems = toItems(style);
  const scenarioItems = toItems(scenarios);
  const productItems = toItems(products);
  const positioningItems = toItems(positioning);
  const competitorItems = toItems(competitors);

  const topAudience = audienceItems[0];
  const topPrice = priceItems[0];
  const stableAudience =
    topAudience &&
    topAudience.evidenceCount >= STABLE_MIN_EVIDENCE &&
    topAudience.providers.length >= STABLE_MIN_PROVIDERS;
  const stablePrice =
    topPrice &&
    topPrice.evidenceCount >= STABLE_MIN_EVIDENCE &&
    topPrice.providers.length >= STABLE_MIN_PROVIDERS;
  const stableStyle =
    styleItems[0] &&
    styleItems[0].evidenceCount >= STABLE_MIN_EVIDENCE &&
    styleItems[0].providers.length >= STABLE_MIN_PROVIDERS;

  const hasStableCognition = Boolean(stableAudience || stablePrice || stableStyle);

  const desiredScenarioTokens = [
    ...desiredTokens(brand.desiredKeywords),
    ...desiredTokens(brand.desiredPositioning),
  ];
  const strongScenarios = scenarioItems.filter(
    (s) => s.evidenceCount >= STABLE_MIN_EVIDENCE && s.providers.length >= 1,
  );
  const weakScenarios: EvidenceItem[] = desiredScenarioTokens
    .filter((token) => !scenarioItems.some((s) => s.label.includes(token) || token.includes(s.label)))
    .map((label) => ({ label, evidenceCount: 0, providers: [] }));

  const recognitionGaps: string[] = [];
  if (unknownCount >= present.length * 0.5) {
    recognitionGaps.push("多数品牌相关提问中，模型表示没有稳定、可核验的品牌资料。");
  }
  if (metrics.discovery < 20) {
    recognitionGaps.push("无品牌提问中几乎不会自然想起该品牌。");
  }
  if (unsupportedCount > 0) {
    recognitionGaps.push("部分模型在缺少资料时仍给出具体但未经品牌资料支持的描述。");
  }

  const modelDisagreements = collectDisagreements(byProviderAttrs);

  let executiveSummary = NO_STABLE_COGNITION;
  if (!hasStableCognition) {
    executiveSummary = `当前主流 AI 尚未形成稳定的${brand.name}品牌认知。`;
  } else {
    const bits = [
      stableAudience ? topAudience.label : null,
      stablePrice ? topPrice.label : null,
      stableStyle ? styleItems[0].label : null,
    ].filter(Boolean);
    executiveSummary = `AI 对${brand.name}形成了有限认知，高频描述集中在：${bits.join("、")}。`;
  }

  return {
    audience: stableAudience
      ? {
          summary: topAudience.label,
          confidence: Math.min(1, topAudience.evidenceCount / 8),
          evidenceCount: topAudience.evidenceCount,
          providers: topAudience.providers,
        }
      : emptyBlock(),
    priceTier: stablePrice
      ? {
          summary: topPrice.label,
          confidence: Math.min(1, topPrice.evidenceCount / 8),
          evidenceCount: topPrice.evidenceCount,
          providers: topPrice.providers,
        }
      : emptyBlock(),
    style: {
      primary: stableStyle ? styleItems.slice(0, 3) : [],
      secondary: stableStyle ? styleItems.slice(3, 6) : [],
      confidence: stableStyle ? Math.min(1, styleItems[0].evidenceCount / 8) : 0,
    },
    scenarios: {
      strong: hasStableCognition ? strongScenarios : [],
      weak: hasStableCognition ? weakScenarios : [],
    },
    productAssociations: hasStableCognition ? productItems.slice(0, 6) : [],
    competitorAssociations: competitorItems.slice(0, 6),
    positiveAssociations: hasStableCognition ? positioningItems.slice(0, 4) : [],
    weakAssociations: [],
    recognitionGaps,
    modelDisagreements,
    executiveSummary,
    hasStableCognition,
    engineVersion: BRAND_PROFILE_VERSION,
    industryAttributes: collectIndustryAttributes(brand, present),
  };
}

function collectIndustryAttributes(
  brand: ProfileBrandInput,
  present: ProfileObservation[],
): Record<string, unknown> {
  const pack = getIndustryPack(brand.industry ?? "");
  const extras: Record<string, string[]> = {};
  for (const obs of present) {
    const raw = obs.analysis.claimedAttributes.industryAttributes ?? {};
    for (const [key, values] of Object.entries(raw)) {
      extras[key] = [...new Set([...(extras[key] ?? []), ...values])];
    }
  }
  return {
    packId: pack?.id ?? null,
    dimensions: pack?.getProfileDimensions() ?? [],
    extras,
  };
}

function collectDisagreements(
  byProvider: Record<string, ClaimedAttributes[]>,
): BrandPortrait["modelDisagreements"] {
  const providers = Object.keys(byProvider);
  if (providers.length < 2) return [];
  const disagreements: BrandPortrait["modelDisagreements"] = [];

  const priceViews = providers
    .map((provider) => {
      const prices = byProvider[provider].map((a) => a.priceTier).filter(Boolean) as string[];
      return prices[0] ? { provider, value: prices[0] } : null;
    })
    .filter((v): v is { provider: string; value: string } => Boolean(v));
  const uniquePrices = new Set(priceViews.map((v) => v.value));
  if (uniquePrices.size >= 2) {
    disagreements.push({ dimension: "价格带", views: priceViews });
  }
  return disagreements;
}
