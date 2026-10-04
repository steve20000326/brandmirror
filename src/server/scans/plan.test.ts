import { describe, expect, it } from "vitest";
import { CONSUMER_BASELINE_PROMPT_VERSION } from "@/ai/prompts/consumer-baseline";
import { buildObservationPlan, expectedObservationCount } from "./plan";
import { SCAN_PROVIDER_IDS, SCAN_SEARCH_ENABLED, SCAN_SURFACE_TYPE } from "./types";

describe("scan observation plan", () => {
  const questions = Array.from({ length: 30 }, (_, i) => ({ id: `q${i + 1}` }));
  const models = {
    deepseek: "deepseek-flash",
    "tencent-hy": "hy3",
    qwen: "qwen3.8-flash",
  } as const;

  it("creates 90 observations for 30 questions × 3 providers", () => {
    const plan = buildObservationPlan(questions, models);
    expect(expectedObservationCount(30)).toBe(90);
    expect(plan).toHaveLength(90);
  });

  it("gives each question exactly deepseek, tencent-hy and qwen", () => {
    const plan = buildObservationPlan(questions, models);
    for (const q of questions) {
      const providers = plan.filter((o) => o.questionId === q.id).map((o) => o.provider);
      expect(providers.sort()).toEqual([...SCAN_PROVIDER_IDS].sort());
    }
  });

  it("fixes Day 3 surface metadata", () => {
    const plan = buildObservationPlan(questions, models);
    for (const item of plan) {
      expect(item.searchEnabled).toBe(SCAN_SEARCH_ENABLED);
      expect(item.searchEnabled).toBe(false);
      expect(item.surfaceType).toBe(SCAN_SURFACE_TYPE);
      expect(item.surfaceType).toBe("model_api");
      expect(item.promptVersion).toBe(CONSUMER_BASELINE_PROMPT_VERSION);
      expect(item.status).toBe("pending");
    }
  });
});
