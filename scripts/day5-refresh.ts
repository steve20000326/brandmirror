import { prisma } from "../src/lib/prisma";
import { persistBrandProfile } from "../src/server/analysis/runner";
import { generateScanReport } from "../src/server/report/engine";

const scanJobId = "cmutuudsu0001zg7d2s3ug93s";
const brandId = "cmuct10de0000zgvzodr6dqnr";

async function main() {
  const qwen = await prisma.observation.findMany({
    where: { scanJobId, provider: "qwen" },
    include: { question: true },
  });
  for (const r of qwen) {
    if (!r.question.brandPresent) continue;
    if (!(r.rawResponse || "").includes("澜序")) continue;
    const a = r.analysisJson ? JSON.parse(r.analysisJson) : {};
    console.log({
      id: r.id,
      type: r.question.questionType,
      q: r.question.text.slice(0, 40),
      mentioned: r.brandMentioned,
      rec: a.recognitionStatus,
    });
  }
  await persistBrandProfile(scanJobId);
  const after = await prisma.observation.findMany({
    where: { scanJobId, provider: "qwen" },
    include: { question: true },
  });
  console.log("AFTER_PRICE");
  for (const r of after) {
    if (r.question.questionType !== "price_tier" && !r.question.text.includes("价")) continue;
    const a = r.analysisJson ? JSON.parse(r.analysisJson ?? "{}") : {};
    console.log({
      id: r.id,
      q: r.question.text.slice(0, 50),
      mentioned: r.brandMentioned,
      rec: a.recognitionStatus,
    });
  }
  const report = await generateScanReport(scanJobId);
  console.log("H", report.metrics.hallucinationRisk, report.metrics.byProvider);
  console.log("DX", report.diagnoses.map((d) => d.code));
  console.log("ALL", report.allDiagnoses.map((d) => d.code));
  console.log("RX", report.prescriptions.map((p) => `${p.priority} ${p.title}`));
  console.log("REPORT_URL", `/brands/${brandId}/reports/${scanJobId}`);
}

main().finally(() => prisma.$disconnect());
