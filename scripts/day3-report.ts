import { PrismaClient } from "@prisma/client";

const scanJobId = "cmutuudsu0001zg7d2s3ug93s";
const brandId = "cmuct10de0000zgvzodr6dqnr";

async function main() {
  const p = new PrismaClient();
  const usage = await p.modelUsage.groupBy({
    by: ["provider"],
    where: { scanJobId },
    _sum: { promptTokens: true, completionTokens: true, totalTokens: true },
    _count: true,
  });
  console.log("USAGE", JSON.stringify(usage, null, 2));

  const failed = await p.observation.count({
    where: { scanJobId, status: "failed" },
  });
  console.log("FAILED", failed);

  const samples = [
    "国内中高端职业女装有哪些选择？",
    "适合城市职业女性的国产女装品牌有哪些？",
    "35岁职业女性买通勤连衣裙，有哪些品牌比较合适？",
    "第一次听说澜序女装，一般会怎么介绍它？",
    "澜序女装属于什么价格档次？",
  ];

  for (const text of samples) {
    const q = await p.question.findFirst({ where: { brandId, text } });
    console.log("\n===== Q:", text, "found=", Boolean(q));
    if (!q) continue;
    const obs = await p.observation.findMany({
      where: { scanJobId, questionId: q.id },
      select: { provider: true, rawResponse: true, status: true },
    });
    for (const o of obs) {
      console.log("\n---", o.provider, o.status, "---");
      console.log(o.rawResponse);
    }
  }

  const brandQs = await p.question.findMany({
    where: { brandId, brandPresent: true, enabled: true },
    select: { id: true, text: true },
  });
  console.log("\n\n===== BRAND QUESTIONS", brandQs.length);
  for (const q of brandQs) {
    const obs = await p.observation.findMany({
      where: { scanJobId, questionId: q.id },
      select: { provider: true, rawResponse: true },
    });
    console.log("\n####", q.text);
    for (const o of obs) {
      const snippet = (o.rawResponse ?? "").slice(0, 400).replace(/\n/g, " ");
      console.log(o.provider, ":", snippet);
    }
  }

  await p.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
