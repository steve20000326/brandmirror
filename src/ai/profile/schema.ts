import { z } from "zod";

const evidenceItem = z.object({
  label: z.string(),
  evidenceCount: z.number(),
  providers: z.array(z.string()),
});

export const brandPortraitSchema = z.object({
  audience: z.object({
    summary: z.string(),
    confidence: z.number(),
    evidenceCount: z.number(),
    providers: z.array(z.string()),
  }),
  priceTier: z.object({
    summary: z.string(),
    confidence: z.number(),
    evidenceCount: z.number(),
    providers: z.array(z.string()),
  }),
  style: z.object({
    primary: z.array(evidenceItem),
    secondary: z.array(evidenceItem),
    confidence: z.number(),
  }),
  scenarios: z.object({
    strong: z.array(evidenceItem),
    weak: z.array(evidenceItem),
  }),
  productAssociations: z.array(evidenceItem),
  competitorAssociations: z.array(evidenceItem),
  positiveAssociations: z.array(evidenceItem),
  weakAssociations: z.array(evidenceItem),
  recognitionGaps: z.array(z.string()),
  modelDisagreements: z.array(
    z.object({
      dimension: z.string(),
      views: z.array(z.object({ provider: z.string(), value: z.string() })),
    }),
  ),
  executiveSummary: z.string(),
  hasStableCognition: z.boolean(),
  engineVersion: z.string(),
});
