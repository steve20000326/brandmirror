import { PrismaClient } from "@prisma/client";
import {
  FASHION_PACK_VERSION,
  generateFashionQuestions,
} from "../src/domain/industry-packs/fashion/index";

async function main() {
  const prisma = new PrismaClient();
  const brandId = "cmuct10de0000zgvzodr6dqnr";

  try {
    const brand = await prisma.brand.findUnique({
      where: { id: brandId },
      include: { competitors: { orderBy: { createdAt: "asc" } } },
    });
    if (!brand) throw new Error("brand missing");

    const existing = await prisma.question.count({
      where: { brandId, source: FASHION_PACK_VERSION, enabled: true },
    });
    console.log("existing before:", existing);

    if (existing < 30) {
      const questions = generateFashionQuestions({
        id: brand.id,
        name: brand.name,
        industry: brand.industry,
        coreProducts: brand.coreProducts,
        targetAudience: brand.targetAudience,
        priceTier: brand.priceTier,
        competitors: brand.competitors.map((c) => ({ name: c.name })),
      });

      await prisma.$transaction(
        questions.map((q) =>
          prisma.question.create({
            data: {
              brandId: brand.id,
              text: q.text,
              questionType: q.questionType,
              persona: q.persona ?? null,
              scenario: q.scenario ?? null,
              purchaseIntent: q.purchaseIntent ?? null,
              brandPresent: q.brandPresent,
              source: q.source,
              enabled: true,
            },
          }),
        ),
      );
      console.log("created:", questions.length);
    } else {
      console.log("already complete, skip create");
    }

    // Idempotent second path: do not insert again
    const after = await prisma.question.count({
      where: { brandId, source: FASHION_PACK_VERSION, enabled: true },
    });
    console.log("count after:", after);

    const qs = await prisma.question.findMany({
      where: { brandId, source: FASHION_PACK_VERSION, enabled: true },
      orderBy: { createdAt: "asc" },
    });

    const counts: Record<string, number> = {};
    let withBrand = 0;
    for (const q of qs) {
      counts[q.questionType ?? "unknown"] =
        (counts[q.questionType ?? "unknown"] || 0) + 1;
      if (q.brandPresent) withBrand += 1;
    }

    console.log(
      JSON.stringify(
        {
          total: qs.length,
          counts,
          withBrand,
          withoutBrand: qs.length - withBrand,
          source: FASHION_PACK_VERSION,
          brandId,
        },
        null,
        2,
      ),
    );

    const order = [
      "brand_cognition",
      "category_discovery",
      "audience_scenario",
      "competitor_comparison",
      "purchase_decision",
    ] as const;
    const titles: Record<(typeof order)[number], string> = {
      brand_cognition: "品牌认知",
      category_discovery: "品类发现",
      audience_scenario: "人群与场景",
      competitor_comparison: "竞品比较",
      purchase_decision: "购买决策",
    };

    for (const key of order) {
      const items = qs.filter((q) => q.questionType === key);
      console.log(`\n## ${titles[key]} (${items.length})`);
      items.forEach((q, i) => {
        console.log(
          `${i + 1}. [${q.brandPresent ? "含品牌" : "无品牌"}] ${q.text}`,
        );
      });
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
