import { prisma } from "../src/lib/prisma";

const scanJobId = "cmutuudsu0001zg7d2s3ug93s";

async function main() {
  const profile = await prisma.brandProfile.findFirst({ where: { scanJobId } });
  const dx = await prisma.diagnosis.findMany({ where: { scanJobId }, orderBy: { createdAt: "asc" } });
  const rx = await prisma.prescription.findMany({ where: { scanJobId }, orderBy: { priority: "asc" } });
  const qwenPrice = await prisma.observation.findUnique({
    where: { id: "cmutuudsx002azg7d0hiz2fgs" },
    include: { question: true },
  });
  console.log("SCORES", {
    aiBrandScore: profile?.aiBrandScore,
    awareness: profile?.awarenessScore,
    recommendation: profile?.recommendationScore,
    discovery: profile?.discoveryScore,
    alignment: profile?.accuracyScore,
    competitor: profile?.competitorScore,
    hallucination: profile?.hallucinationRiskScore,
    providers: profile?.providerMetricsJson,
    summary: profile?.summary,
    portrait: profile?.portraitJson,
  });
  console.log("PRICE", {
    mentioned: qwenPrice?.brandMentioned,
    rec: qwenPrice?.analysisJson ? JSON.parse(qwenPrice.analysisJson).recognitionStatus : null,
  });
  console.log("DX", JSON.stringify(dx, null, 2));
  console.log("RX", JSON.stringify(rx, null, 2));
}

main().finally(() => prisma.$disconnect());
