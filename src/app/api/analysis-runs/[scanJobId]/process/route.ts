import { NextResponse } from "next/server";
import { processAnalysisBatch } from "@/server/analysis/runner";
import { ANALYSIS_PROCESS_LIMIT } from "@/server/analysis/types";

export async function POST(
  _request: Request,
  context: { params: Promise<{ scanJobId: string }> },
) {
  const { scanJobId } = await context.params;
  try {
    const result = await processAnalysisBatch(scanJobId);
    return NextResponse.json({ ...result, batchLimit: ANALYSIS_PROCESS_LIMIT });
  } catch (err) {
    console.error("[analysis-process]", err);
    return NextResponse.json({ error: "分析批次失败" }, { status: 500 });
  }
}
