import { ANALYZER_PROMPT_VERSION } from "@/ai/analyzers/types";
import type { AnalyzerResult } from "@/ai/analyzers/types";
import { prisma } from "@/lib/prisma";
import type { AnalysisProgress } from "./types";

export async function getAnalysisProgress(scanJobId: string): Promise<AnalysisProgress | null> {
  const job = await prisma.scanJob.findUnique({ where: { id: scanJobId } });
  if (!job) return null;

  const [completed, failed, pending, running] = await Promise.all([
    prisma.observation.count({ where: { scanJobId, analysisStatus: "completed" } }),
    prisma.observation.count({ where: { scanJobId, analysisStatus: "failed" } }),
    prisma.observation.count({ where: { scanJobId, analysisStatus: "not_started" } }),
    prisma.observation.count({ where: { scanJobId, analysisStatus: "running" } }),
  ]);

  return {
    scanJobId,
    analysisStatus: job.analysisStatus,
    analyzedTasks: completed,
    analysisFailedTasks: failed,
    pendingTasks: pending + running,
    totalTasks: job.totalTasks,
    analyzerVersion: job.analyzerVersion,
  };
}

export async function getBrandProfileForScan(scanJobId: string) {
  return prisma.brandProfile.findFirst({
    where: { scanJobId },
    orderBy: { createdAt: "desc" },
  });
}

export async function listAnalyzedObservations(scanJobId: string) {
  return prisma.observation.findMany({
    where: { scanJobId },
    include: {
      question: {
        select: {
          text: true,
          questionType: true,
          brandPresent: true,
        },
      },
    },
    orderBy: [{ questionId: "asc" }, { provider: "asc" }],
  });
}

export async function refreshAnalysisJobCounts(scanJobId: string) {
  const [completed, failed, pending, running] = await Promise.all([
    prisma.observation.count({ where: { scanJobId, analysisStatus: "completed" } }),
    prisma.observation.count({ where: { scanJobId, analysisStatus: "failed" } }),
    prisma.observation.count({ where: { scanJobId, analysisStatus: "not_started" } }),
    prisma.observation.count({ where: { scanJobId, analysisStatus: "running" } }),
  ]);

  let analysisStatus = "running";
  let analysisCompletedAt: Date | null = null;
  if (pending === 0 && running === 0) {
    if (failed === 0) analysisStatus = "completed";
    else if (completed === 0) analysisStatus = "failed";
    else analysisStatus = "partial";
    analysisCompletedAt = new Date();
  }

  await prisma.scanJob.update({
    where: { id: scanJobId },
    data: {
      analyzedTasks: completed,
      analysisFailedTasks: failed,
      analysisStatus,
      analysisCompletedAt,
      analyzerVersion: ANALYZER_PROMPT_VERSION,
    },
  });

  return { completed, failed, pending: pending + running, analysisStatus };
}

export function parseStoredAnalysis(json: string | null): AnalyzerResult | null {
  if (!json) return null;
  try {
    return JSON.parse(json) as AnalyzerResult;
  } catch {
    return null;
  }
}
