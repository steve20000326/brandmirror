import { z } from "zod";

export const prescriptionItemSchema = z.object({
  priority: z.number(),
  title: z.string(),
  category: z.string(),
  evidence: z.string(),
  diagnosis: z.string(),
  action: z.string(),
  expectedEffect: z.string(),
  difficulty: z.enum(["low", "medium", "high"]),
  timeHorizon: z.enum(["short", "medium", "long"]),
  evidenceSource: z.string().optional(),
});

export const prescriptionBatchSchema = z.array(prescriptionItemSchema);
