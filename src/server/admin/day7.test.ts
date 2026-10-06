import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { saveObservationFactReviews, listUnsupportedClaimsFromAnalysis } from "@/server/admin/fact-review";
import { clientRiskExplanation } from "@/server/reports/builder";
import { FASHION_PACK_VERSION } from "@/domain/industry-packs/fashion";

describe("fact review", () => {
  let observationId = "";
  let brandId = "";
  const analysisJson = JSON.stringify({
    observationId: "x",
    unsupportedClaims: [{ claim: "门店 200 家", reason: "资料未提供" }],
  });

  beforeAll(async () => {
    const brand = await prisma.brand.create({
      data: {
        name: "Fact Review Brand",
        industry: "品牌女装",
        questions: {
          create: {
            text: "测试",
            questionType: "brand_knowledge",
            brandPresent: true,
            source: FASHION_PACK_VERSION,
          },
        },
      },
    });
    brandId = brand.id;
    const question = await prisma.question.findFirst({ where: { brandId } });
    const job = await prisma.scanJob.create({
      data: { brandId, totalTasks: 1, usageAccountingVersion: "attempts-v1" },
    });
    const obs = await prisma.observation.create({
      data: {
        scanJobId: job.id,
        questionId: question!.id,
        provider: "deepseek",
        model: "deepseek-flash",
        analysisJson,
        status: "completed",
      },
    });
    observationId = obs.id;
  });

  afterAll(async () => {
    if (brandId) await prisma.brand.delete({ where: { id: brandId } }).catch(() => undefined);
  });

  it("does not overwrite analysisJson", async () => {
    const before = await prisma.observation.findUnique({ where: { id: observationId } });
    await saveObservationFactReviews({
      observationId,
      reviews: [{ index: 0, status: "confirmed_false", note: "不存在" }],
    });
    const after = await prisma.observation.findUnique({ where: { id: observationId } });
    expect(after?.analysisJson).toBe(before?.analysisJson);
    expect(after?.factReviewStatus).toBe("confirmed_false");
    const claims = listUnsupportedClaimsFromAnalysis(after?.analysisJson ?? null, after?.factReviewJson ?? null);
    expect(claims[0]?.status).toBe("confirmed_false");
  });
});

describe("client risk copy", () => {
  it("does not call unverified claims false", () => {
    expect(clientRiskExplanation({ confirmedFalse: 0 })).toMatch(/未提供的具体信息/);
    expect(clientRiskExplanation({ confirmedFalse: 0 })).not.toMatch(/错误品牌信息/);
  });

  it("uses confirmed false wording only after review", () => {
    expect(clientRiskExplanation({ confirmedFalse: 1 })).toMatch(/错误品牌信息/);
  });
});
