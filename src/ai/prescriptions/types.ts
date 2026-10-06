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

export type PrescriptionFacts = {
  brandName: string;
  industry: string;
  targetAudience: string | null;
  priceTier: string | null;
  desiredPositioning: string | null;
  coreProducts: string | null;
  metrics: import("@/server/analysis/metrics").GeoMetrics;
  portrait: import("@/ai/profile/types").BrandPortrait;
  diagnoses: import("@/ai/diagnosis/types").DiagnosisItem[];
};
