import { NextResponse } from "next/server";
import { createScanJobForBrand } from "@/server/scans/actions";

export async function POST(request: Request) {
  let body: { brandId?: string };
  try {
    body = (await request.json()) as { brandId?: string };
  } catch {
    return NextResponse.json({ error: "无效请求" }, { status: 400 });
  }

  if (!body.brandId) {
    return NextResponse.json({ error: "缺少 brandId" }, { status: 400 });
  }

  const result = await createScanJobForBrand(body.brandId);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, missingProviders: result.missingProviders },
      { status: 400 },
    );
  }

  return NextResponse.json({
    scanJobId: result.scanJobId,
    created: result.created,
  });
}
