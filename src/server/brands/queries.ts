import { FASHION_PACK_VERSION } from "@/domain/industry-packs/fashion";
import { prisma } from "@/lib/prisma";
import type { BrandDetail, BrandListItem } from "@/types/brand";

/** List all brands for the brands index page. */
export async function listBrands(): Promise<BrandListItem[]> {
  const brands = await prisma.brand.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      industry: true,
      status: true,
      createdAt: true,
    },
  });
  return brands;
}

/** Load a single brand with competitors for the detail page. */
export async function getBrandById(id: string): Promise<BrandDetail | null> {
  const brand = await prisma.brand.findUnique({
    where: { id },
    include: {
      competitors: {
        orderBy: { createdAt: "asc" },
        select: { id: true, name: true, websiteUrl: true },
      },
    },
  });

  if (!brand) return null;

  return {
    id: brand.id,
    name: brand.name,
    industry: brand.industry,
    websiteUrl: brand.websiteUrl,
    officialStoreUrl: brand.officialStoreUrl,
    description: brand.description,
    coreProducts: brand.coreProducts,
    targetAudience: brand.targetAudience,
    priceTier: brand.priceTier,
    desiredPositioning: brand.desiredPositioning,
    desiredKeywords: brand.desiredKeywords,
    status: brand.status,
    createdAt: brand.createdAt,
    competitors: brand.competitors,
  };
}

/** Whether this brand already has a complete Fashion v0.1 plan. */
export async function brandHasQuestionPlan(brandId: string): Promise<boolean> {
  const count = await prisma.question.count({
    where: {
      brandId,
      source: FASHION_PACK_VERSION,
      enabled: true,
    },
  });
  return count >= 30;
}
