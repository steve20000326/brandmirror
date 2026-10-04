import { CONSUMER_BASELINE_PROMPT_VERSION } from "@/ai/prompts/consumer-baseline";
import type { ProviderId } from "@/ai/providers/types";
import { SCAN_PROVIDER_IDS, SCAN_SEARCH_ENABLED, SCAN_SURFACE_TYPE } from "./types";

export type ObservationDraft = {
  questionId: string;
  provider: ProviderId;
  model: string;
  status: "pending";
  surfaceType: string;
  searchEnabled: boolean;
  promptVersion: string;
};

export function expectedObservationCount(questionCount: number, providerCount = 3): number {
  return questionCount * providerCount;
}

/** Build 30×3 pending observations. Pure function — used by create + tests. */
export function buildObservationPlan(
  questions: Array<{ id: string }>,
  models: Record<ProviderId, string>,
): ObservationDraft[] {
  return questions.flatMap((question) =>
    SCAN_PROVIDER_IDS.map((provider) => ({
      questionId: question.id,
      provider,
      model: models[provider],
      status: "pending" as const,
      surfaceType: SCAN_SURFACE_TYPE,
      searchEnabled: SCAN_SEARCH_ENABLED,
      promptVersion: CONSUMER_BASELINE_PROMPT_VERSION,
    })),
  );
}
