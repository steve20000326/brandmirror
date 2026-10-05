export const DIAGNOSIS_ENGINE_VERSION = "diagnosis-v0.1";

export type DiagnosisSeverity = "high" | "medium" | "low";

export type DiagnosisCode =
  | "LOW_AWARENESS"
  | "LOW_DISCOVERY"
  | "LOW_RECOMMENDATION"
  | "LOW_ALIGNMENT"
  | "COMPETITOR_DOMINATED"
  | "MODEL_DISAGREEMENT"
  | "HALLUCINATION_RISK"
  | "POSITIONING_GAP"
  | "AUDIENCE_GAP"
  | "SCENARIO_GAP";

export type DiagnosisItem = {
  code: DiagnosisCode;
  severity: DiagnosisSeverity;
  title: string;
  finding: string;
  evidence: string[];
  businessMeaning: string;
  confidence: number;
};
