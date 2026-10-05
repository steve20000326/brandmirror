import { prisma } from "@/lib/prisma";
import { calculateTokenCost, roundMoney } from "@/ai/pricing/calculator";
import type { UsagePurpose } from "@/ai/pricing/types";
import type { AnalyzerChat } from "@/ai/analyzers/observation-analyzer";

export async function recordModelUsage(params: {
  scanJobId?: string | null;
  provider: string;
  model: string;
  purpose: UsagePurpose;
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
        promptTokens: result.usage?.promptTokens ?? 0,
        completionTokens: result.usage?.completionTokens ?? 0,
        totalTokens: result.usage?.totalTokens,
      });
      return result;
    },
  };
}

export { roundMoney };
