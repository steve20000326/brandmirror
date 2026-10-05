import { prisma } from "../src/lib/prisma";
import { loadUsageOverview } from "../src/server/admin/usage";

async function main() {
  const before = await prisma.modelUsage.groupBy({
    by: ["purpose"],
    _count: { _all: true },
  });
  const orphans = await prisma.modelUsage.deleteMany({
    where: {
      scanJobId: null,
      OR: [
        { model: { contains: "-test" } },
        { promptTokens: 1, completionTokens: 2, totalTokens: 3 },
        { totalTokens: 0, purpose: { in: ["analysis", "diagnosis", "prescription"] } },
      ],
    },
  });
  const leftoverNull = await prisma.modelUsage.count({ where: { scanJobId: null } });
  const agg = await loadUsageOverview();
  const lanxu = await loadUsageOverview("cmutuudsu0001zg7d2s3ug93s");
  console.log({
    before,
    deletedOrphans: orphans.count,
    leftoverNull,
    businessRequests: agg.overall.requests,
    businessScan: agg.byPurpose.scan?.requests ?? 0,
    businessTokens: agg.overall.totalTokens,
    unattached: agg.unattached,
    lanxuScan: lanxu.byPurpose.scan?.requests ?? 0,
    lanxuTokens: lanxu.overall.totalTokens,
  });
}

main().finally(() => prisma.$disconnect());
