import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { generateScanReport } from "./engine";
import type { AnalyzerChat } from "@/ai/analyzers/observation-analyzer";
import { FASHION_PACK_VERSION } from "@/domain/industry-packs/fashion";

const noopChat: AnalyzerChat = {
  async chat() {
    return { provider: "deepseek", model: "deepseek-flash", content: "not-json" };
  },
};

describe("report persist idempotency", () => {
  let scanJobId = "";
  let brandId = "";

  beforeAll(async () => {
    const brand = await prisma.brand.create({
      data: {
        name: "澜序女装",
        industry: "品牌女装",
        targetAudience: "30～45岁城市职业女性",
        priceTier: "中高端",
        desiredPositioning: "现代轻商务",
        aliasesJson: JSON.stringify(["澜序女装", "澜序"]),
        competitors: { create: [{ name: "哥弟" }, { name: "玖姿" }, { name: "朗姿" }] },
        questions: {
          create: [
            {
              text: "通勤穿什么",
              questionType: "scenario",
              brandPresent: false,
              source: FASHION_PACK_VERSION,
              enabled: true,
            },
            {
              text: "澜序女装什么价位",
              questionType: "price",
              brandPresent: true,
              source: FASHION_PACK_VERSION,
              enabled: true,
            },
          ],
        },
      },
      include: { questions: true },
    });
    brandId = brand.id;
    const job = await prisma.scanJob.create({
      data: {
        brandId: brand.id,
        status: "completed",
        totalTasks: 2,
        completedTasks: 2,
        analysisStatus: "completed",
      },
    });
    scanJobId = job.id;
    await prisma.observation.createMany({
      data: brand.questions.map((q) => ({
        scanJobId: job.id,
        questionId: q.id,
        provider: "qwen",
        model: "test",
        status: "completed",
        analysisStatus: "completed",
        brandMentioned: q.brandPresent,
        rawResponse: q.brandPresent
          ? "澜序大概一千到两千，大众价位。"
          : "可以看哥弟。",
        analysisJson: JSON.stringify({
          observationId: q.id,
          answerStatus: "answered",
          recommendationStatus: "absent",
          brandRank: null,
          sentiment: "neutral",
          recognitionStatus: q.brandPresent ? "unsupported_specifics" : null,
          profileAlignment: {
            targetAudience: null,
            priceTier: null,
            coreProducts: null,
            positioning: null,
            keywords: null,
          },
          claimedAttributes: {
            audience: [],
            priceTier: q.brandPresent ? "大众" : null,
            style: [],
            scenarios: [],
            productCategories: [],
            positioning: [],
          },
          competitors: q.brandPresent ? [] : [{ name: "哥弟", rank: 1, mentioned: true }],
          unsupportedClaims: q.brandPresent
            ? [{ claim: "大众价位", reason: "资料未支持" }]
            : [],
          confidence: 0.5,
        }),
      })),
    });
  });

  afterAll(async () => {
    if (brandId) await prisma.brand.delete({ where: { id: brandId } }).catch(() => undefined);
  });

  it("does not duplicate diagnosis or prescription rows", async () => {
    await generateScanReport(scanJobId, noopChat);
    await generateScanReport(scanJobId, noopChat);
    const d = await prisma.diagnosis.count({ where: { scanJobId } });
    const p = await prisma.prescription.count({ where: { scanJobId } });
    expect(d).toBeGreaterThan(0);
    expect(d).toBeLessThanOrEqual(5);
    expect(p).toBeGreaterThanOrEqual(5);
    expect(p).toBeLessThanOrEqual(10);
    const d2 = await prisma.diagnosis.count({ where: { scanJobId } });
    expect(d2).toBe(d);
  });
});
