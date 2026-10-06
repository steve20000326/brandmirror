import { describe, expect, it } from "vitest";
import { getIndustryPack } from "@/domain/industry-packs";
import { applyPackDiagnosisRules, applyPackPrescriptionRules } from "@/domain/industry-packs/apply";
import { detectDiagnoses } from "@/ai/diagnosis/rules";
import { draftPrescriptions } from "@/ai/prescriptions/rules";
import { buildBrandPortrait } from "@/ai/profile/builder";
import type { GeoMetrics } from "@/server/analysis/metrics";

const metrics: GeoMetrics = {
  awareness: 1.4,
  recommendation: 0,
  discovery: 0,
  alignment: 0.6,
  competitor: 0,
  aiBrandScore: 0.4,
  hallucinationRisk: 11.1,
  byProvider: {
    deepseek: { awareness: 4.2, recommendation: 0, discovery: 0, alignment: 0, competitor: 0, hallucinationRisk: 8.3 },
    "tencent-hy": { awareness: 0, recommendation: 0, discovery: 0, alignment: 0, competitor: 0, hallucinationRisk: 0 },
    qwen: { awareness: 0, recommendation: 0, discovery: 0, alignment: 1.7, competitor: 0, hallucinationRisk: 25 },
  },
  competitorPoints: { brand: 0, competitors: { 朗姿: 12 }, leader: "朗姿", leaderPoints: 12 },
  recognitionCounts: {},
};

describe("industry pack contract", () => {
  it("loads fashion-v0.1 through getIndustryPack", () => {
    const pack = getIndustryPack("品牌女装");
    expect(pack?.id).toBe("fashion");
    expect(pack?.version).toBe("fashion-v0.1");
    expect(pack?.generateQuestions).toBeTypeOf("function");
    expect(pack?.getProfileDimensions().some((d) => d.key === "style")).toBe(true);
    expect(pack?.getDiagnosisRules().length).toBeGreaterThan(0);
    expect(pack?.getPrescriptionRules().length).toBeGreaterThan(0);
    expect(getIndustryPack("食品饮料")).toBeNull();
  });

  it("keeps generic diagnosis copy industry-agnostic until pack overlay", () => {
    const portrait = buildBrandPortrait(
      {
        name: "澜序女装",
        industry: "品牌女装",
        targetAudience: "30～45岁",
        priceTier: "中高端",
        desiredPositioning: "现代轻商务",
        desiredKeywords: "通勤",
        coreProducts: "西装",
      },
      [],
      metrics,
    );
    const facts = {
      brandName: "澜序女装",
      industry: "品牌女装",
      metrics,
      portrait,
      absentQuestionCount: 54,
      absentMentionCount: 0,
      presentQuestionCount: 36,
      recommendedOnAbsent: 0,
      desiredAudience: "30～45岁",
      desiredPositioning: "现代轻商务",
      desiredPriceTier: "中高端",
    };
    const generic = detectDiagnoses(facts);
    const competitor = generic.find((d) => d.code === "COMPETITOR_DOMINATED");
    expect(competitor?.businessMeaning).toMatch(/该品类/);
    expect(competitor?.businessMeaning).not.toMatch(/通勤/);

    const overlaid = applyPackDiagnosisRules(facts, generic);
    expect(overlaid.find((d) => d.code === "COMPETITOR_DOMINATED")?.businessMeaning).toMatch(/通勤/);
    expect(portrait.industryAttributes).toMatchObject({ packId: "fashion" });
  });

  it("lets fashion pack overlay prescription action templates", () => {
    const portrait = buildBrandPortrait(
      {
        name: "澜序女装",
        industry: "品牌女装",
        targetAudience: "30～45岁",
        priceTier: "中高端",
        desiredPositioning: "现代轻商务",
        desiredKeywords: "通勤",
        coreProducts: "西装",
      },
      [],
      metrics,
    );
    const facts = {
      brandName: "澜序女装",
      industry: "品牌女装",
      targetAudience: "30～45岁城市职业女性",
      priceTier: "中高端",
      desiredPositioning: "现代轻商务",
      coreProducts: "通勤西装",
      metrics,
      portrait,
      diagnoses: detectDiagnoses({
        brandName: "澜序女装",
        industry: "品牌女装",
        metrics,
        portrait,
        absentQuestionCount: 54,
        absentMentionCount: 0,
        presentQuestionCount: 36,
        recommendedOnAbsent: 0,
        desiredAudience: "30～45岁",
        desiredPositioning: "现代轻商务",
        desiredPriceTier: "中高端",
      }),
    };
    const generic = draftPrescriptions(facts);
    expect(generic.find((p) => p.category === "scenario")?.action).not.toMatch(/出差两日只需两套/);
    const fashion = applyPackPrescriptionRules(facts, generic);
    expect(fashion.find((p) => p.category === "scenario")?.action).toMatch(/会议、客户拜访/);
  });
});
