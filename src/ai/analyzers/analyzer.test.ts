import { describe, expect, it } from "vitest";
import { detectBrandMention, detectCompetitorMentions } from "./exact-match";
import { finalizeAnalyzerResult } from "./finalize";
import type { AnalyzerResult } from "./types";
import type { BrandDossier } from "./types";

const dossier: BrandDossier = {
  name: "澜序女装",
  industry: "品牌女装",
  coreProducts: "通勤西装、连衣裙、针织衫、大衣",
  targetAudience: "30～45岁城市职业女性",
  priceTier: "中高端",
  desiredPositioning: "现代、克制、有品质感的都市职业女性品牌",
  desiredKeywords: "都市职业女性",
  competitors: ["玖姿", "朗姿", "哥弟"],
};

function baseLlm(over: Partial<AnalyzerResult> = {}): AnalyzerResult {
  return {
    observationId: "obs-1",
    answerStatus: "answered",
    recommendationStatus: "absent",
    brandRank: null,
    sentiment: "neutral",
    recognitionStatus: "unknown",
    profileAlignment: {
      targetAudience: null,
      priceTier: null,
      coreProducts: null,
      positioning: null,
      keywords: null,
    },
    claimedAttributes: {
      audience: [],
      priceTier: null,
      style: [],
      scenarios: [],
      productCategories: [],
      positioning: [],
    },
    competitors: [],
    unsupportedClaims: [],
    confidence: 0.9,
    ...over,
  };
}

describe("exact match", () => {
  it("does not mark brand when 澜序女装 is absent", () => {
    const text = "国内可以看哥弟、玖姿、朗姿。";
    expect(detectBrandMention(text, "澜序女装")).toBe(false);
    expect(detectCompetitorMentions(text, dossier.competitors)).toEqual([
      "玖姿",
      "朗姿",
      "哥弟",
    ]);
  });

  it("marks brand when 澜序女装 appears, without forcing known_supported", () => {
    const text = "澜序女装公开资料有限，无法判断。";
    expect(detectBrandMention(text, "澜序女装")).toBe(true);
    const result = finalizeAnalyzerResult({
      llm: baseLlm({ recognitionStatus: "unknown", recommendationStatus: "discouraged" }),
      rawResponse: text,
      brandPresent: true,
      dossier,
    });
    expect(result.recognitionStatus).toBe("unknown");
    expect(result.recommendationStatus).not.toBe("absent");
  });
});

describe("recognitionStatus", () => {
  it("keeps unknown when the model says there is no reliable information", () => {
    const result = finalizeAnalyzerResult({
      llm: baseLlm({
        recognitionStatus: "unknown",
        answerStatus: "insufficient_info",
        recommendationStatus: "discouraged",
      }),
      rawResponse: "目前没有关于澜序女装的可靠资料。",
      brandPresent: true,
      dossier,
    });
    expect(result.recognitionStatus).toBe("unknown");
  });

  it("keeps unsupported_specifics for invented founding year", () => {
    const result = finalizeAnalyzerResult({
      llm: baseLlm({
        recognitionStatus: "unsupported_specifics",
        recommendationStatus: "mentioned",
        unsupportedClaims: [
          { claim: "澜序2018年成立", reason: "品牌资料未提供成立时间" },
        ],
      }),
      rawResponse: "澜序女装2018年成立，是一个小众品牌。",
      brandPresent: true,
      dossier,
    });
    expect(result.recognitionStatus).toBe("unsupported_specifics");
  });

  it("keeps contradictory for low-price claim against 中高端 dossier", () => {
    const result = finalizeAnalyzerResult({
      llm: baseLlm({
        recognitionStatus: "contradictory",
        recommendationStatus: "mentioned",
        profileAlignment: {
          targetAudience: null,
          priceTier: 0,
          coreProducts: null,
          positioning: null,
          keywords: null,
        },
      }),
      rawResponse: "澜序女装属于低价大众品牌。",
      brandPresent: true,
      dossier,
    });
    expect(result.recognitionStatus).toBe("contradictory");
  });
});
