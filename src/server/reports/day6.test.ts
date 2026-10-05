import { describe, expect, it } from "vitest";
import { calculateTokenCost } from "@/ai/pricing/calculator";
import { createShareToken } from "@/server/reports/share";
import { detectBrandMirrorStage } from "@/server/reports/stage";
import { buildClientReportViewModel, getReportStatus } from "@/server/reports/builder";
import { aggregateUsage } from "@/server/admin/usage";
import { signAdminSession, verifyAdminPassword, verifyAdminSession } from "@/server/admin/auth";
import type { GeoMetrics } from "@/server/analysis/metrics";
import { NO_STABLE_COGNITION } from "@/ai/profile/types";

const metrics: GeoMetrics = {
  awareness: 1.4,
  recommendation: 0,
  discovery: 0,
  alignment: 0.6,
  competitor: 0,
  aiBrandScore: 0.4,
  hallucinationRisk: 11.1,
  byProvider: {
    deepseek: {
      awareness: 4.2,
      recommendation: 0,
      discovery: 0,
      alignment: 0,
      competitor: 0,
      hallucinationRisk: 8.3,
    },
    "tencent-hy": {
      awareness: 0,
      recommendation: 0,
      discovery: 0,
      alignment: 0,
      competitor: 0,
      hallucinationRisk: 0,
    },
    qwen: {
      awareness: 0,
      recommendation: 0,
      discovery: 0,
      alignment: 1.7,
      competitor: 0,
      hallucinationRisk: 25,
    },
  },
  competitorPoints: { brand: 0, competitors: {}, leader: null, leaderPoints: 0 },
  recognitionCounts: {},
};

describe("BrandMirror stage", () => {
  it("marks 澜序 as Stage A", () => {
    const stage = detectBrandMirrorStage(metrics);
    expect(stage.id).toBe("A");
    expect(stage.title).toBe("AI尚未形成品牌认知");
  });
});

describe("client report view model", () => {
  it("keeps AI Brand Score from stored metrics and stays Stage A", () => {
    const view = buildClientReportViewModel({
      brand: {
        name: "澜序女装",
        industry: "品牌女装",
        isCalibration: true,
        targetAudience: "30～45岁",
        priceTier: "中高端",
        desiredPositioning: "现代",
        coreProducts: "西装",
      },
      testedAt: "2026-10-05",
      questionCount: 30,
      observationCount: 90,
      unbrandedQuestionCount: 18,
      brandedQuestionCount: 12,
      absentObservationCount: 54,
      analysisStatus: "completed",
      metrics,
      portrait: {
        audience: { summary: NO_STABLE_COGNITION, confidence: 0, evidenceCount: 0, providers: [] },
        priceTier: { summary: NO_STABLE_COGNITION, confidence: 0, evidenceCount: 0, providers: [] },
        style: { primary: [], secondary: [], confidence: 0 },
        scenarios: { strong: [], weak: [] },
        productAssociations: [],
        competitorAssociations: [],
        positiveAssociations: [],
        weakAssociations: [],
        recognitionGaps: [],
        modelDisagreements: [],
        executiveSummary: "当前主流 AI 尚未形成稳定的澜序女装品牌认知。",
        hasStableCognition: false,
        engineVersion: "brand-profile-v0.1",
      },
      summary: "当前主流 AI 尚未形成稳定的澜序女装品牌认知。",
      diagnoses: [
        {
          code: "LOW_DISCOVERY",
          severity: "high",
          title: "internal",
          finding: "发现",
          evidenceJson: JSON.stringify(["54 条无品牌问题中，品牌出现 0 次。"]),
          businessMeaning: "含义",
        },
      ],
      prescriptions: [
        {
          priority: 1,
          title: "建立统一、可核验的基础品牌事实源",
          evidence: "e",
          diagnosis: "d",
          action: "a",
          difficulty: "low",
          timeHorizon: "short",
        },
      ],
    });
    expect(view.scores.aiBrandScore).toBe(0.4);
    expect(view.stage.id).toBe("A");
    expect(view.prescriptions[0].title).toMatch(/事实源/);
    const blob = JSON.stringify(view);
    expect(blob).not.toMatch(/API Key|sk-|stack trace|providerMetricsJson|unsupported_specifics/);
    expect(view.diagnoses[0].title).not.toBe("LOW_DISCOVERY");
    expect(blob).not.toContain("cmuct");
  });
});

describe("share token", () => {
  it("is 128-bit hex", () => {
    const a = createShareToken();
    const b = createShareToken();
    expect(a).toHaveLength(32);
    expect(a).not.toBe(b);
    expect(/^[0-9a-f]{32}$/.test(a)).toBe(true);
  });
});

describe("pricing", () => {
  it("does not invent a combined total across currencies", () => {
    const ds = calculateTokenCost({
      provider: "deepseek",
      model: "deepseek-flash",
      promptTokens: 1_000_000,
      completionTokens: 1_000_000,
    });
    const qw = calculateTokenCost({
      provider: "qwen",
      model: "qwen3.8-flash",
      promptTokens: 1_000_000,
      completionTokens: 1_000_000,
    });
    expect(ds.currency).toBe("USD");
    expect(qw.currency).toBe("CNY");
    expect(ds.totalCost).toBeCloseTo(1.5);
    expect(qw.totalCost).toBeCloseTo(3.5);
  });

  it("leaves Tencent unpriced without env", () => {
    const hy = calculateTokenCost({
      provider: "tencent-hy",
      model: "hy3",
      promptTokens: 1000,
      completionTokens: 1000,
    });
    expect(hy.priced).toBe(false);
    expect(hy.totalCost).toBeNull();
  });
});

describe("usage aggregation", () => {
  const rows = [
    {
      provider: "deepseek",
      purpose: "scan",
      promptTokens: 10,
      completionTokens: 5,
      totalTokens: 15,
      totalCost: 0.01,
      currency: "USD",
      scanJobId: "job-1",
    },
    {
      provider: "qwen",
      purpose: "analysis",
      promptTokens: 20,
      completionTokens: 8,
      totalTokens: 28,
      totalCost: 0.02,
      currency: "CNY",
      scanJobId: "job-1",
    },
    {
      provider: "tencent-hy",
      purpose: "scan",
      promptTokens: 3,
      completionTokens: 1,
      totalTokens: 4,
      totalCost: null,
      currency: null,
      scanJobId: "job-1",
    },
    {
      provider: "deepseek",
      purpose: "scan",
      promptTokens: 1,
      completionTokens: 2,
      totalTokens: 3,
      totalCost: 0,
      currency: "USD",
      scanJobId: null,
    },
  ];

  it("aggregates provider and purpose without mixing currencies", () => {
    const agg = aggregateUsage(rows);
    expect(agg.byProvider.deepseek.requests).toBe(1);
    expect(agg.byPurpose.scan.requests).toBe(2);
    expect(agg.byPurpose.analysis.requests).toBe(1);
    expect(agg.overall.usd).toBeCloseTo(0.01);
    expect(agg.overall.cny).toBeCloseTo(0.02);
    expect(agg.overall.unknownRequests).toBe(1);
    expect(agg.overall.requests).toBe(3);
  });

  it("does not count orphaned test usage as business scan requests", () => {
    const agg = aggregateUsage(rows);
    expect(agg.unattached).toBe(1);
    expect(agg.byPurpose.scan.requests).toBe(2);
  });
});

describe("admin auth helpers", () => {
  it("rejects empty password when configured via env in test", async () => {
    const prev = process.env.ADMIN_PASSWORD;
    process.env.ADMIN_PASSWORD = "secret-test";
    process.env.ADMIN_SECRET = "secret-test";
    expect(verifyAdminPassword("nope")).toBe(false);
    expect(verifyAdminPassword("secret-test")).toBe(true);
    const token = await signAdminSession();
    expect(await verifyAdminSession(token)).toBe(true);
    expect(await verifyAdminSession("tampered")).toBe(false);
    process.env.ADMIN_PASSWORD = prev;
  });
});

describe("report status", () => {
  it("is ready only with profile diagnoses and prescriptions", () => {
    expect(
      getReportStatus({
        portraitJson: "{}",
        diagnosisCount: 5,
        prescriptionCount: 8,
        analysisStatus: "completed",
      }),
    ).toBe("ready");
    expect(
      getReportStatus({
        portraitJson: null,
        diagnosisCount: 5,
        prescriptionCount: 8,
        analysisStatus: "completed",
      }),
    ).toBe("incomplete");
  });
});
