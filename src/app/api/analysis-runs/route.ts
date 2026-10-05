import { NextResponse } from "next/server";
import { startAnalysisRun } from "@/server/analysis/runner";

export async function POST(request: Request) {
  let body: { scanJobId?: string };
  try {
    body = (await request.json()) as { scanJobId?: string };
  } catch {
    return NextResponse.json({ error: "无效请求" }, { status: 400 });
  }
  if (!body.scanJobId) {
    return NextResponse.json({ error: "缺少 scanJobId" }, { status: 400 });
  }
  const result = await startAnalysisRun(body.scanJobId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json(result);
}
