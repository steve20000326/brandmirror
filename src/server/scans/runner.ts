import {
  CONSUMER_BASELINE_PROMPT_VERSION,
  CONSUMER_BASELINE_SYSTEM_PROMPT,
} from "@/ai/prompts/consumer-baseline";
import { getProvider } from "@/ai/providers";
import { publicErrorMessage, shouldRetry } from "@/ai/providers/errors";
import type { ModelProvider, ProviderId } from "@/ai/providers/types";
import { prisma } from "@/lib/prisma";
import { recordModelUsage, usageEventTypeForPurpose } from "@/ai/usage/recorder";
import { SCAN_BATCH_SIZE, SCAN_CONCURRENCY, SCAN_MAX_ATTEMPTS } from "./types";

const RETRY_DELAYS_MS = [1000, 3000];

export type ProcessBatchResult = {
  processed: number;
  pending: number;
  completed: number;
  failed: number;
  status: string;
};

type RunnerDeps = {
  getProvider: (id: ProviderId) => ModelProvider;
  sleep: (ms: number) => Promise<void>;
};

const defaultDeps: RunnerDeps = {
  getProvider,
  sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
};

async function runPool<T>(items: T[], limit: number, fn: (item: T) => Promise<void>) {
  const queue = [...items];
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (queue.length > 0) {
      const next = queue.shift();
      if (!next) break;
      await fn(next);
    }
  });
  await Promise.all(workers);
}

async function refreshJobCounts(scanJobId: string) {
  const [completed, failed, pending, running] = await Promise.all([
    prisma.observation.count({ where: { scanJobId, status: "completed" } }),
    prisma.observation.count({ where: { scanJobId, status: "failed" } }),
    prisma.observation.count({ where: { scanJobId, status: "pending" } }),
    prisma.observation.count({ where: { scanJobId, status: "running" } }),
  ]);

  let status = "running";
  let completedAt: Date | null = null;
  if (pending === 0 && running === 0) {
    if (failed === 0) status = "completed";
    else if (completed === 0) status = "failed";
    else status = "partial";
    completedAt = new Date();
  }

  await prisma.scanJob.update({
    where: { id: scanJobId },
    data: {
      completedTasks: completed,
      failedTasks: failed,
      status,
      completedAt,
    },
  });

  return { completed, failed, pending: pending + running, status };
}

async function processOneObservation(
  observationId: string,
  deps: RunnerDeps,
): Promise<void> {
  const observation = await prisma.observation.findUnique({
    where: { id: observationId },
    include: { question: true },
  });
  if (!observation) return;

  const provider = deps.getProvider(observation.provider as ProviderId);
  let lastError = "未知错误";

  for (let attempt = 1; attempt <= SCAN_MAX_ATTEMPTS; attempt += 1) {
    await prisma.observation.update({
      where: { id: observation.id },
      data: {
        apiAttemptCount: { increment: 1 },
        attemptCount: attempt,
      },
    });

    try {
      const result = await provider.chat({
        messages: [
          { role: "system", content: CONSUMER_BASELINE_SYSTEM_PROMPT },
          { role: "user", content: observation.question.text },
        ],
        temperature: 0.3,
        maxTokens: 800,
      });

      await recordModelUsage({
        scanJobId: observation.scanJobId,
        provider: result.provider,
        model: result.model,
        purpose: "scan",
        usageEventType: usageEventTypeForPurpose("scan", attempt),
        promptTokens: result.usage?.promptTokens ?? 0,
        completionTokens: result.usage?.completionTokens ?? 0,
        totalTokens: result.usage?.totalTokens ?? 0,
      });

      await prisma.observation.update({
        where: { id: observation.id },
        data: {
          status: "completed",
          rawResponse: result.content,
          latencyMs: result.latencyMs ?? null,
          responseId: result.responseId ?? null,
          attemptCount: attempt,
          errorMessage: null,
          promptVersion: CONSUMER_BASELINE_PROMPT_VERSION,
          surfaceType: "model_api",
          searchEnabled: false,
          model: result.model,
          brandMentioned: null,
          brandRank: null,
          recommended: null,
          competitorsJson: null,
          attributesJson: null,
          analysisJson: null,
        },
      });
      return;
    } catch (err) {
      lastError = publicErrorMessage(err);
      await recordModelUsage({
        scanJobId: observation.scanJobId,
        provider: observation.provider,
        model: observation.model,
        purpose: "scan",
        usageEventType: usageEventTypeForPurpose("scan", attempt),
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
      });
      await prisma.observation.update({
        where: { id: observation.id },
        data: {
          attemptCount: attempt,
          errorMessage: lastError,
        },
      });

      const canRetry = shouldRetry(err) && attempt < SCAN_MAX_ATTEMPTS;
      if (!canRetry) break;
      await deps.sleep(RETRY_DELAYS_MS[attempt - 1] ?? 3000);
    }
  }

  await prisma.observation.update({
    where: { id: observation.id },
    data: {
      status: "failed",
      errorMessage: lastError,
    },
  });
}

/**
 * Process at most SCAN_BATCH_SIZE pending observations.
 * Never runs the full 90 in one call.
 */
export async function processScanBatch(
  scanJobId: string,
  deps: RunnerDeps = defaultDeps,
): Promise<ProcessBatchResult> {
  const job = await prisma.scanJob.findUnique({ where: { id: scanJobId } });
  if (!job) {
    throw new Error("扫描任务不存在");
  }

  if (!job.startedAt) {
    await prisma.scanJob.update({
      where: { id: scanJobId },
      data: { startedAt: new Date(), status: "running" },
    });
  } else if (job.status === "pending") {
    await prisma.scanJob.update({
      where: { id: scanJobId },
      data: { status: "running" },
    });
  }

  const batch = await prisma.observation.findMany({
    where: { scanJobId, status: "pending" },
    take: SCAN_BATCH_SIZE,
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  const claimed: string[] = [];
  for (const item of batch) {
    const updated = await prisma.observation.updateMany({
      where: { id: item.id, status: "pending" },
      data: { status: "running" },
    });
    if (updated.count === 1) claimed.push(item.id);
  }

  await runPool(claimed, SCAN_CONCURRENCY, (id) => processOneObservation(id, deps));

  const counts = await refreshJobCounts(scanJobId);
  return {
    processed: claimed.length,
    pending: counts.pending,
    completed: counts.completed,
    failed: counts.failed,
    status: counts.status,
  };
}
