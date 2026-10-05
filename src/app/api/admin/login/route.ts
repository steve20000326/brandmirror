import { NextResponse } from "next/server";
import {
  adminCookieHeader,
  adminPasswordConfigured,
  signAdminSession,
  verifyAdminPassword,
} from "@/server/admin/auth";

export async function POST(request: Request) {
  if (!adminPasswordConfigured()) {
    return NextResponse.json({ error: "unconfigured" }, { status: 503 });
  }
  const body = (await request.json()) as { password?: string };
  if (!verifyAdminPassword(body.password ?? "")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.headers.set("Set-Cookie", adminCookieHeader(await signAdminSession()));
  return res;
}
