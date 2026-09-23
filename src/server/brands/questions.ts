import { prisma } from "@/lib/prisma";
import type { GeneratedQuestion } from "@/domain/industry-packs/types";

export async function countPlanQuestions(
  brandId: string,
  source: string,
): Promise<number> {
  return prisma.question.count({
    where: { brandId, source, enabled: true },
  });
}

export async function listPlanQuestions(brandId: string, source: string) {
  return prisma.question.findMany({
    where: { brandId, source, enabled: true },
    orderBy: { createdAt: "asc" },
  });
}

/** Persist a generated plan. Caller must ensure idempotency first. */
export async function saveGeneratedQuestions(
  brandId: string,
  questions: GeneratedQuestion[],
) {
  await prisma.$transaction(
    questions.map((q) =>
      prisma.question.create({
        data: {
          brandId,
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
}
