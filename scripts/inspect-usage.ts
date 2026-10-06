import { prisma } from "../src/lib/prisma";

async function main() {
  const [obs, usage, jobs, brands] = await Promise.all([
    prisma.observation.count(),
    prisma.modelUsage.count(),
    prisma.scanJob.findMany({
      select: {
        id: true,
        brandId: true,
        totalTasks: true,
        completedTasks: true,
        status: true,
        createdAt: true,
        brand: { select: { name: true } },
      },
    }),
    prisma.brand.findMany({ select: { id: true, name: true } }),
  ]);

  const byJob = await prisma.modelUsage.groupBy({
    by: ["scanJobId", "purpose", "provider"],
    _count: { _all: true },
    _sum: { promptTokens: true, completionTokens: true, totalTokens: true },
  });

  const byPurpose = await prisma.modelUsage.groupBy({
    by: ["purpose"],
    _count: { _all: true },
    _sum: { totalTokens: true },
  });

  const zeroToken = await prisma.modelUsage.count({
    where: { purpose: "scan", totalTokens: 0, promptTokens: 0, completionTokens: 0 },
  });

  const nullJob = await prisma.modelUsage.count({ where: { scanJobId: null } });

  const lanxu = "cmutuudsu0001zg7d2s3ug93s";
  const lanxuUsage = await prisma.modelUsage.count({ where: { scanJobId: lanxu } });
  const lanxuScan = await prisma.modelUsage.count({
    where: { scanJobId: lanxu, OR: [{ purpose: "scan" }, { purpose: null }] },
  });
  const lanxuObs = await prisma.observation.count({ where: { scanJobId: lanxu } });
  const lanxuObsByStatus = await prisma.observation.groupBy({
    by: ["status", "provider"],
    where: { scanJobId: lanxu },
    _count: { _all: true },
    _avg: { attemptCount: true },
  });

  const createdBuckets = await prisma.$queryRawUnsafe<Array<{ day: string; n: bigint }>>(
    `SELECT date(createdAt) as day, count(*) as n FROM ModelUsage GROUP BY date(createdAt) ORDER BY day`,
  );

  const dupCheck = await prisma.$queryRawUnsafe<
    Array<{ scanJobId: string; provider: string; n: bigint }>
  >(
    `SELECT scanJobId, provider, count(*) as n FROM ModelUsage WHERE purpose = 'scan' OR purpose IS NULL GROUP BY scanJobId, provider ORDER BY n DESC LIMIT 20`,
  );

  const samples = await prisma.modelUsage.findMany({
    where: { scanJobId: null, purpose: "scan" },
    take: 8,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      provider: true,
      model: true,
      promptTokens: true,
      completionTokens: true,
      totalTokens: true,
      createdAt: true,
      pricingVersion: true,
    },
  });
  const tokenHist = await prisma.$queryRawUnsafe<
    Array<{ promptTokens: number; completionTokens: number; n: bigint }>
  >(
    `SELECT promptTokens, completionTokens, count(*) as n FROM ModelUsage WHERE scanJobId IS NULL AND purpose = 'scan' GROUP BY promptTokens, completionTokens ORDER BY n DESC`,
  );
  const nullMeta = await prisma.modelUsage.groupBy({
    by: ["model", "purpose"],
    where: { scanJobId: null },
    _count: { _all: true },
    _avg: { promptTokens: true, completionTokens: true },
  });
  console.log("NULL_META", nullMeta);
  console.log(JSON.stringify({
    obs,
    usage,
    nullJob,
    zeroTokenScan: zeroToken,
    brands: brands.map((b) => b.name),
    jobs: jobs.map((j) => ({
      id: j.id,
      brand: j.brand.name,
      total: j.totalTasks,
      completed: j.completedTasks,
      status: j.status,
      createdAt: j.createdAt,
    })),
    byPurpose,
    byJob,
    lanxuObs,
    lanxuUsage,
    lanxuScan,
    lanxuObsByStatus,
    createdBuckets: createdBuckets.map((r) => ({ day: r.day, n: Number(r.n) })),
    dupCheck: dupCheck.map((r) => ({ ...r, n: Number(r.n) })),
    samples,
    tokenHist: tokenHist.map((r) => ({ ...r, n: Number(r.n) })),
  }, null, 2));
}

main().finally(() => prisma.$disconnect());
