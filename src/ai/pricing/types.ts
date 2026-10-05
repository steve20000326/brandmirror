export type PricingCurrency = "CNY" | "USD";

export type UsagePurpose =
  | "scan"
  | "analysis"
  | "profile"
  | "diagnosis"
  | "prescription"
  | "connection_test";

export type PricingEntry = {
  provider: string;
  model: string;
  currency: PricingCurrency;
  inputPer1M: number | null;
  outputPer1M: number | null;
  cacheInputPer1M?: number | null;
  window?: "peak" | "off_peak" | "standard";
  effectiveFrom: string;
  effectiveTo?: string | null;
  pricingVersion: string;
  sourceNote: string;
};

export type CostBreakdown = {
  currency: PricingCurrency | null;
  inputCost: number | null;
  outputCost: number | null;
  totalCost: number | null;
  pricingVersion: string | null;
  priced: boolean;
  usedPeakPricing: boolean;
};
