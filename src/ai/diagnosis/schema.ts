import { z } from "zod";

export const diagnosisItemSchema = z.object({
  code: z.string(),
  severity: z.enum(["high", "medium", "low"]),
  title: z.string(),
  finding: z.string(),
  evidence: z.array(z.string()),
  businessMeaning: z.string(),
  confidence: z.number(),
});

export const diagnosisBatchSchema = z.array(diagnosisItemSchema);
