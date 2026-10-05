import type { PricingEntry } from "./types";

/**
 * Central price card. Do not scatter numbers in UI or runners.
 * DeepSeek: conservative peak (cache miss) until request-time windows are recorded.
 * Qwen: published CNY list price with effectiveFrom.
 * Tencent Hy3: null unless HY3_INPUT_PER_1M / HY3_OUTPUT_PER_1M are set.
 */

export const DEEPSEEK_FLASH_PEAK: PricingEntry = {
  provider: "deepseek",
  model: "deepseek-flash",
  currency: "USD",
  inputPer1M: 0.3,
  outputPer1M: 1.2,
  cacheInputPer1M: 0.006,
  window: "peak",
  effectiveFrom: "2026-09-10",
  pricingVersion: "deepseek-flash-peak-v2026-09-10",
  sourceNote:
    "Official DeepSeek API docs (peak cache-miss input $0.30 / output $1.20 per 1M). Estimated using peak pricing.",
};

export const QWEN_FLASH: PricingEntry = {
  provider: "qwen",
  model: "qwen3.8-flash",
  currency: "CNY",
  inputPer1M: 0.8,
  outputPer1M: 2.7,
  window: "standard",
  effectiveFrom: "2026-10-05",
  pricingVersion: "qwen3.8-flash-cny-v2026-10-05",
  sourceNote: "Configured list price ¥0.8 / ¥2.7 per 1M tokens. Not assumed permanent.",
};

function tencentFromEnv(): PricingEntry {
  const inputRaw = process.env.HY3_INPUT_PER_1M?.trim();
  const outputRaw = process.env.HY3_OUTPUT_PER_1M?.trim();
  const input = inputRaw ? Number(inputRaw) : null;
  const output = outputRaw ? Number(outputRaw) : null;
  const configured =
    input !== null && output !== null && Number.isFinite(input) && Number.isFinite(output);
  return {
    provider: "tencent-hy",
    model: "hy3",
    currency: "CNY",
    inputPer1M: configured ? input : null,
    outputPer1M: configured ? output : null,
    window: "standard",
    effectiveFrom: "2026-10-05",
    pricingVersion: configured ? "hy3-env-v1" : "hy3-unconfigured",
    sourceNote: configured
      ? "From HY3_INPUT_PER_1M / HY3_OUTPUT_PER_1M env."
      : "Pricing not configured. Confirm on TokenHub console before setting env vars.",
  };
}

export function getPricingEntry(provider: string, model: string): PricingEntry | null {
  const p = provider.toLowerCase();
  const m = model.toLowerCase();
  if (p === "deepseek" || m.includes("deepseek")) {
    return DEEPSEEK_FLASH_PEAK;
  }
  if (p === "qwen" || m.includes("qwen")) {
    return QWEN_FLASH;
  }
  if (p === "tencent-hy" || p === "tencent" || m.includes("hy3")) {
    return tencentFromEnv();
  }
  return null;
}

export const PRICING_ENTRIES = {
  deepseekPeak: DEEPSEEK_FLASH_PEAK,
  qwen: QWEN_FLASH,
};
