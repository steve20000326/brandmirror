import { prisma } from "../src/lib/prisma";
import { getOrCreateReportShare } from "../src/server/reports/share";
import { loadClientReport } from "../src/server/reports/queries";
import { loadUsageOverview, formatKnownCosts } from "../src/server/admin/usage";
import { backfillUsagePricing } from "../src/server/admin/backfill-usage";
import { DEEPSEEK_FLASH_PEAK, QWEN_FLASH, getPricingEntry } from "../src/ai/pricing/pricing-config";

const scanJobId = "cmutuudsu0001zg7d2s3ug93s";
const brandId = "cmuct10de0000zgvzodr6dqnr";

async function main() {
  await prisma.brand.update({
    where: { id: brandId },
    data: { isCalibration: true },
  });
  await backfillUsagePricing();
  const share = await getOrCreateReportShare(scanJobId);
  const loaded = await loadClientReport(scanJobId);
  const usage = await loadUsageOverview();
  const reportUsage = await loadUsageOverview(scanJobId);
  const hy = getPricingEntry("tencent-hy", "hy3");
  console.log("STAGE", loaded?.view?.stage);
  console.log("SCORE", loaded?.view?.scores.aiBrandScore);
  console.log("SUMMARY", loaded?.view?.executiveSummary);
  console.log("DIAGNOSES", loaded?.view?.diagnoses.map((d) => d.title));
  console.log("P", loaded?.view?.prescriptions.map((p) => `P${p.priority} ${p.title}`));
  console.log("SHARE_ENABLED", share.enabled, "TOKEN_LEN", share.shareToken.length);
  console.log("USAGE_OVERALL", {
    requests: usage.overall.requests,
    prompt: usage.overall.promptTokens,
    completion: usage.overall.completionTokens,
    total: usage.overall.totalTokens,
  });
  console.log("USAGE_PROVIDER", Object.fromEntries(
    Object.entries(usage.byProvider).map(([k, v]) => [k, { requests: v.requests, in: v.promptTokens, out: v.completionTokens }]),
  ));
  console.log("USAGE_PURPOSE", Object.fromEntries(
    Object.entries(usage.byPurpose).map(([k, v]) => [k, { requests: v.requests, tokens: v.totalTokens }]),
  ));
  console.log("REPORT_COST", formatKnownCosts(reportUsage.overall));
  console.log("PRICING", {
    deepseek: DEEPSEEK_FLASH_PEAK.pricingVersion,
    qwen: QWEN_FLASH.pricingVersion,
    hy3: hy?.pricingVersion,
    hy3priced: hy?.inputPer1M != null,
  });
}

main().finally(() => prisma.$disconnect());
