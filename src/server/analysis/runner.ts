import { ANALYZER_BATCH_SIZE, analyzeObservationBatch, getAnalyzerClient } from "@/ai/analyzers/observation-analyzer";
import type { AnalyzerChat } from "@/ai/analyzers/observation-analyzer";
import { detectBrandMention } from "@/ai/analyzers/exact-match";
import { looksLikeUnsupportedSpecifics } from "@/ai/analyzers/finalize";
import { ANALYZER_PROMPT_VERSION } from "@/ai/analyzers/types";
import { wrapChatWithUsage } from "@/ai/usage/recorder";
import { getAnalyzerConfig } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { computeGeoMetrics, type MetricRow } from "./metrics";
import { refreshAnalysisJobCounts } from "./queries";
import { ANALYSIS_ANALYZER_CONCURRENCY, ANALYSIS_PROCESS_LIMIT, toBrandDossier } from "./types";
import type { AnalyzerResult } from "@/ai/analyzers/types";

function trackedAnalyzer(scanJobId: string, chat?: AnalyzerChat): AnalyzerChat {
  const cfg = getAnalyzerConfig();
  const base = chat ?? getAnalyzerClient();
  return wrapChatWithUsage(base, {
    scanJobId,
    purpose: "analysis",
    fallbackProvider: cfg.provider,
    fallbackModel: cfg.model,
  });
}

async function runPool<T>(items: T[], limit: number, fn: (item: T) => Promise<void>) {
  const queue = [...items];
  const workers = Array.from({ length: Math.min(limit, items.length || 1) }, async () => {
    while (queue.length > 0) {
      const next = queue.shift();
      if (!next) break;
      await fn(next);
    }
  });
  await Promise.all(workers);
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

export async function startAnalysisRun(scanJobId: string) {
  const job = await prisma.scanJob.findUnique({
    where: { id: scanJobId },
    include: { brand: { include: { competitors: true } } },
  });
  if (!job) return { ok: false as const, error: "扫描任务不存在" };
  if (job.status !== "completed" && job.status !== "partial") {
    return { ok: false as const, error: "请先完成模型基线扫描" };
  }
  if (job.analysisStatus === "completed") {
    return { ok: true as const, scanJobId, alreadyDone: true };
  }

  await prisma.scanJob.update({
    where: { id: scanJobId },
    data: {
      analysisStatus: "running",
      analysisStartedAt: job.analysisStartedAt ?? new Date(),
      analyzerVersion: ANALYZER_PROMPT_VERSION,
    },
  });

  return { ok: true as const, scanJobId, alreadyDone: false };
}

async function persistResult(
  observationId: string,
  result: AnalyzerResult,
  brandMentioned: boolean,
) {
  const recommended = result.recommendationStatus === "recommended";
  await prisma.observation.update({
    where: { id: observationId },
    data: {
      analysisStatus: "completed",
      analysisErrorMessage: null,
      analyzerVersion: ANALYZER_PROMPT_VERSION,
      analysisJson: JSON.stringify(result),
      brandMentioned,
      brandRank: result.brandRank,
      recommended,
      competitorsJson: JSON.stringify(result.competitors),
      attributesJson: JSON.stringify(result.claimedAttributes),
    },
  });
}

export async function applyRecognitionGuards(scanJobId: string) {
  const job = await prisma.scanJob.findUnique({
    where: { id: scanJobId },
    include: {
      brand: { include: { competitors: true } },
      observations: { include: { question: true } },
    },
  });
  if (!job) return 0;
  const dossier = toBrandDossier(job.brand);
  let updated = 0;
  for (const obs of job.observations) {
    if (obs.analysisStatus !== "completed" || !obs.analysisJson || !obs.rawResponse) continue;
    if (!obs.question.brandPresent) continue;
    const mentioned = detectBrandMention(obs.rawResponse, dossier.name, dossier.aliasesJson);
    if (!mentioned) continue;
    const parsed = JSON.parse(obs.analysisJson) as AnalyzerResult;
    let next = parsed;
    if (
      (parsed.recognitionStatus === "unknown" || parsed.recognitionStatus === null) &&
      looksLikeUnsupportedSpecifics(obs.rawResponse, dossier)
    ) {
      next = { ...parsed, recognitionStatus: "unsupported_specifics" };
    }
    if (next !== parsed || obs.brandMentioned !== true) {
      await persistResult(obs.id, next, true);
      updated += 1;
    }
  }
  return updated;
}

export async function persistBrandProfile(scanJobId: string) {
  await applyRecognitionGuards(scanJobId);
  const job = await prisma.scanJob.findUnique({
    where: { id: scanJobId },
    include: {
      brand: { include: { competitors: true } },
      observations: { include: { question: true } },
    },
  });
  if (!job) return;

  const rows: MetricRow[] = [];
  for (const obs of job.observations) {
    if (obs.analysisStatus !== "completed" || !obs.analysisJson) continue;
    const parsed = JSON.parse(obs.analysisJson) as AnalyzerResult;
    rows.push({
      provider: obs.provider,
      brandPresent: obs.question.brandPresent,
      brandName: job.brand.name,
      brandMentioned: Boolean(obs.brandMentioned),
      brandRank: parsed.brandRank,
      recommendationStatus: parsed.recommendationStatus,
      recognitionStatus: parsed.recognitionStatus,
      profileAlignment: parsed.profileAlignment,
      competitorMentions: parsed.competitors,
    });
  }

  const metrics = computeGeoMetrics(
    rows,
    job.brand.name,
    job.brand.competitors.map((c) => c.name),
  );

  const existing = await prisma.brandProfile.findFirst({ where: { scanJobId } });
  const data = {
    brandId: job.brandId,
    scanJobId,
    aiBrandScore: metrics.aiBrandScore,
    awarenessScore: metrics.awareness,
    recommendationScore: metrics.recommendation,
    discoveryScore: metrics.discovery,
    accuracyScore: metrics.alignment,
    competitorScore: metrics.competitor,
    hallucinationRiskScore: metrics.hallucinationRisk,
    providerMetricsJson: JSON.stringify(metrics.byProvider),
    profileJson: JSON.stringify(metrics),
  };

  if (existing) {
    await prisma.brandProfile.update({ where: { id: existing.id }, data });
  } else {
    await prisma.brandProfile.create({ data });
  }

  return metrics;
}

export async function processAnalysisBatch(
  scanJobId: string,
  chat?: AnalyzerChat,
): Promise<{ processed: number; pending: number; failed: number; completed: number; status: string }> {
  const started = await startAnalysisRun(scanJobId);
  if (!started.ok) {
    throw new Error(started.error);
  }
  if (started.alreadyDone) {
    const counts = await refreshAnalysisJobCounts(scanJobId);
    return {
      processed: 0,
      pending: 0,
      failed: counts.failed,
      completed: counts.completed,
      status: counts.analysisStatus,
    };
  }

  const job = await prisma.scanJob.findUnique({
    where: { id: scanJobId },
    include: { brand: { include: { competitors: true } } },
  });
  if (!job) throw new Error("扫描任务不存在");
  const dossier = toBrandDossier(job.brand);

  const notStarted = await prisma.observation.findMany({
    where: {
      scanJobId,
      status: "completed",
      analysisStatus: "not_started",
    },
    include: { question: true },
    take: ANALYSIS_PROCESS_LIMIT,
    orderBy: { createdAt: "asc" },
  });
  const extra = ANALYSIS_PROCESS_LIMIT - notStarted.length;
  const failedRetry =
    extra > 0
      ? await prisma.observation.findMany({
          where: {
            scanJobId,
            status: "completed",
            analysisStatus: "failed",
            analysisAttemptCount: { lt: 3 },
          },
          include: { question: true },
          take: extra,
          orderBy: { createdAt: "asc" },
        })
      : [];
  const batch = [...notStarted, ...failedRetry];

  const claimed: typeof batch = [];
  for (const item of batch) {
    const updated = await prisma.observation.updateMany({
      where: { id: item.id, analysisStatus: { in: ["not_started", "failed"] } },
      data: { analysisStatus: "running", analysisAttemptCount: { increment: 1 } },
    });
    if (updated.count === 1) claimed.push(item);
  }

  const groups = chunk(claimed, ANALYZER_BATCH_SIZE);
  await runPool(groups, ANALYSIS_ANALYZER_CONCURRENCY, async (group) => {
    try {
      const inputs = group.map((obs) => ({
        observationId: obs.id,
        question: obs.question.text,
        questionType: obs.question.questionType ?? "",
        brandPresent: obs.question.brandPresent,
        response: obs.rawResponse ?? "",
      }));
      const analyzed = await analyzeObservationBatch(
        inputs,
        dossier,
        trackedAnalyzer(scanJobId, chat),
      );
      for (const obs of group) {
        const result = analyzed.get(obs.id);
        if (!result) {
          await prisma.observation.update({
            where: { id: obs.id },
            data: {
              analysisStatus: "failed",
              analysisErrorMessage: "Analyzer 未返回该 observationId",
            },
          });
          continue;
        }
        const brandMentioned = Boolean(
          obs.rawResponse &&
            detectBrandMention(obs.rawResponse, dossier.name, dossier.aliasesJson),
        );
        await persistResult(obs.id, result, brandMentioned);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message.slice(0, 240) : "分析失败";
      for (const obs of group) {
        await prisma.observation.update({
          where: { id: obs.id },
          data: {
            analysisStatus: "failed",
            analysisErrorMessage: message,
          },
        });
      }
    }
  });

  const counts = await refreshAnalysisJobCounts(scanJobId);
  if (counts.pending === 0) {
    await persistBrandProfile(scanJobId);
  }

  return {
    processed: claimed.length,
    pending: counts.pending,
    failed: counts.failed,
    completed: counts.completed,
    status: counts.analysisStatus,
  };
}

export async function findAliasMissedObservations(scanJobId: string) {
  const job = await prisma.scanJob.findUnique({
    where: { id: scanJobId },
    include: { brand: true, observations: true },
  });
  if (!job) return [];
  return job.observations.filter((obs) => {
    if (obs.status !== "completed" || !obs.rawResponse) return false;
    const mentioned = detectBrandMention(
      obs.rawResponse,
      job.brand.name,
      job.brand.aliasesJson,
    );
    if (!mentioned) return false;
    const fullNameHit = obs.rawResponse.includes(job.brand.name);
    return obs.brandMentioned !== true || !fullNameHit;
  });
}

/** Re-run analyzer on selected observations without rescanning models. */
export async function reanalyzeObservations(
  scanJobId: string,
  observationIds: string[],
  chat?: AnalyzerChat,
) {
  if (observationIds.length === 0) {
    return persistBrandProfile(scanJobId);
  }

  const job = await prisma.scanJob.findUnique({
    where: { id: scanJobId },
    include: { brand: { include: { competitors: true } } },
  });
  if (!job) throw new Error("扫描任务不存在");
  const dossier = toBrandDossier(job.brand);

  await prisma.observation.updateMany({
    where: { id: { in: observationIds }, scanJobId },
    data: {
      analysisStatus: "not_started",
      analysisErrorMessage: null,
    },
  });
  await prisma.scanJob.update({
    where: { id: scanJobId },
    data: { analysisStatus: "running", analyzerVersion: ANALYZER_PROMPT_VERSION },
  });

  const batch = await prisma.observation.findMany({
    where: { id: { in: observationIds }, scanJobId },
    include: { question: true },
  });
  const groups = chunk(batch, ANALYZER_BATCH_SIZE);
  await runPool(groups, ANALYSIS_ANALYZER_CONCURRENCY, async (group) => {
    const claimed: typeof group = [];
    for (const item of group) {
      const updated = await prisma.observation.updateMany({
        where: { id: item.id },
        data: { analysisStatus: "running", analysisAttemptCount: { increment: 1 } },
      });
      if (updated.count === 1) claimed.push(item);
    }
    try {
      const inputs = claimed.map((obs) => ({
        observationId: obs.id,
        question: obs.question.text,
        questionType: obs.question.questionType ?? "",
        brandPresent: obs.question.brandPresent,
        response: obs.rawResponse ?? "",
      }));
      const analyzed = await analyzeObservationBatch(
        inputs,
        dossier,
        trackedAnalyzer(scanJobId, chat),
      );
      for (const obs of claimed) {
        const result = analyzed.get(obs.id);
        if (!result) {
          await prisma.observation.update({
            where: { id: obs.id },
            data: {
              analysisStatus: "failed",
              analysisErrorMessage: "Analyzer 未返回该 observationId",
            },
          });
          continue;
        }
        const brandMentioned = Boolean(
          obs.rawResponse &&
            detectBrandMention(obs.rawResponse, dossier.name, dossier.aliasesJson),
        );
        await persistResult(obs.id, result, brandMentioned);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message.slice(0, 240) : "分析失败";
      for (const obs of claimed) {
        await prisma.observation.update({
          where: { id: obs.id },
          data: { analysisStatus: "failed", analysisErrorMessage: message },
        });
      }
    }
  });

  await refreshAnalysisJobCounts(scanJobId);
  return persistBrandProfile(scanJobId);
}
