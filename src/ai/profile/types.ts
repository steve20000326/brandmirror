export const BRAND_PROFILE_VERSION = "brand-profile-v0.1";
export const NO_STABLE_COGNITION = "暂无稳定认知";

export type EvidenceItem = {
  label: string;
  evidenceCount: number;
  providers: string[];
};

export type AudienceBlock = {
  summary: string;
  confidence: number;
  evidenceCount: number;
  providers: string[];
};

export type PriceBlock = {
  summary: string;
  confidence: number;
  evidenceCount: number;
  providers: string[];
};

export type StyleBlock = {
  primary: EvidenceItem[];
  secondary: EvidenceItem[];
  confidence: number;
};

export type ScenarioBlock = {
  strong: EvidenceItem[];
  weak: EvidenceItem[];
};

export type ModelDisagreement = {
  dimension: string;
  views: Array<{ provider: string; value: string }>;
};

export type BrandPortrait = {
  audience: AudienceBlock;
  priceTier: PriceBlock;
  style: StyleBlock;
  scenarios: ScenarioBlock;
  productAssociations: EvidenceItem[];
  competitorAssociations: EvidenceItem[];
  positiveAssociations: EvidenceItem[];
  weakAssociations: EvidenceItem[];
  recognitionGaps: string[];
  modelDisagreements: ModelDisagreement[];
  executiveSummary: string;
  hasStableCognition: boolean;
  engineVersion: string;
};
