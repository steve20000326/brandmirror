import { createHash } from "crypto";
import { prisma } from "../src/lib/prisma";
import { processAnalysisBatch } from "../src/server/analysis/runner";
import { persistBrandProfile } from "../src/server/analysis/runner";
import { getBrandProfileForScan } from "../src/server/analysis/queries";

const scanJobId = "cmutuudsu0001zg7d2s3ug93s";

async function hashResponses() {
  const rows = await prisma.observation.findMany({
    where: { scanJobId },
    select: { id: true, rawResponse: true },
    orderBy: { id: "asc" },
  });
  const hash = createHash("sha256");
  for (const row of rows) hash.update(`${row.id}:${row.rawResponse ?? ""}`);
  return { count: rows.length, digest: hash.digest("hex") };
}

async function main() {
  const before = await hashResponses();
  console.log("raw_before", before);

  let pending = 1;
  let loops = 0;
  while (pending > 0 && loops < 20) {
    const result = await processAnalysisBatch(scanJobId);
    loops += 1;
    pending = result.pending;
    console.log(
      `loop=${loops} processed=${result.processed} completed=${result.completed} failed=${result.failed} pending=${result.pending} status=${result.status}`,
    );
  }

  await persistBrandProfile(scanJobId);
  const after = await hashResponses();
  console.log("raw_after", after);
  console.log("raw_unchanged", before.digest === after.digest);

  const profileCount = await prisma.brandProfile.count({ where: { scanJobId } });
  console.log("profiles", profileCount);
  const profile = await getBrandProfileForScan(scanJobId);
  console.log("scores", {
    aiBrandScore: profile?.aiBrandScore,
    awareness: profile?.awarenessScore,
    recommendation: profile?.recommendationScore,
    discovery: profile?.discoveryScore,
    alignment: profile?.accuracyScore,
    competitor: profile?.competitorScore,
    hallucination: profile?.hallucinationRiskScore,
  });
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err instanceof Error ? err.message : err);
  await prisma.$disconnect();
  process.exit(1);
});
