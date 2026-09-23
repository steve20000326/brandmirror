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
