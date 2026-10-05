import { formatKnownCosts, loadUsageOverview } from "@/server/admin/usage";
import { DEEPSEEK_FLASH_PEAK, QWEN_FLASH, getPricingEntry } from "@/ai/pricing/pricing-config";

export const dynamic = "force-dynamic";

export default async function AdminUsagePage() {
  const usage = await loadUsageOverview();
  const hy = getPricingEntry("tencent-hy", "hy3");
  const overall = formatKnownCosts(usage.overall);

  return (
    <div>
      <h1 className="text-2xl font-semibold">API Usage</h1>
      <p className="mt-2 text-sm text-slate-600">
        Total Requests {usage.overall.requests} · Prompt Tokens {usage.overall.promptTokens} ·
        Completion Tokens {usage.overall.completionTokens} · Total Tokens {usage.overall.totalTokens}
      </p>
      <p className="mt-1 text-xs text-slate-500">
        Scan Request 只统计挂在 ScanJob 上的成功模型调用（一次成功 Observation 记 1 次）。失败重试不记账；单元测试残留不计入。
      </p>
      <p className="mt-1 text-sm text-slate-600">
        Known CNY {overall.knownCny ?? "—"} · Known USD {overall.knownUsd ?? "—"}
        {overall.unknownPricedUsage ? " · Unknown-priced Usage" : ""}
      </p>
      {usage.historyIncomplete ? (
        <p className="mt-3 text-sm text-amber-800">Analysis部分历史调用未完整计入。</p>
      ) : null}
      {usage.unattached > 0 ? (
        <p className="mt-3 text-sm text-slate-500">
          未归属记录 {usage.unattached} 条，已从业务统计中排除。
        </p>
      ) : null}
      {hy?.inputPer1M == null ? (
        <p className="mt-2 text-sm text-slate-500">Tencent Hy3：Pricing not configured.</p>
      ) : null}
      <p className="mt-2 text-xs text-slate-500">
        DeepSeek {DEEPSEEK_FLASH_PEAK.pricingVersion} · Estimated using peak pricing. Qwen{" "}
        {QWEN_FLASH.pricingVersion}. 多币种不换算、不相加。
      </p>

      <h2 className="mt-8 text-lg font-semibold">按 Provider</h2>
      <table className="mt-3 w-full text-sm">
        <thead>
          <tr className="border-b text-left text-slate-500">
            <th className="py-2">Provider</th>
            <th>Requests</th>
            <th>Input Tokens</th>
            <th>Output Tokens</th>
            <th>Cost</th>
          </tr>
        </thead>
        <tbody>
          {["deepseek", "tencent-hy", "qwen"].map((id) => {
            const row = usage.byProvider[id] ?? {
              requests: 0,
              promptTokens: 0,
              completionTokens: 0,
              totalTokens: 0,
              cny: null,
              usd: null,
              unknownRequests: 0,
              unknownTokens: 0,
            };
            const cost = formatKnownCosts(row);
            return (
              <tr key={id} className="border-b border-slate-100">
                <td className="py-2">{id}</td>
                <td>{row.requests}</td>
                <td>{row.promptTokens}</td>
                <td>{row.completionTokens}</td>
                <td>
                  {[cost.knownCny, cost.knownUsd].filter(Boolean).join(" / ") || "—"}
                  {cost.unknownPricedUsage ? " + unknown" : ""}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <h2 className="mt-8 text-lg font-semibold">按 Purpose</h2>
      <table className="mt-3 w-full text-sm">
        <thead>
          <tr className="border-b text-left text-slate-500">
            <th className="py-2">Purpose</th>
            <th>Requests</th>
            <th>Tokens</th>
          </tr>
        </thead>
        <tbody>
          {["scan", "analysis", "profile", "diagnosis", "prescription"].map((purpose) => {
            const row = usage.byPurpose[purpose];
            return (
              <tr key={purpose} className="border-b border-slate-100">
                <td className="py-2">{purpose === "analysis" ? "Analyzer" : purpose}</td>
                <td>{row?.requests ?? 0}</td>
                <td>{row?.totalTokens ?? 0}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="mt-3 text-xs text-slate-500">
        Profile 由程序生成；无模型调用时请求数为 0。connection_test 不计入业务成本。
      </p>
    </div>
  );
}
