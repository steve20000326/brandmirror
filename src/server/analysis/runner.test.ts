import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { processAnalysisBatch } from "./runner";
import type { AnalyzerChat } from "@/ai/analyzers/observation-analyzer";
import { FASHION_PACK_VERSION } from "@/domain/industry-packs/fashion";

function jsonFor(ids: string[], fail = false): string {
  if (fail) return "not-json";
  return JSON.stringify(
    ids.map((id) => ({
      observationId: id,
      answerStatus: "insufficient_info",
      recommendationStatus: "discouraged",
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
      confidence: 0.8,
    })),
  );
}

describe("analysis runner isolation", () => {
  let scanJobId = "";
  let brandId = "";

  beforeAll(async () => {
    const brand = await prisma.brand.create({
      data: {
        name: "澜序女装",
        industry: "品牌女装",
        questions: {
          create: Array.from({ length: 6 }, (_, i) => ({
            text: `分析测试题 ${i + 1} 澜序女装`,
            questionType: "brand_cognition",
            brandPresent: true,
            source: FASHION_PACK_VERSION,
            enabled: true,
          })),
        },
      },
      include: { questions: true },
    });
    brandId = brand.id;
    const job = await prisma.scanJob.create({
      data: {
        brandId: brand.id,
        status: "completed",
        totalTasks: 6,
        completedTasks: 6,
      },
    });
    scanJobId = job.id;
    await prisma.observation.createMany({
      data: brand.questions.map((q, i) => ({
        scanJobId: job.id,
        questionId: q.id,
        provider: i % 2 === 0 ? "deepseek" : "qwen",
        model: "test",
        status: "completed",
        rawResponse: `没有关于澜序女装的可靠资料 ${i}`,
        surfaceType: "model_api",
        searchEnabled: false,
      })),
    });
  });

  afterAll(async () => {
    if (brandId) {
      await prisma.brand.delete({ where: { id: brandId } }).catch(() => undefined);
    }
  });

  it("a failed analyzer batch does not destroy other observations", async () => {
    const chat: AnalyzerChat = {
      async chat({ messages }) {
        const user = messages.find((m) => m.role === "user")?.content ?? "";
        const ids = [...user.matchAll(/"observationId":\s*"([^"]+)"/g)].map((m) => m[1]);
        if (ids.length <= 1) {
          throw new Error("boom");
        }
        return {
          provider: "deepseek",
          model: "deepseek-flash",
          content: jsonFor(ids),
        };
      },
    };

    await processAnalysisBatch(scanJobId, chat);
    const rows = await prisma.observation.findMany({ where: { scanJobId } });
    const completed = rows.filter((r) => r.analysisStatus === "completed");
    const failed = rows.filter((r) => r.analysisStatus === "failed");
    expect(completed.length).toBeGreaterThan(0);
    expect(failed.length).toBeGreaterThan(0);
    expect(completed.length + failed.length).toBe(6);
    expect(completed.every((r) => r.rawResponse?.includes("澜序女装"))).toBe(true);
  });
});
