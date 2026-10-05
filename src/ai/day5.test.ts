import { describe, expect, it } from "vitest";
import {
  defaultBrandAliases,
  deriveBrandShortName,
  textMentionsBrand,
} from "@/domain/brands/brand-matcher";
import { detectBrandMention } from "@/ai/analyzers/exact-match";
import { finalizeAnalyzerResult } from "@/ai/analyzers/finalize";
import { buildBrandPortrait } from "@/ai/profile/builder";
import { NO_STABLE_COGNITION } from "@/ai/profile/types";
import { detectDiagnoses } from "@/ai/diagnosis/rules";
import type { DiagnosisFacts } from "@/ai/diagnosis/rules";
import { assertPrescriptionQuality, draftPrescriptions } from "@/ai/prescriptions/rules";
import type { AnalyzerResult } from "@/ai/analyzers/types";
import type { GeoMetrics } from "@/server/analysis/metrics";

const aliasesJson = JSON.stringify(["澜序女装", "澜序"]);

describe("brand alias matcher", () => {
  it("recognizes 澜序 as an alias of 澜序女装", () => {
    expect(deriveBrandShortName("澜序女装")).toBe("澜序");
    expect(defaultBrandAliases("澜序女装")).toEqual(["澜序女装", "澜序"]);
    expect(textMentionsBrand("澜序属于什么价位？", "澜序女装", aliasesJson)).toBe(true);
    expect(detectBrandMention("澜序属于什么价位？", "澜序女装", aliasesJson)).toBe(true);
    expect(textMentionsBrand("推荐哥弟和朗姿", "澜序女装", aliasesJson)).toBe(false);
  });

  it("does not strip 集团/中国 as aliases", () => {
    expect(deriveBrandShortName("澜序集团")).toBeNull();
    expect(deriveBrandShortName("中国澜序")).toBeNull();
  });
});

describe("alias finalize", () => {
  it("marks brandMentioned for 澜序-only answers", () => {
    const result = finalizeAnalyzerResult({
      llm: {
        observationId: "qwen-price",
        answerStatus: "answered",
        recommendationStatus: "mentioned",
        brandRank: 1,
        sentiment: "neutral",
        recognitionStatus: "unsupported_specifics",
        profileAlignment: {
          targetAudience: null,
          priceTier: 0,
          coreProducts: null,
          positioning: null,
          keywords: null,
        },
        claimedAttributes: {
          audience: [],
          priceTier: "大众",
          style: [],
          scenarios: [],
          productCategories: [],
          positioning: [],
        },
        competitors: [],
        unsupportedClaims: [{ claim: "价格猜测", reason: "资料未提供价格" }],
        confidence: 0.6,
      },
      rawResponse: "澜序大概是一千到两千的大众价位。",
      brandPresent: true,
      dossier: {
        name: "澜序女装",
        industry: "品牌女装",
        coreProducts: null,
        targetAudience: null,
        priceTier: "中高端",
        desiredPositioning: null,
        desiredKeywords: null,
        competitors: [],
        aliasesJson,
      },
    });
    expect(result.recognitionStatus).toBe("unsupported_specifics");
    expect(result.recommendationStatus).not.toBe("absent");
  });

  it("upgrades unknown to unsupported_specifics when price numbers are invented", () => {
    const result = finalizeAnalyzerResult({
      llm: {
        observationId: "qwen-price-2",
        answerStatus: "answered",
        recommendationStatus: "mentioned",
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
        confidence: 0.4,
      },
      rawResponse: "澜序单件大约在1500元到2800元，属于大众价位。",
      brandPresent: true,
      dossier: {
        name: "澜序女装",
        industry: "品牌女装",
        coreProducts: null,
        targetAudience: null,
        priceTier: "中高端",
        desiredPositioning: null,
        desiredKeywords: null,
        competitors: [],
        aliasesJson,
      },
    });
    expect(result.recognitionStatus).toBe("unsupported_specifics");
  });
});

function emptyAlignment() {
  return {
    targetAudience: null,
    priceTier: null,
    coreProducts: null,
    positioning: null,
    keywords: null,
  } as const;
}

function unknownAnalysis(): AnalyzerResult {
  return {
    observationId: "x",
    answerStatus: "insufficient_info",
    recommendationStatus: "absent",
    brandRank: null,
    sentiment: "neutral",
    recognitionStatus: "unknown",
    profileAlignment: emptyAlignment(),
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
    confidence: 0.8,
  };
}

function metrics(over: Partial<GeoMetrics> = {}): GeoMetrics {
  const provider = {
    awareness: 0,
    recommendation: 0,
    discovery: 0,
    alignment: 0,
    competitor: 0,
    hallucinationRisk: 16.7,
  };
  return {
    awareness: 1.4,
    recommendation: 0,
    discovery: 0,
    alignment: 0.3,
    competitor: 0,
    aiBrandScore: 0.3,
    hallucinationRisk: 5.6,
    byProvider: {
      deepseek: { ...provider, hallucinationRisk: 0, awareness: 4.2 },
      "tencent-hy": { ...provider, hallucinationRisk: 0 },
      qwen: { ...provider, hallucinationRisk: 16.7 },
    },
    competitorPoints: {
      brand: 0,
      competitors: { 哥弟: 4, 玖姿: 2.9, 朗姿: 2.5 },
      leader: "哥弟",
      leaderPoints: 4,
    },
    recognitionCounts: {},
    ...over,
  };
}

describe("AI brand profile honesty", () => {
  it("outputs 暂无稳定认知 instead of inventing a fashion profile", () => {
    const portrait = buildBrandPortrait(
      {
        name: "澜序女装",
        targetAudience: "30～45岁城市职业女性",
        priceTier: "中高端",
        desiredPositioning: "现代、克制、有品质感的都市职业女性品牌",
        desiredKeywords: "都市职业女性",
        coreProducts: "通勤西装",
      },
      [
        {
          provider: "qwen",
          brandPresent: true,
          brandMentioned: true,
          analysis: unknownAnalysis(),
        },
      ],
      metrics(),
    );
    expect(portrait.hasStableCognition).toBe(false);
    expect(portrait.audience.summary).toBe(NO_STABLE_COGNITION);
    expect(portrait.priceTier.summary).toBe(NO_STABLE_COGNITION);
    expect(portrait.executiveSummary).toMatch(/尚未形成稳定/);
    expect(portrait.executiveSummary).not.toMatch(/中高端都市职业女装品牌/);
  });
});

function lanxuFacts(portrait = buildBrandPortrait(
  {
    name: "澜序女装",
    targetAudience: "30～45岁",
    priceTier: "中高端",
    desiredPositioning: "现代轻商务",
    desiredKeywords: "通勤",
    coreProducts: "西装",
  },
  [],
  metrics(),
)): DiagnosisFacts {
  return {
    brandName: "澜序女装",
    metrics: metrics(),
    portrait,
    absentQuestionCount: 54,
    absentMentionCount: 0,
    presentQuestionCount: 36,
    recommendedOnAbsent: 0,
    desiredAudience: "30～45岁",
    desiredPositioning: "现代轻商务",
    desiredPriceTier: "中高端",
  };
}

describe("diagnosis rules", () => {
  it("fires LOW_AWARENESS LOW_DISCOVERY LOW_RECOMMENDATION COMPETITOR HALLUCINATION", () => {
    const items = detectDiagnoses(lanxuFacts());
    const codes = items.map((d) => d.code);
    expect(codes).toContain("LOW_AWARENESS");
    expect(codes).toContain("LOW_DISCOVERY");
    expect(codes).toContain("LOW_RECOMMENDATION");
    expect(codes).toContain("COMPETITOR_DOMINATED");
    expect(codes).toContain("HALLUCINATION_RISK");
    for (const d of items) {
      expect(d.evidence.length).toBeGreaterThan(0);
      expect(["high", "medium", "low"]).toContain(d.severity);
    }
    expect(items.slice(0, 5).length).toBeLessThanOrEqual(5);
  });
});

describe("prescriptions", () => {
  it("starts with brand facts for a low-cognition brand and stays 5-10", () => {
    const diagnoses = detectDiagnoses(lanxuFacts());
    const items = draftPrescriptions({
      brandName: "澜序女装",
      industry: "品牌女装",
      targetAudience: "30～45岁城市职业女性",
      priceTier: "中高端",
      desiredPositioning: "现代轻商务",
      coreProducts: "通勤西装",
      metrics: metrics(),
      portrait: lanxuFacts().portrait,
      diagnoses,
    });
    assertPrescriptionQuality(items);
    expect(items.length).toBeGreaterThanOrEqual(5);
    expect(items.length).toBeLessThanOrEqual(10);
    expect(items[0].title).toMatch(/事实/);
    expect(items[0].title).not.toMatch(/年轻化/);
    for (const item of items) {
      expect(item.evidence.length).toBeGreaterThan(0);
      expect(item.diagnosis.length).toBeGreaterThan(0);
      expect(item.action.length).toBeGreaterThan(0);
    }
  });
});
