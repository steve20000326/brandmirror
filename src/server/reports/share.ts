import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { loadClientReport } from "./queries";

export function createShareToken(): string {
  return randomBytes(16).toString("hex");
}

export async function getOrCreateReportShare(scanJobId: string) {
  const existing = await prisma.reportShare.findUnique({ where: { scanJobId } });
  if (existing) return existing;
  return prisma.reportShare.create({
    data: {
      scanJobId,
      shareToken: createShareToken(),
      enabled: true,
    },
  });
}

export async function setReportShareEnabled(scanJobId: string, enabled: boolean) {
  const share = await getOrCreateReportShare(scanJobId);
  return prisma.reportShare.update({
    where: { id: share.id },
    data: { enabled },
  });
}

export async function loadPublicReport(shareToken: string) {
  const share = await prisma.reportShare.findUnique({ where: { shareToken } });
  if (!share || !share.enabled) {
    return { ok: false as const, reason: "disabled" as const };
  }
  const loaded = await loadClientReport(share.scanJobId);
  if (!loaded?.view || loaded.status !== "ready") {
    return { ok: false as const, reason: "incomplete" as const };
  }
  return { ok: true as const, view: loaded.view, scanJobId: share.scanJobId };
}
