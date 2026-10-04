import { NextResponse } from "next/server";
import { processScanBatch } from "@/server/scans/runner";
import { SCAN_BATCH_SIZE, SCAN_CONCURRENCY } from "@/server/scans/types";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  try {
    const result = await processScanBatch(id);
    return NextResponse.json({
      ...result,
      batchSize: SCAN_BATCH_SIZE,
      concurrency: SCAN_CONCURRENCY,
    });
  } catch (err) {
    console.error("[scan-process]", err);
    return NextResponse.json({ error: "处理扫描批次失败" }, { status: 500 });
  }
}
