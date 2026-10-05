export const PRESCRIPTION_ENGINE_VERSION = "prescription-v0.1";

export type PrescriptionCategory =
  | "brand_facts"
  | "positioning"
  | "audience"
  | "scenario"
  | "content"
  | "authority"
  | "third_party"
  | "structured_information"
  | "competitor_gap"
  | "hallucination_control";

export type PrescriptionItem = {
  priority: number;
  title: string;
  category: PrescriptionCategory;
  evidence: string;
  diagnosis: string;
  action: string;
  expectedEffect: string;
  difficulty: "low" | "medium" | "high";
  timeHorizon: "short" | "medium" | "long";
  evidenceSource: "model_observation" | "brand_profile" | "competitor_gap";
};
