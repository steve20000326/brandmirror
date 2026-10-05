import { formatKnownCosts } from "@/server/admin/usage";
import { loadAdminOverview } from "@/server/admin/overview";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const data = await loadAdminOverview();
  const costs = formatKnownCosts(data.usage.overall);
  return (
    <div>
      <h1 className="text-2xl font-semibold">Overview</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card label="品牌数量" value={String(data.brandTotal)} hint={`真实客户品牌 ${data.realBrands}（已排除校准品牌）`} />
        <Card label="Scan 数量" value={String(data.scanTotal)} />
        <Card label="成功扫描" value={String(data.scanOk)} />
        <Card label="总 Observation" value={String(data.observations)} />
        <Card label="累计 Token" value={String(data.usage.overall.totalTokens)} />
        <Card
          label="累计估算 API 成本"
          value={[costs.knownCny, costs.knownUsd].filter(Boolean).join(" / ") || "—"}
          hint={
            costs.unknownPricedUsage
              ? "部分成本待配置 · Known Cost + Unknown-priced Usage"
              : data.usage.byProvider["deepseek"]
                ? "Estimated using peak pricing（DeepSeek）"
                : undefined
          }
        />
      </div>
      {data.usage.historyIncomplete ? (
        <p className="mt-6 text-sm text-slate-600">Analysis部分历史调用未完整计入。</p>
      ) : null}
      {data.usage.unattached > 0 ? (
        <p className="mt-2 text-sm text-slate-500">
          另有 {data.usage.unattached} 条未归属扫描任务的记录（通常来自已删除的测试任务），未计入上表。
        </p>
      ) : null}
    </div>
  );
}

function Card({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
      {hint ? <p className="mt-2 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}
