import { NextResponse } from "next/server";
import { generateScanReport } from "@/server/report/engine";

export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ scanJobId: string }> },
) {
  const { scanJobId } = await ctx.params;
  try {
    const report = await generateScanReport(scanJobId);
    return NextResponse.json({
      ok: true,
      diagnoses: report.diagnoses.length,
      prescriptions: report.prescriptions.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "生成失败";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
