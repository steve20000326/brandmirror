import { prisma } from "@/lib/prisma";
import { roundMoney } from "@/ai/pricing/calculator";

const BUSINESS_PURPOSES = new Set(["scan", "analysis", "profile", "diagnosis", "prescription"]);

export type UsageRow = {
  requests: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cny: number | null;
  usd: number | null;
  unknownRequests: number;
  unknownTokens: number;
};

function emptyRow(): UsageRow {
  return {
    requests: 0,
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
    cny: null,
    usd: null,
    unknownRequests: 0,
    unknownTokens: 0,
  };
}

function addRow(target: UsageRow, row: {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  totalCost: number | null;
  currency: string | null;
}) {
  target.requests += 1;
  target.promptTokens += row.promptTokens;
  target.completionTokens += row.completionTokens;
  target.totalTokens += row.totalTokens;
  if (row.totalCost == null || !row.currency) {
    target.unknownRequests += 1;
    target.unknownTokens += row.totalTokens;
    return;
  }
  if (row.currency === "CNY") {
    target.cny = (target.cny ?? 0) + row.totalCost;
  } else if (row.currency === "USD") {
    target.usd = (target.usd ?? 0) + row.totalCost;
  } else {
    target.unknownRequests += 1;
    target.unknownTokens += row.totalTokens;
  }
}

function normalizePurpose(purpose: string | null): string {
  return purpose || "scan";
}

export function aggregateUsage(rows: Array<{
  provider: string;
  purpose: string | null;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  totalCost: number | null;
  currency: string | null;
  scanJobId?: string | null;
}>) {
  const overall = emptyRow();
  const byProvider: Record<string, UsageRow> = {};
  const byPurpose: Record<string, UsageRow> = {};
  const highTokenProviders = new Set<string>();
  let unattached = 0;

  for (const row of rows) {
    const purpose = normalizePurpose(row.purpose);
    if (purpose === "connection_test") continue;
    if (!row.scanJobId) {
      unattached += 1;
      continue;
    }
    addRow(overall, row);
    const p = (byProvider[row.provider] ??= emptyRow());
    addRow(p, row);
    const u = (byPurpose[purpose] ??= emptyRow());
    addRow(u, row);
  }

  return {
    overall,
    byProvider,
    byPurpose,
    highTokenProviders,
    unattached,
    historyIncomplete: rows.some((r) => r.scanJobId && !r.purpose),
  };
}

export function formatKnownCosts(row: UsageRow): {
  knownCny: string | null;
  knownUsd: string | null;
  unknownPricedUsage: boolean;
} {
  return {
    knownCny: row.cny == null ? null : `¥${roundMoney(row.cny, 4)}`,
    knownUsd: row.usd == null ? null : `$${roundMoney(row.usd, 4)}`,
    unknownPricedUsage: row.unknownRequests > 0,
  };
}

export async function loadUsageOverview(scanJobId?: string) {
  const rows = await prisma.modelUsage.findMany({
    where: scanJobId ? { scanJobId } : undefined,
  });
  const mapped = rows.map((r) => ({
    provider: r.provider,
    purpose: r.purpose,
    promptTokens: r.promptTokens,
    completionTokens: r.completionTokens,
    totalTokens: r.totalTokens,
    totalCost: r.totalCost,
    currency: r.currency,
    scanJobId: r.scanJobId,
  }));
  const agg = aggregateUsage(mapped);

  if (scanJobId) {
    const byProvTokens: Record<string, number> = {};
    for (const r of mapped) {
      if (normalizePurpose(r.purpose) === "connection_test") continue;
      byProvTokens[r.provider] = (byProvTokens[r.provider] ?? 0) + r.completionTokens;
    }
    for (const [provider, tokens] of Object.entries(byProvTokens)) {
      if (tokens > 50_000) agg.highTokenProviders.add(provider);
    }
  }

  return agg;
}

export { BUSINESS_PURPOSES };
