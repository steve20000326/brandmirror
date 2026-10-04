import { NextResponse } from "next/server";
import { getScanProgress } from "@/server/scans/queries";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const progress = await getScanProgress(id);
  if (!progress) {
    return NextResponse.json({ error: "扫描任务不存在" }, { status: 404 });
  }
  return NextResponse.json(progress);
}
