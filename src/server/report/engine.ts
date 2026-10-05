import type { AnalyzerResult } from "@/ai/analyzers/types";
import { getAnalyzerClient, type AnalyzerChat } from "@/ai/analyzers/observation-analyzer";
import { runDiagnosisEngine } from "@/ai/diagnosis/engine";
import { DIAGNOSIS_ENGINE_VERSION } from "@/ai/diagnosis/types";
import { topDiagnoses } from "@/ai/diagnosis/rules";
import { BRAND_PROFILE_VERSION } from "@/ai/profile/types";
import { buildBrandPortrait } from "@/ai/profile/builder";
import { runPrescriptionEngine } from "@/ai/prescriptions/engine";
import { PRESCRIPTION_ENGINE_VERSION } from "@/ai/prescriptions/types";
import { prisma } from "@/lib/prisma";
import { wrapChatWithUsage } from "@/ai/usage/recorder";
import { getAnalyzerConfig } from "@/lib/env";
import { persistBrandProfile } from "@/server/analysis/runner";
import { computeGeoMetrics } from "@/server/analysis/metrics";

export async function generateScanReport(scanJobId: string, chat?: AnalyzerChat) {
  const job = await prisma.scanJob.findUnique({
    where: { id: scanJobId },
    include: {
      brand: { include: { competitors: true } },
      observations: { include: { question: true } },
    },
  });
  if (!job) throw new Error("扫描任务不存在");

  const metrics = (await persistBrandProfile(scanJobId)) ??
    computeGeoMetrics([], job.brand.name, job.brand.competitors.map((c) => c.name));

  const observations = job.observations
    .filter((o) => o.analysisStatus === "completed" && o.analysisJson)
    .map((o) => ({
      provider: o.provider,
      brandPresent: o.question.brandPresent,
      brandMentioned: Boolean(o.brandMentioned),
      analysis: JSON.parse(o.analysisJson!) as AnalyzerResult,
      recommendationStatus: (JSON.parse(o.analysisJson!) as AnalyzerResult).recommendationStatus,
    }));

  const portrait = buildBrandPortrait(
    {
      name: job.brand.name,
      targetAudience: job.brand.targetAudience,
      priceTier: job.brand.priceTier,
      desiredPositioning: job.brand.desiredPositioning,
      desiredKeywords: job.brand.desiredKeywords,
      coreProducts: job.brand.coreProducts,
    },
    observations,
    metrics,
  );

  const absent = observations.filter((o) => !o.brandPresent);
  const present = observations.filter((o) => o.brandPresent);
  const cfg = getAnalyzerConfig();
  const rawLlm = chat ?? (process.env.DEEPSEEK_API_KEY ? getAnalyzerClient() : undefined);
  const diagnosisChat = rawLlm
    ? wrapChatWithUsage(rawLlm, {
        scanJobId,
        purpose: "diagnosis",
        fallbackProvider: cfg.provider,
        fallbackModel: cfg.model,
      })
    : undefined;
  const prescriptionChat = rawLlm
    ? wrapChatWithUsage(rawLlm, {
        scanJobId,
        purpose: "prescription",
        fallbackProvider: cfg.provider,
        fallbackModel: cfg.model,
      })
    : undefined;

  const diagnoses = await runDiagnosisEngine(
    {
      brandName: job.brand.name,
      metrics,
      portrait,
      absentQuestionCount: absent.length,
      absentMentionCount: absent.filter((o) => o.brandMentioned).length,
      presentQuestionCount: present.length,
      recommendedOnAbsent: absent.filter((o) => o.recommendationStatus === "recommended").length,
      desiredAudience: job.brand.targetAudience,
      desiredPositioning: job.brand.desiredPositioning,
      desiredPriceTier: job.brand.priceTier,
    },
    diagnosisChat,
  );

  const prescriptions = await runPrescriptionEngine(
    {
      brandName: job.brand.name,
      industry: job.brand.industry,
      targetAudience: job.brand.targetAudience,
      priceTier: job.brand.priceTier,
      desiredPositioning: job.brand.desiredPositioning,
      coreProducts: job.brand.coreProducts,
      metrics,
      portrait,
      diagnoses,
    },
    prescriptionChat,
  );

  const shownDiagnoses = topDiagnoses(diagnoses, 5);

  await prisma.$transaction(async (tx) => {
    await tx.diagnosis.deleteMany({ where: { scanJobId } });
    await tx.prescription.deleteMany({ where: { scanJobId } });
    if (shownDiagnoses.length) {
      await tx.diagnosis.createMany({
        data: shownDiagnoses.map((d) => ({
          brandId: job.brandId,
          scanJobId,
          code: d.code,
          severity: d.severity,
          title: d.title,
          finding: d.finding,
          evidenceJson: JSON.stringify(d.evidence),
          businessMeaning: d.businessMeaning,
          confidence: d.confidence,
          engineVersion: DIAGNOSIS_ENGINE_VERSION,
        })),
      });
    }
    if (prescriptions.length) {
      await tx.prescription.createMany({
        data: prescriptions.map((p) => ({
          brandId: job.brandId,
          scanJobId,
          priority: p.priority,
          title: p.title,
          evidence: p.evidence,
          diagnosis: p.diagnosis,
          action: p.action,
          category: p.category,
          expectedEffect: p.expectedEffect,
          difficulty: p.difficulty,
          timeHorizon: p.timeHorizon,
          engineVersion: PRESCRIPTION_ENGINE_VERSION,
          evidenceSource: p.evidenceSource,
          status: "active",
        })),
      });
    }
    const existing = await tx.brandProfile.findFirst({ where: { scanJobId } });
    const versions = {
      portraitJson: JSON.stringify(portrait),
      summary: portrait.executiveSummary,
      profileEngineVersion: BRAND_PROFILE_VERSION,
      diagnosisEngineVersion: DIAGNOSIS_ENGINE_VERSION,
      prescriptionEngineVersion: PRESCRIPTION_ENGINE_VERSION,
    };
    if (existing) {
      await tx.brandProfile.update({ where: { id: existing.id }, data: versions });
    }
  });

  return {
    metrics,
    portrait,
    diagnoses: shownDiagnoses,
    allDiagnoses: diagnoses,
    prescriptions,
  };
}

export async function getScanReport(scanJobId: string) {
  const profile = await prisma.brandProfile.findFirst({ where: { scanJobId } });
  const diagnoses = await prisma.diagnosis.findMany({
    where: { scanJobId },
    orderBy: { createdAt: "asc" },
  });
  const prescriptions = await prisma.prescription.findMany({
    where: { scanJobId },
    orderBy: { priority: "asc" },
  });
  return { profile, diagnoses, prescriptions };
}
