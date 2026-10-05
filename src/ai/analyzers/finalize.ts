import { analyzerBatchSchema, type AnalyzerResultParsed } from "./schema";
import type { AnalyzerResult, BrandDossier, RecommendationStatus } from "./types";
import { detectBrandMention, detectCompetitorMentions } from "./exact-match";

export function extractJsonText(raw: string): string {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();
  const start = trimmed.search(/[\[{]/);
  if (start >= 0) return trimmed.slice(start);
  return trimmed;
}

export function parseAnalyzerBatch(raw: string): AnalyzerResultParsed[] {
  const json = JSON.parse(extractJsonText(raw)) as unknown;
  return analyzerBatchSchema.parse(json);
}

export function emptyAlignment() {
  return {
    targetAudience: null,
    priceTier: null,
    coreProducts: null,
    positioning: null,
    keywords: null,
  } as const;
}

/**
 * Merge LLM semantics with code-owned exact matches.
 * brandMentioned is never taken from the LLM.
 */
export function finalizeAnalyzerResult(params: {
  llm: AnalyzerResultParsed;
  rawResponse: string;
  brandPresent: boolean;
  dossier: BrandDossier;
}): AnalyzerResult {
  const { llm, rawResponse, brandPresent, dossier } = params;
  const brandMentioned = detectBrandMention(
    rawResponse,
    dossier.name,
    dossier.aliasesJson,
  );
  const competitorHits = detectCompetitorMentions(rawResponse, dossier.competitors);

  let recommendationStatus: RecommendationStatus = llm.recommendationStatus;
  if (!brandMentioned) {
    recommendationStatus = "absent";
  } else if (recommendationStatus === "absent") {
    recommendationStatus = brandPresent ? "mentioned" : "mentioned";
  }

  const brandRank = brandMentioned ? llm.brandRank : null;

  const competitorMap = new Map<string, { name: string; rank: number | null; mentioned: boolean }>();
  for (const name of competitorHits) {
    competitorMap.set(name, { name, rank: null, mentioned: true });
  }
  for (const item of llm.competitors) {
    const existing = competitorMap.get(item.name);
    if (existing) {
      existing.rank = item.rank ?? existing.rank;
      existing.mentioned = true;
    } else if (item.mentioned || detectBrandMention(rawResponse, item.name)) {
      competitorMap.set(item.name, {
        name: item.name,
        rank: item.rank,
        mentioned: true,
      });
    }
  }

  let recognitionStatus = llm.recognitionStatus;
  if (!brandPresent) {
    recognitionStatus = null;
  } else if (
    brandMentioned &&
    (recognitionStatus === "unknown" || recognitionStatus === null) &&
    looksLikeUnsupportedSpecifics(rawResponse, dossier)
  ) {
    recognitionStatus = "unsupported_specifics";
  }

  return {
    observationId: llm.observationId,
    answerStatus: llm.answerStatus,
    recommendationStatus,
    brandRank,
    sentiment: llm.sentiment,
    recognitionStatus,
    profileAlignment: brandPresent ? llm.profileAlignment : emptyAlignment(),
    claimedAttributes: llm.claimedAttributes,
    competitors: [...competitorMap.values()],
    unsupportedClaims: llm.unsupportedClaims,
    confidence: llm.confidence,
  };
}

export function looksLikeUnsupportedSpecifics(rawResponse: string, dossier: BrandDossier): boolean {
  const known = [
    dossier.name,
    dossier.coreProducts,
    dossier.priceTier,
    dossier.targetAudience,
    dossier.desiredPositioning,
    dossier.desiredKeywords,
  ]
    .filter(Boolean)
    .join(" ");
  const prices = rawResponse.match(/\d{3,6}\s*元/g) ?? [];
  const years = rawResponse.match(/(?:19|20)\d{2}\s*年/g) ?? [];
  const extraPrice = prices.some((p) => !known.includes(p.replace(/\s/g, "")));
  const extraYear = years.some((y) => !known.includes(y.replace(/\s/g, "")));
  return extraPrice || extraYear;
}

export { detectBrandMention, detectCompetitorMentions };
