import type { AnalyzerChat } from "@/ai/analyzers/observation-analyzer";
import { extractJsonText } from "@/ai/analyzers/finalize";
import { DIAGNOSIS_EXPLAIN_PROMPT } from "./prompt";
import { detectDiagnoses, type DiagnosisFacts } from "./rules";
import { diagnosisBatchSchema } from "./schema";
import { DIAGNOSIS_ENGINE_VERSION, type DiagnosisItem } from "./types";

function mergeExplained(base: DiagnosisItem[], explained: DiagnosisItem[]): DiagnosisItem[] {
  const byCode = new Map(explained.map((d) => [d.code, d]));
  return base.map((item) => {
    const extra = byCode.get(item.code);
    if (!extra) return item;
    return {
      ...item,
      title: extra.title || item.title,
      finding: extra.finding || item.finding,
      businessMeaning: extra.businessMeaning || item.businessMeaning,
      evidence: item.evidence,
      severity: item.severity,
    };
  });
}

export async function runDiagnosisEngine(
  facts: DiagnosisFacts,
  chat?: AnalyzerChat,
): Promise<DiagnosisItem[]> {
  const ruled = detectDiagnoses(facts);
  if (!chat || ruled.length === 0) return ruled;

  try {
    const result = await chat.chat({
      messages: [
        { role: "system", content: DIAGNOSIS_EXPLAIN_PROMPT },
        {
          role: "user",
          content: `请保持每条 code / severity / evidence / confidence 不变，只润色 title、finding、businessMeaning。返回 JSON 数组。\n${JSON.stringify(ruled)}`,
        },
      ],
      temperature: 0,
      maxTokens: 2500,
    });
    const parsed = diagnosisBatchSchema.parse(JSON.parse(extractJsonText(result.content)));
    return mergeExplained(
      ruled,
      parsed.map((row) => ({
        ...row,
        code: row.code as DiagnosisItem["code"],
      })),
    );
  } catch {
    return ruled;
  }
}

export { DIAGNOSIS_ENGINE_VERSION, detectDiagnoses };
