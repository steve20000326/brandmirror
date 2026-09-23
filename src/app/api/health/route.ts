import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Lightweight connectivity check
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      status: "ok",
      database: "connected",
      app: env.appName,
    });
  } catch (err) {
    console.error("[health]", err);
    return NextResponse.json(
      {
        status: "error",
        database: "disconnected",
        app: env.appName,
      },
      { status: 503 },
    );
  }
}
