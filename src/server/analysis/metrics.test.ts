import { describe, expect, it } from "vitest";
import {
  aiBrandScore,
  awarenessScore,
  computeGeoMetrics,
  discoveryScore,
  recommendationScore,
  type MetricRow,
} from "./metrics";
import type { ProfileAlignment, RecognitionStatus, RecommendationStatus } from "@/ai/analyzers/types";

const emptyAlign: ProfileAlignment = {
  targetAudience: null,
  priceTier: null,
  coreProducts: null,
  positioning: null,
  keywords: null,
};

function row(over: Partial<MetricRow> & Pick<MetricRow, "brandPresent" | "provider">): MetricRow {
  return {
    brandName: "澜序女装",
    brandMentioned: false,
    brandRank: null,
    recommendationStatus: "absent" as RecommendationStatus,
    recognitionStatus: null as RecognitionStatus | null,
    profileAlignment: emptyAlign,
    competitorMentions: [],
    ...over,
  };
}

describe("GEO metric scopes", () => {
  it("Discovery only uses brandPresent=false", () => {
    const rows: MetricRow[] = [
      row({ provider: "deepseek", brandPresent: false, brandMentioned: true }),
      row({ provider: "deepseek", brandPresent: true, brandMentioned: true }),
    ];
    expect(discoveryScore(rows)).toBe(100);
  });

  it("Recommendation only uses brandPresent=false", () => {
    const rows: MetricRow[] = [
      row({
        provider: "deepseek",
        brandPresent: false,
        recommendationStatus: "recommended",
        brandRank: 1,
      }),
      row({
        provider: "deepseek",
        brandPresent: true,
        recommendationStatus: "recommended",
        brandRank: 1,
      }),
    ];
    expect(recommendationScore(rows)).toBe(100);
  });
});

describe("deterministic scoring", () => {
  it("computes Brand Score with the Day 4 weights", () => {
    const score = aiBrandScore({
      awareness: 10,
      recommendation: 20,
      discovery: 30,
      alignment: 40,
      competitor: 50,
    });
    expect(score).toBe(10 * 0.2 + 20 * 0.25 + 30 * 0.25 + 40 * 0.15 + 50 * 0.15);
  });

  it("returns identical metrics when run twice on the same rows", () => {
    const rows: MetricRow[] = [
      row({ provider: "deepseek", brandPresent: false, brandMentioned: false }),
      row({
        provider: "qwen",
        brandPresent: true,
        brandMentioned: true,
        recognitionStatus: "unsupported_specifics",
      }),
      row({
        provider: "tencent-hy",
        brandPresent: true,
        brandMentioned: true,
        recognitionStatus: "unknown",
      }),
    ];
    const a = computeGeoMetrics(rows, "澜序女装", ["玖姿", "朗姿", "哥弟"]);
    const b = computeGeoMetrics(rows, "澜序女装", ["玖姿", "朗姿", "哥弟"]);
    expect(a).toEqual(b);
    expect(a.hallucinationRisk).toBeGreaterThan(a.aiBrandScore - a.aiBrandScore);
    expect(awarenessScore(rows.filter((r) => r.brandPresent))).toBe(0);
  });

  it("does not include hallucination risk in Brand Score", () => {
    const low = aiBrandScore({
      awareness: 0,
      recommendation: 0,
      discovery: 0,
      alignment: 0,
      competitor: 0,
    });
    expect(low).toBe(0);
  });
});
