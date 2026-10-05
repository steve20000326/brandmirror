import { PrismaClient } from "@prisma/client";

const scanJobId = "cmutuudsu0001zg7d2s3ug93s";

async function main() {
  const p = new PrismaClient();
  await p.observation.updateMany({
    where: { scanJobId },
    data: {
      analysisStatus: "not_started",
      analysisErrorMessage: null,
      analysisAttemptCount: 0,
      analysisJson: null,
      analyzerVersion: null,
      brandMentioned: null,
      brandRank: null,
      recommended: null,
      competitorsJson: null,
      attributesJson: null,
    },
  });
  await p.brandProfile.deleteMany({ where: { scanJobId } });
  await p.scanJob.update({
    where: { id: scanJobId },
    data: {
      analysisStatus: "not_started",
      analyzedTasks: 0,
      analysisFailedTasks: 0,
      analysisStartedAt: null,
      analysisCompletedAt: null,
      analyzerVersion: null,
    },
  });
  const still = await p.observation.count({
    where: { scanJobId, rawResponse: { not: null } },
  });
  console.log("reset_done raw_kept", still);
  await p.$disconnect();
}

main();
