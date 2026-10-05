import { prisma } from "../src/lib/prisma";
import type { AnalyzerResult } from "../src/ai/analyzers/types";
import { getBrandProfileForScan } from "../src/server/analysis/queries";

const scanJobId = "cmutuudsu0001zg7d2s3ug93s";

async function main() {
  const profile = await getBrandProfileForScan(scanJobId);
  console.log("PROFILE_COUNT", await prisma.brandProfile.count({ where: { scanJobId } }));
  console.log("METRICS", profile?.profileJson);
  console.log("PROVIDER", profile?.providerMetricsJson);

  const obs = await prisma.observation.findMany({
    where: { scanJobId, analysisStatus: "completed" },
    include: { question: { select: { text: true, brandPresent: true } } },
  });

  const counts: Record<string, Record<string, number>> = {};
  for (const o of obs.filter((x) => x.question.brandPresent)) {
    const parsed = JSON.parse(o.analysisJson ?? "{}") as AnalyzerResult;
    const st = parsed.recognitionStatus ?? "null";
    counts[o.provider] ??= {};
    counts[o.provider][st] = (counts[o.provider][st] ?? 0) + 1;
  }
  console.log("RECOG", JSON.stringify(counts, null, 2));

  console.log("\n=== QWEN UNSUPPORTED ===");
  let n = 0;
  for (const o of obs.filter((x) => x.provider === "qwen" && x.question.brandPresent)) {
    const parsed = JSON.parse(o.analysisJson ?? "{}") as AnalyzerResult;
    if (
      parsed.recognitionStatus === "unsupported_specifics" ||
      parsed.unsupportedClaims.length > 0
    ) {
      n += 1;
      console.log("\nQ:", o.question.text);
      console.log("status:", parsed.recognitionStatus);
      console.log("claims:", JSON.stringify(parsed.unsupportedClaims));
      console.log("raw:", (o.rawResponse ?? "").slice(0, 350));
      if (n >= 8) break;
    }
  }
  console.log("qwen_claim_rows", n);

  for (const provider of ["deepseek", "tencent-hy"] as const) {
    console.log(`\n=== ${provider} UNKNOWN ===`);
    let i = 0;
    for (const o of obs.filter((x) => x.provider === provider && x.question.brandPresent)) {
      const parsed = JSON.parse(o.analysisJson ?? "{}") as AnalyzerResult;
      if (parsed.recognitionStatus === "unknown") {
        i += 1;
        console.log("\nQ:", o.question.text);
        console.log("raw:", (o.rawResponse ?? "").slice(0, 220));
        if (i >= 3) break;
      }
    }
  }

  const samples = [
    "国内中高端职业女装有哪些选择？",
    "澜序女装属于什么价格档次？",
    "第一次听说澜序女装，一般会怎么介绍它？",
    "澜序女装、玖姿和朗姿，哪个更偏正式职场风？",
    "35岁职业女性买通勤连衣裙，有哪些品牌比较合适？",
  ];
  console.log("\n=== SAMPLES ===");
  for (const text of samples) {
    const set = obs.filter((o) => o.question.text === text);
    console.log("\n##", text);
    for (const o of set) {
      const parsed = JSON.parse(o.analysisJson ?? "{}") as AnalyzerResult;
      console.log(o.provider, {
        mentioned: o.brandMentioned,
        rec: parsed.recommendationStatus,
        recog: parsed.recognitionStatus,
        rank: parsed.brandRank,
        claims: parsed.unsupportedClaims,
      });
    }
  }

  await prisma.$disconnect();
}

main();
