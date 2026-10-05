import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import type { ProviderId } from "@/ai/providers/types";
import { PROVIDER_LABELS } from "@/server/scans/types";
import { hallucinationLabel } from "@/server/analysis/metrics";
import { getBrandById } from "@/server/brands/queries";
import { getScanJobById } from "@/server/scans/queries";
import { getBrandProfileForScan } from "@/server/analysis/queries";
import type { GeoMetrics, ProviderMetrics } from "@/server/analysis/metrics";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string; scanJobId: string }>;
};

const PROVIDERS: ProviderId[] = ["deepseek", "tencent-hy", "qwen"];

function MetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: number | null | undefined;
  hint: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight">
        {value == null ? "—" : value.toFixed(1)}
      </p>
      <p className="mt-2 text-xs leading-5 text-slate-500">{hint}</p>
    </div>
  );
}

export default async function AnalysisResultPage({ params }: PageProps) {
  const { id, scanJobId } = await params;
  const brand = await getBrandById(id);
  if (!brand) notFound();
  const job = await getScanJobById(scanJobId);
  if (!job || job.brandId !== brand.id) notFound();

  const profile = await getBrandProfileForScan(scanJobId);
  const metrics = profile?.profileJson
    ? (JSON.parse(profile.profileJson) as GeoMetrics)
    : null;
  const byProvider = (profile?.providerMetricsJson
    ? (JSON.parse(profile.providerMetricsJson) as Record<string, ProviderMetrics>)
    : metrics?.byProvider) ?? {};

  return (
    <div>
      <div className="mb-2">
        <Link
          href={`/brands/${brand.id}/scans/${scanJobId}`}
          className="text-sm text-slate-500 hover:text-slate-800"
        >
          ← 返回扫描结果
        </Link>
      </div>
      <PageHeader
        title="BrandMirror AI品牌体检"
        description={`${brand.name} · 模型基线扫描分析 · 不等于消费者 App 结果`}
        action={{
          href: `/brands/${brand.id}/reports/${scanJobId}`,
          label: "打开完整报告",
        }}
      />

      <div className="mb-8 rounded-xl border border-slate-900 bg-slate-900 px-6 py-6 text-white">
        <p className="text-sm text-slate-300">AI Brand Score</p>
        <p className="mt-1 text-4xl font-semibold tracking-tight">
          {profile?.aiBrandScore == null ? "—" : profile.aiBrandScore.toFixed(1)} / 100
        </p>
        <p className="mt-2 text-sm text-slate-400">
          由五项程序指标加权计算，不是让模型直接打分。
        </p>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          label="AI认知度"
          value={profile?.awarenessScore}
          hint="在直接询问品牌时，AI是否表现出有依据的品牌认知。"
        />
        <MetricCard
          label="AI推荐率"
          value={profile?.recommendationScore}
          hint="消费者未主动提品牌时，AI仍将其作为可选项的程度。"
        />
        <MetricCard
          label="品类发现率"
          value={profile?.discoveryScore}
          hint="在消费者没有主动提及品牌的情况下，AI有多少比例会自然想到该品牌。"
        />
        <MetricCard
          label="AI认知匹配度"
          value={profile?.accuracyScore}
          hint="AI描述与品牌方资料（及期望定位）的覆盖与一致程度。"
        />
        <MetricCard
          label="竞品竞争力"
          value={profile?.competitorScore}
          hint="无品牌题中，客户品牌相对指定竞品的被提及/排序积分。"
        />
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">AI认知风险</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight">
            {profile?.hallucinationRiskScore == null
              ? "—"
              : profile.hallucinationRiskScore.toFixed(1)}
            <span className="ml-2 text-sm font-normal text-slate-500">
              {profile?.hallucinationRiskScore == null
                ? ""
                : hallucinationLabel(profile.hallucinationRiskScore)}
            </span>
          </p>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            BrandMirror内部诊断指标。不计入 AI Brand Score。
          </p>
        </div>
      </div>

      <section className="mb-10 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-900">三模型对比</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-2 font-medium">指标</th>
                {PROVIDERS.map((p) => (
                  <th key={p} className="px-4 py-2 font-medium">
                    {PROVIDER_LABELS[p]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(
                [
                  ["品类发现", "discovery"],
                  ["推荐表现", "recommendation"],
                  ["认知度", "awareness"],
                  ["认知匹配", "alignment"],
                  ["幻觉风险", "hallucinationRisk"],
                ] as const
              ).map(([label, key]) => (
                <tr key={key} className="border-t border-slate-100">
                  <td className="px-4 py-2 text-slate-700">{label}</td>
                  {PROVIDERS.map((p) => (
                    <td key={p} className="px-4 py-2">
                      {byProvider[p]?.[key] == null
                        ? "—"
                        : byProvider[p][key].toFixed(1)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
