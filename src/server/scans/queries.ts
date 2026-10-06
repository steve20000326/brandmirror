import { CONSUMER_BASELINE_PROMPT_VERSION } from "@/ai/prompts/consumer-baseline";
import { getIndustryPack } from "@/domain/industry-packs";
import { prisma } from "@/lib/prisma";
import type { ProviderId } from "@/ai/providers/types";
import { SCAN_PROVIDER_IDS } from "./types";
import type { ProviderProgress, ScanProgress } from "./types";

const ACTIVE_STATUSES = ["pending", "running"];

export async function findActiveScanJob(brandId: string) {
  return prisma.scanJob.findFirst({
    where: {
      brandId,
      status: { in: ACTIVE_STATUSES },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getLatestScanJob(brandId: string) {
  return prisma.scanJob.findFirst({
    where: { brandId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getScanJobById(id: string) {
  return prisma.scanJob.findUnique({
    where: { id },
    include: {
      brand: { select: { id: true, name: true, industry: true } },
    },
  });
}

export async function getScanProgress(scanJobId: string): Promise<ScanProgress | null> {
  const job = await prisma.scanJob.findUnique({ where: { id: scanJobId } });
  if (!job) return null;

  const grouped = await prisma.observation.groupBy({
    by: ["provider", "status"],
    where: { scanJobId },
    _count: { _all: true },
  });

  const byProvider: ProviderProgress[] = SCAN_PROVIDER_IDS.map((provider) => {
    const rows = grouped.filter((g) => g.provider === provider);
    const count = (status: string) =>
      rows.find((r) => r.status === status)?._count._all ?? 0;
    const completed = count("completed");
    const failed = count("failed");
    const pending = count("pending");
    const running = count("running");
    return {
      provider: provider as ProviderId,
      completed,
      failed,
      pending,
      running,
      total: completed + failed + pending + running,
    };
  });

  const pendingTasks = byProvider.reduce((sum, p) => sum + p.pending + p.running, 0);

  return {
    scanJobId: job.id,
    brandId: job.brandId,
    status: job.status,
    totalTasks: job.totalTasks,
    completedTasks: job.completedTasks,
    failedTasks: job.failedTasks,
    pendingTasks,
    byProvider,
    startedAt: job.startedAt,
    completedAt: job.completedAt,
  };
}

export async function listScanObservations(scanJobId: string) {
  return prisma.observation.findMany({
    where: { scanJobId },
    include: {
      question: {
        select: {
          id: true,
          text: true,
          questionType: true,
          brandPresent: true,
        },
      },
    },
    orderBy: [{ questionId: "asc" }, { provider: "asc" }],
  });
}

export async function listScanUsage(scanJobId: string) {
  return prisma.modelUsage.findMany({
    where: { scanJobId },
  });
}

export async function getScanResultMeta(scanJobId: string) {
  const job = await getScanJobById(scanJobId);
  if (!job) return null;
  return {
    job,
    packVersion: getIndustryPack(job.brand.industry)?.version ?? null,
    promptVersion: CONSUMER_BASELINE_PROMPT_VERSION,
    searchEnabled: false,
    surfaceType: "model_api",
  };
}
