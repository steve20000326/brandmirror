"use server";

import { redirect } from "next/navigation";
import { ZodError } from "zod";
import { getIndustryPack } from "@/domain/industry-packs";
import { prisma } from "@/lib/prisma";
import {
  countPlanQuestions,
  saveGeneratedQuestions,
} from "@/server/brands/questions";
import { emptyToNull, parseBrandFormData } from "@/server/brands/schema";

export type CreateBrandState = {
  error?: string;
};

export type GeneratePlanState = {
  error?: string;
};

const EXPECTED_PLAN_SIZE = 30;

/** Create Brand + up to 3 Competitors in one transaction. */
export async function createBrand(
  _prev: CreateBrandState,
  formData: FormData,
): Promise<CreateBrandState> {
  let brandId: string;

  try {
    const data = parseBrandFormData(formData);

    const brand = await prisma.$transaction(async (tx) => {
      const created = await tx.brand.create({
        data: {
          name: data.name,
          industry: data.industry,
          websiteUrl: emptyToNull(data.websiteUrl),
          officialStoreUrl: emptyToNull(data.officialStoreUrl),
          description: emptyToNull(data.description),
          coreProducts: emptyToNull(data.coreProducts),
          targetAudience: emptyToNull(data.targetAudience),
          priceTier: emptyToNull(data.priceTier),
          desiredPositioning: emptyToNull(data.desiredPositioning),
          desiredKeywords: emptyToNull(data.desiredKeywords),
          status: "draft",
          competitors: {
            create: data.competitors.map((name) => ({ name })),
          },
        },
      });
      return created;
    });

    brandId = brand.id;
  } catch (err) {
    if (err instanceof ZodError) {
      return { error: err.issues[0]?.message ?? "请检查表单填写是否正确" };
    }
    console.error("[createBrand]", err);
    return { error: "保存失败，请稍后重试" };
  }

  redirect(`/brands/${brandId}`);
}

/**
 * Idempotent: if 30 fashion-v0.1 questions already exist, just redirect.
 * Never deletes or regenerates an existing plan.
 */
export async function generateBrandQuestionPlan(
  brandId: string,
): Promise<GeneratePlanState> {
  try {
    const brand = await prisma.brand.findUnique({
      where: { id: brandId },
      include: { competitors: { orderBy: { createdAt: "asc" } } },
    });

    if (!brand) {
      return { error: "品牌不存在" };
    }

    const pack = getIndustryPack(brand.industry);
    if (!pack) {
      return {
        error:
          "当前MVP仅开放品牌女装Industry Pack，其他行业将在验证后逐步增加。",
      };
    }

    const existing = await countPlanQuestions(brand.id, pack.version);
    if (existing >= EXPECTED_PLAN_SIZE) {
      redirect(`/brands/${brand.id}/questions`);
    }

    if (existing > 0 && existing < EXPECTED_PLAN_SIZE) {
      return {
        error: `测试方案数据不完整（${existing}/${EXPECTED_PLAN_SIZE}），请联系开发排查，请勿重复生成。`,
      };
    }

    const questions = pack.generateQuestions({
      id: brand.id,
      name: brand.name,
      industry: brand.industry,
      coreProducts: brand.coreProducts,
      targetAudience: brand.targetAudience,
      priceTier: brand.priceTier,
      competitors: brand.competitors.map((c) => ({ name: c.name })),
    });

    if (questions.length !== EXPECTED_PLAN_SIZE) {
      return { error: "问题生成数量异常，请稍后重试" };
    }

    await saveGeneratedQuestions(brand.id, questions);
  } catch (err) {
    if (
      err &&
      typeof err === "object" &&
      "digest" in err &&
      typeof (err as { digest?: string }).digest === "string" &&
      (err as { digest: string }).digest.startsWith("NEXT_REDIRECT")
    ) {
      throw err;
    }
    console.error("[generateBrandQuestionPlan]", err);
    return { error: "生成测试方案失败，请稍后重试" };
  }

  redirect(`/brands/${brandId}/questions`);
}
