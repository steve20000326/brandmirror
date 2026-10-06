import { prisma } from "@/lib/prisma";

export const USAGE_ACCOUNTING_V1 = "attempts-v1";

export type ScanAccounting = {
  scanJobId: string;
  legacy: boolean;
  observations: number;
  completed: number;
  failed: number;
  apiAttempts: number;
  successfulApiCalls: number;
  retryCalls: number;
  analyzerCalls: number;
  diagnosisCalls: number;
  prescriptionCalls: number;
  modelUsageRows: number;
  totalTokens: number;
};

export async function loadScanAccounting(scanJobId: string): Promise<ScanAccounting | null> {
  const job = await prisma.scanJob.findUnique({
    where: { id: scanJobId },
    include: {
      observations: { select: { status: true, apiAttemptCount: true } },
      modelUsage: {
        select: { purpose: true, usageEventType: true, totalTokens: true },
      },
    },
  });
  if (!job) return null;

  const observations = job.observations.length;
  const completed = job.observations.filter((o) => o.status === "completed").length;
  const failed = job.observations.filter((o) => o.status === "failed").length;
  const apiAttempts = job.observations.reduce((sum, o) => sum + o.apiAttemptCount, 0);
  const retryCalls = job.observations.reduce((sum, o) => sum + Math.max(0, o.apiAttemptCount - 1), 0);
  const usage = job.modelUsage;
  const purposeCount = (purpose: string) => usage.filter((u) => (u.purpose || "scan") === purpose).length;

  return {
    scanJobId,
    legacy: job.usageAccountingVersion !== USAGE_ACCOUNTING_V1,
    observations,
    completed,
    failed,
    apiAttempts,
    successfulApiCalls: completed,
    retryCalls,
    analyzerCalls: purposeCount("analysis"),
    diagnosisCalls: purposeCount("diagnosis"),
    prescriptionCalls: purposeCount("prescription"),
    modelUsageRows: usage.length,
    totalTokens: usage.reduce((sum, u) => sum + u.totalTokens, 0),
  };
}
