import { prisma } from "../src/lib/prisma";
import { analyzeObservationBatch } from "../src/ai/analyzers/observation-analyzer";
import { toBrandDossier } from "../src/server/analysis/types";

async function main() {
  const failed = await prisma.observation.findMany({
    where: { scanJobId: "cmutuudsu0001zg7d2s3ug93s", analysisStatus: "failed" },
    include: { question: true, scanJob: { include: { brand: { include: { competitors: true } } } } },
    take: 2,
  });
  console.log("failed_count_errors:");
  for (const f of failed) {
    console.log("-", f.analysisErrorMessage?.slice(0, 400));
  }
  if (failed.length === 0) return;
  const dossier = toBrandDossier(failed[0].scanJob.brand);
  const items = failed.map((obs) => ({
    observationId: obs.id,
    question: obs.question.text,
    questionType: obs.question.questionType ?? "",
    brandPresent: obs.question.brandPresent,
    response: (obs.rawResponse ?? "").slice(0, 1200),
  }));
  try {
    const result = await analyzeObservationBatch(items, dossier);
    console.log("debug_ok", [...result.keys()]);
  } catch (err) {
    console.log("debug_fail", err instanceof Error ? err.message.slice(0, 800) : err);
  }
  await prisma.$disconnect();
}

main();
