import { defaultBrandAliases } from "../src/domain/brands/brand-matcher";
import { prisma } from "../src/lib/prisma";
import {
  findAliasMissedObservations,
  persistBrandProfile,
  reanalyzeObservations,
} from "../src/server/analysis/runner";
import { generateScanReport } from "../src/server/report/engine";

const scanJobId = "cmutuudsu0001zg7d2s3ug93s";
const brandId = "cmuct10de0000zgvzodr6dqnr";

async function main() {
  await prisma.brand.update({
    where: { id: brandId },
    data: { aliasesJson: JSON.stringify(defaultBrandAliases("澜序女装")) },
  });

  const missed = await findAliasMissedObservations(scanJobId);
  const before = missed.map((o) => ({
    id: o.id,
    provider: o.provider,
    brandMentioned: o.brandMentioned,
    snippet: (o.rawResponse ?? "").slice(0, 80),
    analysisJson: o.analysisJson,
  }));
  console.log("ALIAS_MISSES", JSON.stringify(before.map((b) => ({
    id: b.id,
    provider: b.provider,
    brandMentioned: b.brandMentioned,
    recognition: b.analysisJson ? JSON.parse(b.analysisJson).recognitionStatus : null,
    snippet: b.snippet,
  })), null, 2));

  if (missed.length) {
    await reanalyzeObservations(
      scanJobId,
      missed.map((o) => o.id),
    );
  } else {
    await persistBrandProfile(scanJobId);
  }

  const afterRows = await prisma.observation.findMany({
    where: { id: { in: missed.map((o) => o.id) } },
  });
  console.log("ALIAS_AFTER", JSON.stringify(afterRows.map((o) => ({
    id: o.id,
    provider: o.provider,
    brandMentioned: o.brandMentioned,
    recognition: o.analysisJson ? JSON.parse(o.analysisJson).recognitionStatus : null,
  })), null, 2));

  const first = await generateScanReport(scanJobId);
  const second = await generateScanReport(scanJobId);
  const dCount = await prisma.diagnosis.count({ where: { scanJobId } });
  const pCount = await prisma.prescription.count({ where: { scanJobId } });
  console.log("IDEMPOTENT", {
    diagnoses: dCount,
    prescriptions: pCount,
    firstDx: first.diagnoses.length,
    secondDx: second.diagnoses.length,
    sameDx: first.diagnoses.length === second.diagnoses.length && dCount === first.diagnoses.length,
  });

  console.log("METRICS", JSON.stringify({
    aiBrandScore: first.metrics.aiBrandScore,
    awareness: first.metrics.awareness,
    recommendation: first.metrics.recommendation,
    discovery: first.metrics.discovery,
    alignment: first.metrics.alignment,
    competitor: first.metrics.competitor,
    hallucinationRisk: first.metrics.hallucinationRisk,
    byProvider: first.metrics.byProvider,
  }, null, 2));

  console.log("PORTRAIT", JSON.stringify(first.portrait, null, 2));
  console.log("DIAGNOSES", JSON.stringify(first.diagnoses, null, 2));
  console.log("ALL_DIAGNOSES", JSON.stringify(first.allDiagnoses.map((d) => d.code), null, 2));
  console.log("PRESCRIPTIONS", JSON.stringify(first.prescriptions, null, 2));
  console.log("REPORT_URL", `/brands/${brandId}/reports/${scanJobId}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
