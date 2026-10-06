import { prisma } from "@/lib/prisma";
import { calculateTokenCost } from "@/ai/pricing/calculator";
import type { UsagePurpose } from "@/ai/pricing/types";
import type { AnalyzerChat } from "@/ai/analyzers/observation-analyzer";

export type UsageEventType = "api_call" | "retry" | "analysis_call";

export function usageEventTypeForPurpose(purpose: UsagePurpose, attempt = 1): UsageEventType {
  if (purpose === "scan") return attempt > 1 ? "retry" : "api_call";
  if (purpose === "connection_test") return "api_call";
  return "analysis_call";
}

export async function recordModelUsage(params: {
  scanJobId?: string | null;
  provider: string;
  model: string;
  purpose: UsagePurpose;
  usageEventType?: UsageEventType;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}) {
  if (process.env.VITEST) return null;
  const promptTokens = params.promptTokens ?? 0;
  const completionTokens = params.completionTokens ?? 0;
  const totalTokens = params.totalTokens ?? promptTokens + completionTokens;
  const cost = calculateTokenCost({
    provider: params.provider,
    model: params.model,
    promptTokens,
    completionTokens,
  });

  return prisma.modelUsage.create({
    data: {
      scanJobId: params.scanJobId ?? null,
      provider: params.provider,
      model: params.model,
      purpose: params.purpose,
      usageEventType: params.usageEventType ?? usageEventTypeForPurpose(params.purpose),
      promptTokens,
      completionTokens,
      totalTokens,
      estimatedCost: cost.totalCost ?? 0,
      inputCost: cost.inputCost,
      outputCost: cost.outputCost,
      totalCost: cost.totalCost,
      currency: cost.currency,
      pricingVersion: cost.pricingVersion,
    },
  });
}

export function wrapChatWithUsage(
  chat: AnalyzerChat,
  meta: { scanJobId: string; purpose: UsagePurpose; fallbackProvider: string; fallbackModel: string },
): AnalyzerChat {
  return {
    async chat(request) {
      const result = await chat.chat(request);
      await recordModelUsage({
        scanJobId: meta.scanJobId,
        provider: result.provider || meta.fallbackProvider,
        model: result.model || meta.fallbackModel,
        purpose: meta.purpose,
        usageEventType: "analysis_call",
        promptTokens: result.usage?.promptTokens ?? 0,
        completionTokens: result.usage?.completionTokens ?? 0,
        totalTokens: result.usage?.totalTokens,
      });
      return result;
    },
  };
}
