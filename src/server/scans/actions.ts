import { getUnconfiguredScanProviders, listScanProviders } from "@/ai/providers";
import { getIndustryPack } from "@/domain/industry-packs";
import { prisma } from "@/lib/prisma";
import { countPlanQuestions } from "@/server/brands/questions";
import { buildObservationPlan, expectedObservationCount } from "./plan";
import { findActiveScanJob } from "./queries";
import { SCAN_PROVIDER_IDS } from "./types";

export type CreateScanJobResult =
  | { ok: true; scanJobId: string; created: boolean }
  | { ok: false; error: string; missingProviders?: string[] };

/**
 * Create 90 pending observations, or reuse an active ScanJob.
 */
export async function createScanJobForBrand(brandId: string): Promise<CreateScanJobResult> {
  const missing = getUnconfiguredScanProviders();
  if (missing.length > 0) {
    const labels: Record<string, string> = {
      deepseek: "DeepSeek",
      "tencent-hy": "Tencent HY",
      qwen: "Qwen",
    };
    return {
      ok: false,
      error: `${missing.map((id) => labels[id] ?? id).join("、")}尚未配置`,
      missingProviders: missing,
    };
  }

  const brand = await prisma.brand.findUnique({ where: { id: brandId } });
  if (!brand) {
    return { ok: false, error: "品牌不存在" };
  }

  const pack = getIndustryPack(brand.industry);
  if (!pack) {
    return { ok: false, error: "当前行业尚未开放 Industry Pack" };
  }

  const questionCount = await countPlanQuestions(brandId, pack.version);
  if (questionCount !== 30) {
    return { ok: false, error: "请先生成完整的30题测试方案" };
  }

  const active = await findActiveScanJob(brandId);
  if (active) {
    return { ok: true, scanJobId: active.id, created: false };
  }

  const questions = await prisma.question.findMany({
    where: { brandId, source: pack.version, enabled: true },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });

  const models = Object.fromEntries(
    listScanProviders().map((p) => [p.provider, p.model]),
  ) as Record<(typeof SCAN_PROVIDER_IDS)[number], string>;

  const drafts = buildObservationPlan(questions, models);
  const total = expectedObservationCount(questions.length, SCAN_PROVIDER_IDS.length);

  const job = await prisma.$transaction(async (tx) => {
    const created = await tx.scanJob.create({
      data: {
        brandId,
        status: "pending",
        totalTasks: total,
        completedTasks: 0,
        failedTasks: 0,
        usageAccountingVersion: "attempts-v1",
      },
    });

    await tx.observation.createMany({
      data: drafts.map((d) => ({
        scanJobId: created.id,
        questionId: d.questionId,
        provider: d.provider,
        model: d.model,
        status: d.status,
        surfaceType: d.surfaceType,
        searchEnabled: d.searchEnabled,
        promptVersion: d.promptVersion,
      })),
    });

    return created;
  });

  return { ok: true, scanJobId: job.id, created: true };
}
