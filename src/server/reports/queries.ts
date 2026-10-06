import { prisma } from "@/lib/prisma";
import type { BrandPortrait } from "@/ai/profile/types";
import type { GeoMetrics } from "@/server/analysis/metrics";
import { buildClientReportViewModel, getReportStatus } from "./builder";
import type { ClientReportViewModel } from "./types";
import { loadFactReviewRows, summarizeFactReviews } from "@/server/admin/fact-review";

export async function loadClientReport(scanJobId: string): Promise<{
  view: ClientReportViewModel | null;
  status: "ready" | "incomplete";
  brandId: string | null;
} | null> {
  const job = await prisma.scanJob.findUnique({
    where: { id: scanJobId },
    include: { brand: true },
  });
  if (!job) return null;

  const [profile, diagnoses, prescriptions, questionCounts, observationCount, factRows] = await Promise.all([
    prisma.brandProfile.findFirst({ where: { scanJobId } }),
    prisma.diagnosis.findMany({ where: { scanJobId }, orderBy: { createdAt: "asc" } }),
    prisma.prescription.findMany({ where: { scanJobId }, orderBy: { priority: "asc" } }),
    prisma.question.groupBy({
      by: ["brandPresent"],
      where: { brandId: job.brandId, enabled: true },
      _count: { _all: true },
    }),
    prisma.observation.count({ where: { scanJobId } }),
    loadFactReviewRows(scanJobId),
  ]);

  const brandedQuestionCount = questionCounts.find((q) => q.brandPresent)?._count._all ?? 0;
  const unbrandedQuestionCount = questionCounts.find((q) => !q.brandPresent)?._count._all ?? 0;
  const questionCount = brandedQuestionCount + unbrandedQuestionCount;
  const unbrandedObservations = await prisma.observation.count({
    where: { scanJobId, question: { brandPresent: false } },
  });

  const status = getReportStatus({
    portraitJson: profile?.portraitJson ?? null,
    diagnosisCount: diagnoses.length,
    prescriptionCount: prescriptions.length,
    analysisStatus: job.analysisStatus,
  });

  if (!profile?.profileJson) {
    return { view: null, status: "incomplete", brandId: job.brandId };
  }

  const metrics = JSON.parse(profile.profileJson) as GeoMetrics;
  const portrait = profile.portraitJson
    ? (JSON.parse(profile.portraitJson) as BrandPortrait)
    : null;
  const testedAt = (job.completedAt ?? job.createdAt).toISOString().slice(0, 10);

  const view = buildClientReportViewModel({
    brand: {
      name: job.brand.name,
      industry: job.brand.industry,
      isCalibration: job.brand.isCalibration,
      targetAudience: job.brand.targetAudience,
      priceTier: job.brand.priceTier,
      desiredPositioning: job.brand.desiredPositioning,
      coreProducts: job.brand.coreProducts,
    },
    testedAt,
    questionCount,
    observationCount,
    unbrandedQuestionCount,
    brandedQuestionCount,
    absentObservationCount: unbrandedObservations,
    analysisStatus: job.analysisStatus,
    metrics,
    portrait,
    summary: profile.summary,
    diagnoses,
    prescriptions,
    factReview: summarizeFactReviews(factRows),
  });

  view.reportMeta.status = status;
  return { view, status, brandId: job.brandId };
}
