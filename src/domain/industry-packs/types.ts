export type QuestionCategory =
  | "brand_cognition"
  | "category_discovery"
  | "audience_scenario"
  | "competitor_comparison"
  | "purchase_decision";

export type PurchaseIntent = "low" | "medium" | "high";

export interface QuestionTemplate {
  id: string;
  category: QuestionCategory;
  template: string;
  brandPresent: boolean;
  persona?: string;
  scenario?: string;
  purchaseIntent?: PurchaseIntent;
}

export interface GeneratedQuestion {
  text: string;
  questionType: QuestionCategory;
  persona?: string;
  scenario?: string;
  purchaseIntent?: PurchaseIntent;
  brandPresent: boolean;
  source: string;
  /** Template id used for deterministic selection / debugging */
  templateId: string;
}

export interface BrandGenerationContext {
  id: string;
  name: string;
  industry: string;
  coreProducts?: string | null;
  targetAudience?: string | null;
  priceTier?: string | null;
  competitors: Array<{ name: string }>;
}

export interface IndustryPack {
  id: string;
  version: string;
  label: string;
  /** Quotas for the 30-question plan */
  planQuota: Record<QuestionCategory, number>;
  templates: QuestionTemplate[];
  generateQuestions: (ctx: BrandGenerationContext) => GeneratedQuestion[];
}
