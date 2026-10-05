import { getProvider } from "@/ai/providers";
import type { ModelProvider, ProviderId } from "@/ai/providers/types";
import { getAnalyzerConfig } from "@/lib/env";
import {
  ANALYZER_REPAIR_PROMPT,
  buildAnalyzerSystemPrompt,
  buildAnalyzerUserPrompt,
} from "./prompt";
import { finalizeAnalyzerResult, parseAnalyzerBatch } from "./finalize";
import type { AnalyzerInputItem, AnalyzerResult, BrandDossier } from "./types";
import { ANALYZER_PROMPT_VERSION } from "./types";

export { ANALYZER_PROMPT_VERSION };

export const ANALYZER_BATCH_SIZE = 5;

export type AnalyzerChat = Pick<ModelProvider, "chat">;

export function getAnalyzerClient(): AnalyzerChat {
  const cfg = getAnalyzerConfig();
  return getProvider(cfg.provider as ProviderId);
}

export async function analyzeObservationBatch(
  items: AnalyzerInputItem[],
  dossier: BrandDossier,
  chat: AnalyzerChat = getAnalyzerClient(),
): Promise<Map<string, AnalyzerResult>> {
  const results = new Map<string, AnalyzerResult>();
  if (items.length === 0) return results;

  const system = buildAnalyzerSystemPrompt(dossier);
  const user = buildAnalyzerUserPrompt(items);

  let parsed;
  try {
    const first = await chat.chat({
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0,
      maxTokens: 4000,
    });
    parsed = parseAnalyzerBatch(first.content);
  } catch {
    const repaired = await chat.chat({
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
        { role: "assistant", content: "invalid" },
        { role: "user", content: ANALYZER_REPAIR_PROMPT },
      ],
      temperature: 0,
      maxTokens: 4000,
    });
    parsed = parseAnalyzerBatch(repaired.content);
  }

  const byId = new Map(parsed.map((row) => [row.observationId, row]));
  for (const item of items) {
    const llm = byId.get(item.observationId);
    if (!llm) {
      throw new Error(`Analyzer missing observationId ${item.observationId}`);
    }
    results.set(
      item.observationId,
      finalizeAnalyzerResult({
        llm,
        rawResponse: item.response,
        brandPresent: item.brandPresent,
        dossier,
      }),
    );
  }
  return results;
}
