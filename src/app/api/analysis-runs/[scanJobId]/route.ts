import { NextResponse } from "next/server";
import { getAnalysisProgress } from "@/server/analysis/queries";

export async function GET(
  _request: Request,
  context: { params: Promise<{ scanJobId: string }> },
) {
  const { scanJobId } = await context.params;
  const progress = await getAnalysisProgress(scanJobId);
  if (!progress) {
    return NextResponse.json({ error: "任务不存在" }, { status: 404 });
  }
  return NextResponse.json(progress);
}
