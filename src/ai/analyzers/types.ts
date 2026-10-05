export const ANALYZER_PROMPT_VERSION = "observation-analyzer-v0.1";

export type AnswerStatus = "answered" | "partial" | "insufficient_info" | "refused";

export type RecommendationStatus =
  | "absent"
  | "mentioned"
  | "recommended"
  | "compared"
  | "discouraged";

export type RecognitionStatus =
  | "known_supported"
  | "partial_supported"
  | "unknown"
  | "unsupported_specifics"
  | "contradictory";

export type AlignmentValue = 1 | 0.5 | 0 | null;

export type ProfileAlignment = {
  targetAudience: AlignmentValue;
  priceTier: AlignmentValue;
  coreProducts: AlignmentValue;
  positioning: AlignmentValue;
  keywords: AlignmentValue;
};

export type ClaimedAttributes = {
  audience: string[];
  priceTier: string | null;
  style: string[];
  scenarios: string[];
  productCategories: string[];
  positioning: string[];
};

export type CompetitorMention = {
  name: string;
  rank: number | null;
  mentioned: boolean;
};

export type UnsupportedClaim = {
  claim: string;
  reason: string;
};

export type AnalyzerResult = {
  observationId: string;
  answerStatus: AnswerStatus;
  recommendationStatus: RecommendationStatus;
  brandRank: number | null;
  sentiment: "positive" | "neutral" | "negative";
  recognitionStatus: RecognitionStatus | null;
  profileAlignment: ProfileAlignment;
  claimedAttributes: ClaimedAttributes;
  competitors: CompetitorMention[];
  unsupportedClaims: UnsupportedClaim[];
  confidence: number;
};

export type AnalyzerInputItem = {
  observationId: string;
  question: string;
  questionType: string;
  brandPresent: boolean;
  response: string;
};

export type BrandDossier = {
  name: string;
  industry: string;
  coreProducts: string | null;
  targetAudience: string | null;
  priceTier: string | null;
  desiredPositioning: string | null;
  desiredKeywords: string | null;
  competitors: string[];
};
