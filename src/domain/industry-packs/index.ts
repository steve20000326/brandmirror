import { fashionPack } from "./fashion";
import type { IndustryPack } from "./types";

const FASHION_INDUSTRY_KEYWORDS = ["女装", "品牌女装", "服装女装"];

/** Resolve industry string → Industry Pack. Today only Fashion is supported. */
export function getIndustryPack(industry: string): IndustryPack | null {
  const normalized = industry.trim().toLowerCase();
  if (!normalized) return null;

  const matched = FASHION_INDUSTRY_KEYWORDS.some((keyword) =>
    normalized.includes(keyword.toLowerCase()),
  );

  return matched ? fashionPack : null;
}

export function isFashionIndustry(industry: string): boolean {
  return getIndustryPack(industry)?.id === "fashion";
}

export type { IndustryPack, GeneratedQuestion, QuestionCategory } from "./types";
