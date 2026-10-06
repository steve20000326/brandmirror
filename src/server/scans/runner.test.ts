import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ProviderError } from "@/ai/providers/errors";
import type { ModelProvider, ModelResponse, ProviderId } from "@/ai/providers/types";
import { prisma } from "@/lib/prisma";
import { createScanJobForBrand } from "./actions";
import { getScanJobById } from "./queries";
import { processScanBatch } from "./runner";
import { FASHION_PACK_VERSION } from "@/domain/industry-packs/fashion";

function fakeProvider(id: ProviderId, fail = false): ModelProvider {
  return {
    provider: id,
    model: `${id}-test`,
    isConfigured: () => true,
    async chat(): Promise<ModelResponse> {
      if (fail) {
        throw new ProviderError({
          message: `${id} failed`,
          code: "http",
          status: 500,
          retryable: true,
        });
      }
      return {
        provider: id,
        model: `${id}-test`,
        content: `answer from ${id}`,
        usage: { promptTokens: 1, completionTokens: 2, totalTokens: 3 },
        latencyMs: 5,
      };
    },
    async testConnection() {
      return { ok: !fail, latencyMs: 1 };
    },
  };
}

describe("scan job persistence", () => {
  let brandId = "";
  const envSnap: Record<string, string | undefined> = {};
  const envKeys = [
    "DEEPSEEK_API_KEY",
    "TENCENT_TOKENHUB_API_KEY",
    "QWEN_API_KEY",
    "QWEN_BASE_URL",
  ];

  beforeAll(async () => {
    for (const key of envKeys) {
      envSnap[key] = process.env[key];
    }
    process.env.DEEPSEEK_API_KEY = "test";
    process.env.TENCENT_TOKENHUB_API_KEY = "test";
    process.env.QWEN_API_KEY = "test";
    process.env.QWEN_BASE_URL = "https://example.com/v1";

    const brand = await prisma.brand.create({
      data: {
        name: "Day3 Test Brand",
        industry: "品牌女装",
        questions: {
          create: Array.from({ length: 30 }, (_, i) => ({
            text: `测试问题 ${i + 1}`,
            questionType: "category_discovery",
            brandPresent: i < 12,
            source: FASHION_PACK_VERSION,
            enabled: true,
          })),
        },
      },
    });
    brandId = brand.id;
  });

  afterAll(async () => {
    if (brandId) {
      await prisma.brand.delete({ where: { id: brandId } }).catch(() => undefined);
    }
    for (const key of envKeys) {
      if (envSnap[key] === undefined) delete process.env[key];
      else process.env[key] = envSnap[key];
    }
    await prisma.$disconnect();
  });

  it("does not create two active ScanJobs", async () => {
    const first = await createScanJobForBrand(brandId);
    const second = await createScanJobForBrand(brandId);
    expect(first.ok && second.ok).toBe(true);
    if (first.ok && second.ok) {
      expect(second.scanJobId).toBe(first.scanJobId);
      expect(second.created).toBe(false);
      const count = await prisma.scanJob.count({ where: { brandId } });
      expect(count).toBe(1);
    }
  });

  it("keeps ScanJob after a refresh-style reload", async () => {
    const latest = await prisma.scanJob.findFirst({ where: { brandId } });
    expect(latest).toBeTruthy();
    const reloaded = await getScanJobById(latest!.id);
    expect(reloaded?.id).toBe(latest!.id);
    expect(reloaded?.totalTasks).toBe(90);
  });

  it("saves rawResponse and lets other providers finish if one fails", async () => {
    const job = await prisma.scanJob.findFirst({ where: { brandId } });
    expect(job).toBeTruthy();

    const getProvider = (id: ProviderId) => fakeProvider(id, id === "qwen");

    // Drain all pending in chunks (90 / 6 = 15)
    for (let i = 0; i < 20; i += 1) {
      const result = await processScanBatch(job!.id, {
        getProvider,
        sleep: async () => undefined,
      });
      if (result.pending === 0) break;
    }

    const rows = await prisma.observation.findMany({ where: { scanJobId: job!.id } });
    const byProvider = (id: string) => rows.filter((r) => r.provider === id);
    expect(byProvider("deepseek").every((r) => r.status === "completed")).toBe(true);
    expect(byProvider("tencent-hy").every((r) => r.status === "completed")).toBe(true);
    expect(byProvider("qwen").every((r) => r.status === "failed")).toBe(true);
    expect(byProvider("deepseek")[0]?.rawResponse).toBe("answer from deepseek");
    expect(rows.every((r) => r.searchEnabled === false)).toBe(true);
    expect(rows.every((r) => r.surfaceType === "model_api")).toBe(true);
    expect(byProvider("deepseek").every((r) => r.apiAttemptCount === 1)).toBe(true);
    expect(byProvider("tencent-hy").every((r) => r.apiAttemptCount === 1)).toBe(true);
    expect(byProvider("qwen").every((r) => r.apiAttemptCount === 3)).toBe(true);

    const usageRows = await prisma.modelUsage.count({ where: { scanJobId: job!.id } });
    expect(usageRows).toBe(0);

    const refreshed = await prisma.scanJob.findUnique({ where: { id: job!.id } });
    expect(refreshed?.usageAccountingVersion).toBe("attempts-v1");
    expect(refreshed?.status).toBe("partial");
    expect(refreshed?.completedTasks).toBe(60);
    expect(refreshed?.failedTasks).toBe(30);
  });
});
