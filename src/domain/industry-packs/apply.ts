import { getIndustryPack } from "./index";
import type { DiagnosisFacts } from "@/ai/diagnosis/types";
import type { DiagnosisItem } from "@/ai/diagnosis/types";
import type { PrescriptionFacts, PrescriptionItem } from "@/ai/prescriptions/types";

export function applyPackDiagnosisRules(facts: DiagnosisFacts, items: DiagnosisItem[]): DiagnosisItem[] {
  const pack = getIndustryPack(facts.industry ?? "");
  if (!pack) return items;
  return pack.getDiagnosisRules().reduce((acc, rule) => rule(facts, acc) as DiagnosisItem[], items);
}

export function applyPackPrescriptionRules(
  facts: PrescriptionFacts,
  items: PrescriptionItem[],
): PrescriptionItem[] {
  const pack = getIndustryPack(facts.industry);
  if (!pack) return items;
  return pack.getPrescriptionRules().reduce((acc, rule) => rule(facts, acc) as PrescriptionItem[], items);
}
