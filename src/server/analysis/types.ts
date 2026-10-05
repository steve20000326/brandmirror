import type { AnalyzerResult, BrandDossier } from "@/ai/analyzers/types";
import type { GeoMetrics } from "./metrics";

export const ANALYSIS_PROCESS_LIMIT = 15;
export const ANALYSIS_ANALYZER_CONCURRENCY = 2;

export type AnalysisProgress = {
  scanJobId: string;
  analysisStatus: string;
  analyzedTasks: number;
  analysisFailedTasks: number;
  pendingTasks: number;
  totalTasks: number;
  analyzerVersion: string | null;
};

export type AnalysisBundle = {
  progress: AnalysisProgress;
  metrics: GeoMetrics | null;
  profileId: string | null;
};

export function toBrandDossier(brand: {
  name: string;
  industry: string;
  coreProducts: string | null;
  targetAudience: string | null;
  priceTier: string | null;
  desiredPositioning: string | null;
  desiredKeywords: string | null;
  aliasesJson?: string | null;
  competitors: Array<{ name: string }>;
}): BrandDossier {
  return {
    name: brand.name,
    industry: brand.industry,
    coreProducts: brand.coreProducts,
    targetAudience: brand.targetAudience,
    priceTier: brand.priceTier,
    desiredPositioning: brand.desiredPositioning,
    desiredKeywords: brand.desiredKeywords,
    competitors: brand.competitors.map((c) => c.name),
    aliasesJson: brand.aliasesJson ?? null,
  };
}

export function analysisToMetricRow(
  obs: {
    provider: string;
    brandMentioned: boolean | null;
    brandRank: number | null;
    analysisJson: string | null;
    question: { brandPresent: boolean };
  },
  parsed: AnalyzerResult,
  brandName: string,
) {
  return {
    provider: obs.provider,
    brandPresent: obs.question.brandPresent,
    brandName,
    brandMentioned: Boolean(obs.brandMentioned),
    brandRank: parsed.brandRank,
    recommendationStatus: parsed.recommendationStatus,
    recognitionStatus: parsed.recognitionStatus,
    profileAlignment: parsed.profileAlignment,
    competitorMentions: parsed.competitors,
  };
}
