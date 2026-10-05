import { z } from "zod";

const coerceAlign = (v: unknown) => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  if (n === 1) return 1;
  if (n === 0.5) return 0.5;
  if (n === 0) return 0;
  return null;
};

const coerceRank = (v: unknown) => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  if (!Number.isFinite(n) || n < 1) return null;
  return Math.round(n);
};

const alignmentValue = z.union([z.literal(1), z.literal(0.5), z.literal(0), z.null()]);

function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback;
}

export const analyzerResultSchema = z.object({
  observationId: z.string().min(1),
  answerStatus: z.preprocess(
    (v) =>
      oneOf(v, ["answered", "partial", "insufficient_info", "refused"] as const, "answered"),
    z.enum(["answered", "partial", "insufficient_info", "refused"]),
  ),
  recommendationStatus: z.preprocess(
    (v) =>
      oneOf(
        v,
        ["absent", "mentioned", "recommended", "compared", "discouraged"] as const,
        "absent",
      ),
    z.enum(["absent", "mentioned", "recommended", "compared", "discouraged"]),
  ),
  brandRank: z.preprocess(coerceRank, z.number().int().positive().nullable()),
  sentiment: z.preprocess(
    (v) => oneOf(v, ["positive", "neutral", "negative"] as const, "neutral"),
    z.enum(["positive", "neutral", "negative"]),
  ),
  recognitionStatus: z.preprocess((v) => {
    if (v === null || v === undefined) return null;
    return oneOf(
      v,
      [
        "known_supported",
        "partial_supported",
        "unknown",
        "unsupported_specifics",
        "contradictory",
      ] as const,
      "unknown",
    );
  }, z
    .enum([
      "known_supported",
      "partial_supported",
      "unknown",
      "unsupported_specifics",
      "contradictory",
    ])
    .nullable()),
  profileAlignment: z.preprocess(
    (v) => (v && typeof v === "object" ? v : {}),
    z.object({
      targetAudience: z.preprocess(coerceAlign, alignmentValue),
      priceTier: z.preprocess(coerceAlign, alignmentValue),
      coreProducts: z.preprocess(coerceAlign, alignmentValue),
      positioning: z.preprocess(coerceAlign, alignmentValue),
      keywords: z.preprocess(coerceAlign, alignmentValue),
    }),
  ),
  claimedAttributes: z.preprocess(
    (v) => (v && typeof v === "object" ? v : {}),
    z.object({
      audience: z.array(z.string()).default([]),
      priceTier: z.string().nullable().default(null),
      style: z.array(z.string()).default([]),
      scenarios: z.array(z.string()).default([]),
      productCategories: z.array(z.string()).default([]),
      positioning: z.array(z.string()).default([]),
    }),
  ),
  competitors: z.array(
    z.object({
      name: z.string(),
      rank: z.preprocess(coerceRank, z.number().int().positive().nullable()),
      mentioned: z.boolean().default(true),
    }),
  ).default([]),
  unsupportedClaims: z.preprocess((v) => {
    if (!Array.isArray(v)) return [];
    return v.map((item) => {
      if (typeof item === "string") {
        return { claim: item, reason: "品牌资料未提供该具体事实" };
      }
      return item;
    });
  }, z.array(
    z.object({
      claim: z.string(),
      reason: z.string(),
    }),
  )),
  confidence: z.preprocess((v) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return 0.5;
    return Math.min(1, Math.max(0, n));
  }, z.number().min(0).max(1)),
});

export const analyzerBatchSchema = z.array(analyzerResultSchema);

export type AnalyzerResultParsed = z.infer<typeof analyzerResultSchema>;
