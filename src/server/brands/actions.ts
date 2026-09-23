"use server";

import { redirect } from "next/navigation";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { emptyToNull, parseBrandFormData } from "@/server/brands/schema";

export type CreateBrandState = {
  error?: string;
};

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
