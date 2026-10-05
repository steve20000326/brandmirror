import { prisma } from "../src/lib/prisma";

async function main() {
  const nullMeta = await prisma.modelUsage.groupBy({
    by: ["model", "purpose"],
    where: { scanJobId: null },
    _count: { _all: true },
    _avg: { promptTokens: true, completionTokens: true },
  });
  console.log(JSON.stringify(nullMeta, null, 2));
}

main().finally(() => prisma.$disconnect());
