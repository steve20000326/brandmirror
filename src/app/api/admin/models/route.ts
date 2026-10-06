import { NextResponse } from "next/server";
import { listScanProviders } from "@/ai/providers";
import { recordModelUsage } from "@/ai/usage/recorder";
import { PROVIDER_LABELS, PROVIDER_MODEL_LABELS } from "@/server/scans/types";
import type { ProviderId } from "@/ai/providers/types";

export async function GET() {
  const providers = listScanProviders().map((p) => ({
    provider: p.provider,
    label: PROVIDER_LABELS[p.provider],
    model: p.model,
    modelLabel: PROVIDER_MODEL_LABELS[p.provider],
    configured: p.isConfigured(),
  }));

  return NextResponse.json({ providers });
}

export async function POST(request: Request) {
  let body: { provider?: ProviderId };
  try {
    body = (await request.json()) as { provider?: ProviderId };
  } catch {
    return NextResponse.json({ error: "无效请求" }, { status: 400 });
  }

  const target = listScanProviders().find((p) => p.provider === body.provider);
  if (!target) {
    return NextResponse.json({ error: "未知 Provider" }, { status: 400 });
  }
  if (!target.isConfigured()) {
    return NextResponse.json({
      ok: false,
      latencyMs: 0,
      error: "Not Configured",
    });
  }

  const result = await target.testConnection();
  if (result.ok) {
    await recordModelUsage({
      provider: target.provider,
      model: target.model,
      purpose: "connection_test",
      usageEventType: "api_call",
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
    });
  }
  return NextResponse.json({
    ok: result.ok,
    latencyMs: result.latencyMs,
    error: result.ok ? undefined : result.error ?? "Connection Failed",
  });
}
