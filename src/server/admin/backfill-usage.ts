import { prisma } from "@/lib/prisma";
import { calculateTokenCost } from "@/ai/pricing/calculator";

/** Apply current price card to already-recorded token rows. Does not invent tokens. */
export async function backfillUsagePricing() {
  const rows = await prisma.modelUsage.findMany();
  let updated = 0;
  for (const row of rows) {
    const purpose = row.purpose || (row.scanJobId ? "scan" : null);
    if (!purpose) continue;
    const cost = calculateTokenCost({
      provider: row.provider,
      model: row.model,
      promptTokens: row.promptTokens,
      completionTokens: row.completionTokens,
    });
    const needs =
      row.purpose !== purpose ||
      row.totalCost !== cost.totalCost ||
      row.currency !== cost.currency;
    if (!needs) continue;
    await prisma.modelUsage.update({
      where: { id: row.id },
      data: {
        purpose,
        inputCost: cost.inputCost,
        outputCost: cost.outputCost,
        totalCost: cost.totalCost,
        estimatedCost: cost.totalCost ?? 0,
        currency: cost.currency,
        pricingVersion: cost.pricingVersion,
      },
    });
    updated += 1;
  }
  return updated;
}
