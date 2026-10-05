import { NextResponse } from "next/server";
import { getReportStatus } from "@/server/reports/builder";
import { prisma } from "@/lib/prisma";
import { getOrCreateReportShare, setReportShareEnabled } from "@/server/reports/share";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ scanJobId: string }> },
) {
  const { scanJobId } = await ctx.params;
  const body = (await req.json()) as { enabled?: boolean };
  const job = await prisma.scanJob.findUnique({ where: { id: scanJobId } });
  if (!job) return NextResponse.json({ ok: false, error: "not found" }, { status: 404 });

  const [profile, dCount, pCount] = await Promise.all([
    prisma.brandProfile.findFirst({ where: { scanJobId } }),
    prisma.diagnosis.count({ where: { scanJobId } }),
    prisma.prescription.count({ where: { scanJobId } }),
  ]);
  const status = getReportStatus({
    portraitJson: profile?.portraitJson ?? null,
    diagnosisCount: dCount,
    prescriptionCount: pCount,
    analysisStatus: job.analysisStatus,
  });
  if (status !== "ready") {
    return NextResponse.json({ ok: false, error: "incomplete" }, { status: 400 });
  }

  if (body.enabled === false) {
    const share = await setReportShareEnabled(scanJobId, false);
    return NextResponse.json({ ok: true, enabled: share.enabled });
  }
  const share = await getOrCreateReportShare(scanJobId);
  const enabled = await setReportShareEnabled(scanJobId, true);
  return NextResponse.json({
    ok: true,
    enabled: enabled.enabled,
    path: `/r/${share.shareToken}`,
  });
}
