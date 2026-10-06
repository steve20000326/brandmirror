import type { AnalyzerChat } from "@/ai/analyzers/observation-analyzer";
import { extractJsonText } from "@/ai/analyzers/finalize";
import { applyPackPrescriptionRules } from "@/domain/industry-packs/apply";
import { PRESCRIPTION_PROMPT } from "./prompt";
import {
  assertPrescriptionQuality,
  draftPrescriptions,
} from "./rules";
import type { PrescriptionFacts } from "./types";
import { prescriptionBatchSchema } from "./schema";
import { PRESCRIPTION_ENGINE_VERSION, type PrescriptionItem } from "./types";

export async function runPrescriptionEngine(
  facts: PrescriptionFacts,
  chat?: AnalyzerChat,
): Promise<PrescriptionItem[]> {
  const drafted = applyPackPrescriptionRules(facts, draftPrescriptions(facts));
  let items = drafted;
  if (chat) {
    try {
      const result = await chat.chat({
        messages: [
          { role: "system", content: PRESCRIPTION_PROMPT },
          {
            role: "user",
            content: `保持 5～10 条，priority 从 1 开始。返回 JSON 数组。\n${JSON.stringify(drafted)}`,
          },
        ],
        temperature: 0,
        maxTokens: 3500,
      });
      const parsed = prescriptionBatchSchema.parse(JSON.parse(extractJsonText(result.content)));
      items = parsed.map((row, i) => ({
        ...drafted[Math.min(i, drafted.length - 1)],
        title: row.title || drafted[i]?.title || "",
        action: row.action || drafted[i]?.action || "",
        expectedEffect: drafted[i]?.expectedEffect ?? row.expectedEffect,
        evidence: drafted[i]?.evidence ?? row.evidence,
        diagnosis: drafted[i]?.diagnosis ?? row.diagnosis,
        category: drafted[i]?.category ?? (row.category as PrescriptionItem["category"]),
        difficulty: row.difficulty,
        timeHorizon: row.timeHorizon,
        evidenceSource: drafted[i]?.evidenceSource ?? "model_observation",
        priority: i + 1,
      }));
    } catch {
      items = drafted;
    }
  }
  assertPrescriptionQuality(items);
  return items.map((item, i) => ({ ...item, priority: i + 1 }));
}

export { PRESCRIPTION_ENGINE_VERSION };
