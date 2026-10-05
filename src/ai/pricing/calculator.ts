import { getPricingEntry } from "./pricing-config";
import type { CostBreakdown } from "./types";

export function calculateTokenCost(params: {
  provider: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
}): CostBreakdown {
  const entry = getPricingEntry(params.provider, params.model);
  if (!entry || entry.inputPer1M == null || entry.outputPer1M == null) {
    return {
      currency: entry?.currency ?? null,
      inputCost: null,
      outputCost: null,
      totalCost: null,
      pricingVersion: entry?.pricingVersion ?? null,
      priced: false,
      usedPeakPricing: false,
    };
  }
  const inputCost = (params.promptTokens / 1_000_000) * entry.inputPer1M;
  const outputCost = (params.completionTokens / 1_000_000) * entry.outputPer1M;
  return {
    currency: entry.currency,
    inputCost,
    outputCost,
    totalCost: inputCost + outputCost,
    pricingVersion: entry.pricingVersion,
    priced: true,
    usedPeakPricing: entry.window === "peak",
  };
}

export function roundMoney(value: number, digits = 4): number {
  const f = 10 ** digits;
  return Math.round(value * f) / f;
}
