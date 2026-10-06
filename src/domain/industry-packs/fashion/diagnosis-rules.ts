import type { DiagnosisFacts } from "@/ai/diagnosis/types";
import type { DiagnosisItem } from "@/ai/diagnosis/types";
import type { PackDiagnosisRule } from "../types";

function overlayCompetitorCopy(_facts: DiagnosisFacts, items: DiagnosisItem[]): DiagnosisItem[] {
  return items.map((item) => {
    if (item.code !== "COMPETITOR_DOMINATED") return item;
    return {
      ...item,
      businessMeaning:
        "在职业女装/通勤场景中，模型的默认候选集已被竞争品牌占据。",
    };
  });
}

export const fashionDiagnosisRules: PackDiagnosisRule[] = [
  (facts, items) => overlayCompetitorCopy(facts as DiagnosisFacts, items as DiagnosisItem[]),
];
