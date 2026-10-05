/** Deterministic string detection — LLM cannot override these. */

import { textMentionsBrand } from "@/domain/brands/brand-matcher";

export function containsExactName(text: string, name: string): boolean {
  const haystack = text.trim();
  const needle = name.trim();
  if (!haystack || !needle) return false;
  return haystack.includes(needle);
}

export function detectBrandMention(
  rawResponse: string,
  brandName: string,
  aliasesJson?: string | null,
): boolean {
  return textMentionsBrand(rawResponse, brandName, aliasesJson);
}

export function detectCompetitorMentions(
  rawResponse: string,
  competitorNames: string[],
): string[] {
  return competitorNames.filter((name) => containsExactName(rawResponse, name));
}
