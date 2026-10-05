const INDUSTRY_SUFFIXES = ["女装", "男装", "服饰", "服装", "品牌"];

export function normalizeBrandText(input: string): string {
  return input
    .normalize("NFKC")
    .replace(/[\s\u3000]+/g, "")
    .replace(/[“”"'`·•、，。！？：；（）()【】\[\]{}<>《》,.!?:;]/g, "")
    .toLowerCase();
}

/** Conservative short name: strip a trailing industry suffix only. */
export function deriveBrandShortName(name: string): string | null {
  const trimmed = name.trim();
  for (const suffix of INDUSTRY_SUFFIXES) {
    if (trimmed.length > suffix.length + 1 && trimmed.endsWith(suffix)) {
      return trimmed.slice(0, -suffix.length);
    }
  }
  return null;
}

export function defaultBrandAliases(name: string): string[] {
  const aliases = [name.trim()];
  const shortName = deriveBrandShortName(name);
  if (shortName && shortName !== name.trim()) aliases.push(shortName);
  return [...new Set(aliases.filter(Boolean))];
}

export function parseAliasesJson(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  } catch {
    return [];
  }
}

export function brandAliasList(name: string, aliasesJson?: string | null): string[] {
  return [...new Set([...defaultBrandAliases(name), ...parseAliasesJson(aliasesJson)])];
}

/**
 * Conservative matcher: full name, then aliases, then normalized equality/includes.
 * No fuzzy / edit-distance guessing.
 */
export function textMentionsBrand(
  text: string,
  brandName: string,
  aliasesJson?: string | null,
): boolean {
  const aliases = brandAliasList(brandName, aliasesJson).sort((a, b) => b.length - a.length);
  const raw = text ?? "";
  for (const alias of aliases) {
    if (raw.includes(alias)) return true;
  }
  const haystack = normalizeBrandText(raw);
  for (const alias of aliases) {
    const needle = normalizeBrandText(alias);
    if (needle.length >= 2 && haystack.includes(needle)) return true;
  }
  return false;
}
