import type { ProviderId } from "@/ai/providers/types";
import type {
  ProfileAlignment,
  RecognitionStatus,
  RecommendationStatus,
} from "@/ai/analyzers/types";

export type MetricRow = {
  provider: string;
  brandPresent: boolean;
  brandName: string;
  brandMentioned: boolean;
  brandRank: number | null;
  recommendationStatus: RecommendationStatus;
  recognitionStatus: RecognitionStatus | null;
  profileAlignment: ProfileAlignment;
  competitorMentions: Array<{ name: string; rank: number | null; mentioned: boolean }>;
};

export type ProviderMetrics = {
  awareness: number;
  recommendation: number;
  discovery: number;
  alignment: number;
  competitor: number;
  hallucinationRisk: number;
};

export type CompetitorPoints = {
  brand: number;
  competitors: Record<string, number>;
  leader: string | null;
  leaderPoints: number;
};

export type GeoMetrics = {
  awareness: number;
  recommendation: number;
  discovery: number;
  alignment: number;
  competitor: number;
  aiBrandScore: number;
  hallucinationRisk: number;
  byProvider: Record<string, ProviderMetrics>;
  competitorPoints: CompetitorPoints;
  recognitionCounts: Record<string, Record<RecognitionStatus | "null", number>>;
};

export function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

export function recommendationPoints(
  status: RecommendationStatus,
  rank: number | null,
): number {
  if (status === "recommended") {
    if (rank === 1) return 1;
    if (rank === 2) return 0.85;
    if (rank === 3) return 0.7;
    if (rank !== null && rank <= 5) return 0.5;
    return 0.35;
  }
  if (status === "mentioned") return 0.15;
  if (status === "compared") return 0.1;
  return 0;
}

export function awarenessPoints(status: RecognitionStatus | null): number {
  if (status === "known_supported") return 1;
  if (status === "partial_supported") return 0.5;
  return 0;
}

export function alignmentPoints(alignment: ProfileAlignment): number {
  const values = [
    alignment.targetAudience,
    alignment.priceTier,
    alignment.coreProducts,
    alignment.positioning,
    alignment.keywords,
  ];
  const covered = values.filter((v) => v !== null);
  const coverage = covered.length / values.length;
  if (covered.length === 0) return 0;
  const dimensionAlignment =
    covered.reduce((s: number, v) => s + Number(v ?? 0), 0) / covered.length;
  return coverage * dimensionAlignment;
}

export function hallucinationFlag(status: RecognitionStatus | null): number {
  if (status === "unsupported_specifics" || status === "contradictory") return 1;
  return 0;
}

export function mentionRankPoints(mentioned: boolean, rank: number | null): number {
  if (!mentioned) return 0;
  if (rank === 1) return 1;
  if (rank === 2) return 0.8;
  if (rank === 3) return 0.6;
  if (rank === 4) return 0.4;
  if (rank === 5) return 0.25;
  if (rank !== null && rank > 5) return 0.1;
  return 0.1;
}

export function discoveryScore(rows: MetricRow[]): number {
  const subset = rows.filter((r) => !r.brandPresent);
  return mean(subset.map((r) => (r.brandMentioned ? 1 : 0))) * 100;
}

export function recommendationScore(rows: MetricRow[]): number {
  const subset = rows.filter((r) => !r.brandPresent);
  return mean(subset.map((r) => recommendationPoints(r.recommendationStatus, r.brandRank))) * 100;
}

export function awarenessScore(rows: MetricRow[]): number {
  const subset = rows.filter((r) => r.brandPresent);
  return mean(subset.map((r) => awarenessPoints(r.recognitionStatus))) * 100;
}

export function alignmentScore(rows: MetricRow[]): number {
  const subset = rows.filter((r) => r.brandPresent);
  return mean(subset.map((r) => alignmentPoints(r.profileAlignment))) * 100;
}

export function hallucinationRiskScore(rows: MetricRow[]): number {
  const subset = rows.filter((r) => r.brandPresent);
  return mean(subset.map((r) => hallucinationFlag(r.recognitionStatus))) * 100;
}

export function competitorPointsFor(
  rows: MetricRow[],
  brandName: string,
  competitorNames: string[],
): CompetitorPoints {
  const subset = rows.filter((r) => !r.brandPresent);
  let brand = 0;
  const competitors: Record<string, number> = {};
  for (const name of competitorNames) competitors[name] = 0;

  for (const row of subset) {
    brand += mentionRankPoints(row.brandMentioned, row.brandRank);
    for (const name of competitorNames) {
      const hit = row.competitorMentions.find((c) => c.name === name);
      competitors[name] += mentionRankPoints(Boolean(hit?.mentioned), hit?.rank ?? null);
    }
  }

  let leader: string | null = null;
  let leaderPoints = 0;
  for (const [name, points] of Object.entries(competitors)) {
    if (points > leaderPoints) {
      leader = name;
      leaderPoints = points;
    }
  }

  return { brand, competitors, leader, leaderPoints };
}

export function competitorScoreFromPoints(points: CompetitorPoints): number {
  if (points.brand <= 0) return 0;
  const denom = Math.max(points.brand, points.leaderPoints);
  if (denom <= 0) return 0;
  return (points.brand / denom) * 100;
}

export function aiBrandScore(parts: {
  awareness: number;
  recommendation: number;
  discovery: number;
  alignment: number;
  competitor: number;
}): number {
  return (
    parts.awareness * 0.2 +
    parts.recommendation * 0.25 +
    parts.discovery * 0.25 +
    parts.alignment * 0.15 +
    parts.competitor * 0.15
  );
}

const PROVIDERS: ProviderId[] = ["deepseek", "tencent-hy", "qwen"];

export function computeGeoMetrics(
  rows: MetricRow[],
  brandName: string,
  competitorNames: string[],
): GeoMetrics {
  const overallPoints = competitorPointsFor(rows, brandName, competitorNames);
  const overall = {
    awareness: awarenessScore(rows),
    recommendation: recommendationScore(rows),
    discovery: discoveryScore(rows),
    alignment: alignmentScore(rows),
    competitor: competitorScoreFromPoints(overallPoints),
  };

  const byProvider: Record<string, ProviderMetrics> = {};
  for (const provider of PROVIDERS) {
    const subset = rows.filter((r) => r.provider === provider);
    const pts = competitorPointsFor(subset, brandName, competitorNames);
    byProvider[provider] = {
      awareness: round1(awarenessScore(subset)),
      recommendation: round1(recommendationScore(subset)),
      discovery: round1(discoveryScore(subset)),
      alignment: round1(alignmentScore(subset)),
      competitor: round1(competitorScoreFromPoints(pts)),
      hallucinationRisk: round1(hallucinationRiskScore(subset)),
    };
  }

  const recognitionCounts: GeoMetrics["recognitionCounts"] = {};
  for (const provider of PROVIDERS) {
    const counts: Record<RecognitionStatus | "null", number> = {
      known_supported: 0,
      partial_supported: 0,
      unknown: 0,
      unsupported_specifics: 0,
      contradictory: 0,
      null: 0,
    };
    for (const row of rows.filter((r) => r.provider === provider && r.brandPresent)) {
      if (!row.recognitionStatus) counts.null += 1;
      else counts[row.recognitionStatus] += 1;
    }
    recognitionCounts[provider] = counts;
  }

  return {
    awareness: round1(overall.awareness),
    recommendation: round1(overall.recommendation),
    discovery: round1(overall.discovery),
    alignment: round1(overall.alignment),
    competitor: round1(overall.competitor),
    aiBrandScore: round1(aiBrandScore(overall)),
    hallucinationRisk: round1(hallucinationRiskScore(rows)),
    byProvider,
    competitorPoints: overallPoints,
    recognitionCounts,
  };
}

export function hallucinationLabel(score: number): string {
  if (score < 10) return "低";
  if (score < 30) return "需关注";
  if (score < 60) return "较高";
  return "高";
}
