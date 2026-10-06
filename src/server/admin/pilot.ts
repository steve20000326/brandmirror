"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { applyFactReviewRiskCopy, FACT_REVIEW_STATUSES, saveObservationFactReviews } from "./fact-review";
import type { FactReviewStatus } from "./fact-review";

const BRAND_COHORTS = ["calibration", "pilot", "customer"] as const;
type BrandCohort = (typeof BRAND_COHORTS)[number];

export async function updateBrandCohortForm(formData: FormData) {
  const brandId = String(formData.get("brandId") ?? "");
  const cohort = String(formData.get("cohort") ?? "") as BrandCohort;
  if (!BRAND_COHORTS.includes(cohort)) return;
  await prisma.brand.update({
    where: { id: brandId },
    data: {
      cohort,
      isCalibration: cohort === "calibration",
    },
  });
  revalidatePath("/admin/brands");
  revalidatePath(`/admin/brands/${brandId}`);
}

export async function updateBrandAliasesForm(formData: FormData) {
  const brandId = String(formData.get("brandId") ?? "");
  const aliases = String(formData.get("aliases") ?? "")
    .split(/[\n,，]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 5);
  await prisma.brand.update({
    where: { id: brandId },
    data: { aliasesJson: JSON.stringify(aliases) },
  });
  revalidatePath(`/admin/brands/${brandId}`);
}

export async function saveFactReviewForm(formData: FormData) {
  const scanJobId = String(formData.get("scanJobId") ?? "");
  const grouped = new Map<string, Array<{ index: number; status: FactReviewStatus; note: string | null }>>();

  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("status:")) continue;
    const rest = key.slice("status:".length);
    const [observationId, indexRaw] = rest.split(":");
    const status = String(value);
    if (!observationId || !FACT_REVIEW_STATUSES.includes(status as FactReviewStatus)) continue;
    const note = String(formData.get(`note:${observationId}:${indexRaw}`) ?? "") || null;
    const list = grouped.get(observationId) ?? [];
    list.push({ index: Number(indexRaw), status: status as FactReviewStatus, note });
    grouped.set(observationId, list);
  }

  for (const [observationId, reviews] of grouped) {
    await saveObservationFactReviews({ observationId, reviews });
  }

  await applyFactReviewRiskCopy(scanJobId);
  revalidatePath(`/admin/scans/${scanJobId}/facts`);
}

export async function savePilotFeedback(formData: FormData) {
  const brandId = String(formData.get("brandId") ?? "");
  const scanJobId = String(formData.get("scanJobId") ?? "");
  const quoted = String(formData.get("quotedPrice") ?? "").trim();
  await prisma.pilotFeedback.create({
    data: {
      brandId,
      scanJobId,
      newInsight: empty(formData, "newInsight"),
      surprisingInsight: empty(formData, "surprisingInsight"),
      incorrectFinding: empty(formData, "incorrectFinding"),
      actionableItems: empty(formData, "actionableItems"),
      preferredFrequency: empty(formData, "preferredFrequency"),
      willingness: empty(formData, "willingness"),
      willingnessNote: empty(formData, "willingnessNote"),
      quotedPrice: quoted ? Number(quoted) : null,
      paid: formData.get("paid") === "true",
      humanMinutesJson: JSON.stringify({
        dossierMinutes: Number(formData.get("dossierMinutes") || 0),
        questionReviewMinutes: Number(formData.get("questionReviewMinutes") || 0),
        reportReviewMinutes: Number(formData.get("reportReviewMinutes") || 0),
        clientMinutes: Number(formData.get("clientMinutes") || 0),
      }),
    },
  });
  revalidatePath(`/admin/brands/${brandId}`);
}

function empty(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}
