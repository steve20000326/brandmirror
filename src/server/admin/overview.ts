import { prisma } from "@/lib/prisma";
import { loadUsageOverview } from "./usage";

export function cohortLabel(cohort?: string | null, isCalibration?: boolean): string {
  if (cohort === "pilot") return "Pilot";
  if (cohort === "customer") return "Customer";
  if (cohort === "calibration" || isCalibration) return "Calibration";
  return "Customer";
}

export async function loadAdminOverview() {
  const [brandTotal, realBrands, scanTotal, scanOk, observations, usage] = await Promise.all([
    prisma.brand.count(),
    prisma.brand.count({ where: { isCalibration: false } }),
    prisma.scanJob.count(),
    prisma.scanJob.count({ where: { status: "completed" } }),
    prisma.observation.count(),
    loadUsageOverview(),
  ]);
  return {
    brandTotal,
    realBrands,
    scanTotal,
    scanOk,
    observations,
    usage,
  };
}

export async function loadAdminBrands() {
  const brands = await prisma.brand.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      scanJobs: { orderBy: { createdAt: "desc" }, take: 1 },
      brandProfiles: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  return brands.map((b) => {
    const latest = b.scanJobs[0];
    const profile = b.brandProfiles.find((p) => p.scanJobId === latest?.id) ?? b.brandProfiles[0];
    return {
      id: b.id,
      name: b.name,
      industry: b.industry,
      createdAt: b.createdAt,
      isCalibration: b.isCalibration,
      cohort: b.cohort,
      latestScanId: latest?.id ?? null,
      latestScanAt: latest?.createdAt ?? null,
      score: profile?.aiBrandScore ?? null,
    };
  });
}

export async function loadAdminScans() {
  return prisma.scanJob.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      brand: { select: { id: true, name: true, isCalibration: true, cohort: true } },
      _count: { select: { observations: true } },
    },
  });
}
