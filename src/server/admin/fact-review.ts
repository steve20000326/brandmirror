import { prisma } from "@/lib/prisma";
import type { AnalyzerResult } from "@/ai/analyzers/types";

export const FACT_REVIEW_STATUSES = ["confirmed_true", "confirmed_false", "unknown"] as const;
export type FactReviewStatus = (typeof FACT_REVIEW_STATUSES)[number];

export type FactClaimRow = {
  observationId: string;
  provider: string;
  questionText: string;
  claim: string;
  reason: string;
  index: number;
  status: FactReviewStatus | null;
  note: string | null;
};

type StoredReview = Record<string, { status: FactReviewStatus; note: string | null }>;

function parseAnalysis(json: string | null): AnalyzerResult | null {
  if (!json) return null;
  try {
    return JSON.parse(json) as AnalyzerResult;
  } catch {
    return null;
  }
}

function parseStored(json: string | null): StoredReview {
  if (!json) return {};
  try {
    return JSON.parse(json) as StoredReview;
  } catch {
    return {};
  }
}

export function listUnsupportedClaimsFromAnalysis(
  analysisJson: string | null,
  storedJson: string | null,
): Array<{ claim: string; reason: string; status: FactReviewStatus | null; note: string | null; index: number }> {
  const analysis = parseAnalysis(analysisJson);
  const stored = parseStored(storedJson);
  const claims = analysis?.unsupportedClaims ?? [];
  return claims.map((c, index) => ({
    claim: c.claim,
    reason: c.reason,
    index,
    status: stored[String(index)]?.status ?? null,
    note: stored[String(index)]?.note ?? null,
  }));
}

export async function loadFactReviewRows(scanJobId: string): Promise<FactClaimRow[]> {
  const observations = await prisma.observation.findMany({
    where: { scanJobId, analysisJson: { not: null } },
    include: { question: { select: { text: true } } },
    orderBy: { createdAt: "asc" },
  });

  const rows: FactClaimRow[] = [];
  for (const obs of observations) {
    const claims = listUnsupportedClaimsFromAnalysis(obs.analysisJson, obs.factReviewJson);
    for (const c of claims) {
      rows.push({
        observationId: obs.id,
        provider: obs.provider,
        questionText: obs.question.text,
        claim: c.claim,
        reason: c.reason,
        index: c.index,
        status: c.status,
        note: c.note,
      });
    }
  }
  return rows;
}

export function summarizeFactReviews(rows: FactClaimRow[]) {
  return {
    total: rows.length,
    confirmedTrue: rows.filter((r) => r.status === "confirmed_true").length,
    confirmedFalse: rows.filter((r) => r.status === "confirmed_false").length,
    unknown: rows.filter((r) => r.status === "unknown").length,
    pending: rows.filter((r) => r.status == null).length,
  };
}

export async function saveObservationFactReviews(params: {
  observationId: string;
  reviews: Array<{ index: number; status: FactReviewStatus; note?: string | null }>;
}) {
  const observation = await prisma.observation.findUnique({
    where: { id: params.observationId },
    select: { id: true, analysisJson: true, factReviewJson: true },
  });
  if (!observation) throw new Error("Observation 不存在");

  const previousAnalysis = observation.analysisJson;
  const stored = parseStored(observation.factReviewJson);
  for (const review of params.reviews) {
    stored[String(review.index)] = {
      status: review.status,
      note: review.note?.trim() ? review.note.trim() : null,
    };
  }

  const statuses = Object.values(stored).map((s) => s.status);
  const unique = [...new Set(statuses)];
  const factReviewStatus = unique.length === 1 ? unique[0] : unique.length ? "mixed" : null;

  const updated = await prisma.observation.update({
    where: { id: observation.id },
    data: {
      factReviewJson: JSON.stringify(stored),
      factReviewStatus,
      factReviewNote: params.reviews.map((r) => r.note).filter(Boolean).join("\n") || null,
    },
    select: { analysisJson: true },
  });

  if (updated.analysisJson !== previousAnalysis) {
    throw new Error("Fact Review 不得改写原始 Analysis");
  }

  return { analysisJson: updated.analysisJson, unchanged: true };
}

export async function applyFactReviewRiskCopy(scanJobId: string) {
  const rows = await loadFactReviewRows(scanJobId);
  const summary = summarizeFactReviews(rows);
  const finding =
    summary.confirmedFalse > 0
      ? "AI存在错误品牌信息。经人工核实，部分模型给出的具体事实与品牌真实情况不符。"
      : "AI生成了品牌方当前资料中未提供的具体信息，建议核实其真实性与公开来源。";

  const diagnosis = await prisma.diagnosis.findFirst({
    where: { scanJobId, code: "HALLUCINATION_RISK" },
  });
  if (!diagnosis) return { updated: false, finding };

  await prisma.diagnosis.update({
    where: { id: diagnosis.id },
    data: { finding },
  });
  return { updated: true, finding };
}
