import { NO_STABLE_COGNITION, type BrandPortrait, type EvidenceItem } from "@/ai/profile/types";
import { hallucinationLabel, type GeoMetrics } from "@/server/analysis/metrics";
import { PROVIDER_LABELS } from "@/server/scans/types";

type DiagnosisRow = {
  code: string;
  severity: string;
  title: string;
  finding: string | null;
  evidenceJson: string | null;
  businessMeaning: string | null;
};

type PrescriptionRow = {
  priority: number;
  title: string;
  evidence: string | null;
  diagnosis: string | null;
  action: string | null;
  category: string | null;
};

function Chip({ children }: { children: string }) {
  return (
    <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-800">{children}</span>
  );
}

function EvidenceLine({ item }: { item: EvidenceItem }) {
  return (
    <p className="text-sm text-slate-700">
      {item.label}
      <span className="text-slate-500">
        {" "}
        · evidenceCount={item.evidenceCount} · {item.providers.join(", ")}
      </span>
    </p>
  );
}

export function ReportDocument({
  brand,
  testedAt,
  metrics,
  portrait,
  diagnoses,
  prescriptions,
  calibration,
}: {
  brand: {
    name: string;
    targetAudience: string | null;
    priceTier: string | null;
    desiredPositioning: string | null;
    desiredKeywords: string | null;
    coreProducts: string | null;
  };
  testedAt: string;
  metrics: GeoMetrics;
  portrait: BrandPortrait | null;
  diagnoses: DiagnosisRow[];
  prescriptions: PrescriptionRow[];
  calibration: boolean;
}) {
  const empty = portrait && !portrait.hasStableCognition;

  return (
    <div className="space-y-10">
      {calibration ? (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Calibration Brand · 虚构测试品牌。本报告用于检测方法，不能当作真实 GEO 案例对外传播。
        </div>
      ) : null}

      <section>
        <p className="text-sm text-slate-500">Tested at {testedAt}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
          AI眼中的「{brand.name}」
        </h1>
        <p className="mt-2 text-slate-600">
          基于30个真实消费问题 × 3个AI模型的品牌认知测试
        </p>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-800">
          {portrait?.executiveSummary ?? "报告尚未生成。"}
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">核心指标</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ScoreCard label="AI Brand Score" value={metrics.aiBrandScore} hint="不含幻觉风险" />
          <ScoreCard label="Awareness" value={metrics.awareness} hint="品牌相关提问" />
          <ScoreCard label="Recommendation" value={metrics.recommendation} hint="无品牌提问" />
          <ScoreCard label="Discovery" value={metrics.discovery} hint="无品牌提问" />
          <ScoreCard label="Alignment" value={metrics.alignment} hint="对照品牌资料" />
          <ScoreCard label="Competitor Score" value={metrics.competitor} hint="相对竞品分点" />
        </div>
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">AI认知风险（不计入总分）</p>
          <p className="mt-1 text-2xl font-semibold">
            {metrics.hallucinationRisk.toFixed(1)} · {hallucinationLabel(metrics.hallucinationRisk)}
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold">AI认为你是一个什么品牌？</h2>
        {empty ? (
          <p className="mt-3 rounded-xl border border-slate-200 bg-white p-5 text-slate-700">
            当前主流AI尚未形成稳定品牌认知。下面各项均不使用品牌自己提交的资料来填空。
          </p>
        ) : null}
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Fact label="人群" value={portrait?.audience.summary} extra={portrait?.audience} />
          <Fact label="价格" value={portrait?.priceTier.summary} extra={portrait?.priceTier} />
          <Fact
            label="风格"
            value={
              portrait?.style.primary.length
                ? portrait.style.primary.map((s) => s.label).join("、")
                : NO_STABLE_COGNITION
            }
          />
          <Fact
            label="场景"
            value={
              portrait?.scenarios.strong.length
                ? portrait.scenarios.strong.map((s) => s.label).join("、")
                : NO_STABLE_COGNITION
            }
          />
          <Fact
            label="品类"
            value={
              portrait?.productAssociations.length
                ? portrait.productAssociations.map((s) => s.label).join("、")
                : NO_STABLE_COGNITION
            }
          />
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-500">AI通常把你和谁放在一起比较</p>
            <div className="mt-2 space-y-1">
              {portrait?.competitorAssociations.length ? (
                portrait.competitorAssociations.map((c) => <EvidenceLine key={c.label} item={c} />)
              ) : (
                <p className="text-sm text-slate-800">{NO_STABLE_COGNITION}</p>
              )}
            </div>
          </div>
        </div>
        <div className="mt-4">
          <h3 className="text-sm font-medium text-slate-800">AI最容易在哪些场景想到你</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {(portrait?.scenarios.strong.length ? portrait.scenarios.strong : []).map((s) => (
              <Chip key={s.label}>{`${s.label} (${s.evidenceCount})`}</Chip>
            ))}
            {!portrait?.scenarios.strong.length ? <p className="text-sm text-slate-500">{NO_STABLE_COGNITION}</p> : null}
          </div>
          <h3 className="mt-4 text-sm font-medium text-slate-800">AI很少在哪些场景想到你</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {(portrait?.scenarios.weak.length ? portrait.scenarios.weak : []).map((s) => (
              <Chip key={s.label}>{s.label}</Chip>
            ))}
            {!portrait?.scenarios.weak.length ? <p className="text-sm text-slate-500">{NO_STABLE_COGNITION}</p> : null}
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold">品牌希望成为的样子 VS AI实际理解的样子</h2>
        <p className="mt-2 text-sm text-slate-500">只列出品牌已提交的期望；AI 侧无证据时如实写「暂无稳定认知」，不把品牌资料当成 AI 观点。</p>
        <table className="mt-4 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="py-2 pr-3">维度</th>
              <th className="py-2 pr-3">品牌希望</th>
              <th className="py-2">AI实际</th>
            </tr>
          </thead>
          <tbody>
            <CmpRow dim="人群" want={brand.targetAudience} got={portrait?.audience.summary} />
            <CmpRow dim="价格" want={brand.priceTier} got={portrait?.priceTier.summary} />
            <CmpRow
              dim="定位/风格"
              want={brand.desiredPositioning}
              got={portrait?.style.primary[0]?.label ?? NO_STABLE_COGNITION}
            />
            <CmpRow dim="关键词" want={brand.desiredKeywords} got={NO_STABLE_COGNITION} />
            <CmpRow dim="产品" want={brand.coreProducts} got={portrait?.productAssociations[0]?.label} />
          </tbody>
        </table>
      </section>

      <section>
        <h2 className="text-xl font-semibold">BrandMirror发现的主要问题</h2>
        <ol className="mt-4 space-y-4">
          {diagnoses.slice(0, 5).map((d, i) => {
            const evidence = d.evidenceJson ? (JSON.parse(d.evidenceJson) as string[]) : [];
            return (
              <li key={d.code} className="rounded-xl border border-slate-200 bg-white p-5">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  P{i + 1} · {d.code} · {d.severity}
                </p>
                <p className="mt-1 font-medium text-slate-900">{d.title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-700">{d.finding}</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
                  {evidence.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
                {d.businessMeaning ? (
                  <p className="mt-2 text-sm text-slate-700">{d.businessMeaning}</p>
                ) : null}
              </li>
            );
          })}
        </ol>
      </section>

      <section>
        <h2 className="text-xl font-semibold">现在最值得做的事情</h2>
        <div className="mt-4 space-y-4">
          {prescriptions.map((p) => (
            <details key={p.priority} open={p.priority <= 3} className="rounded-xl border border-slate-200 bg-white p-5">
              <summary className="cursor-pointer font-medium text-slate-900">
                P{p.priority} {p.title}
              </summary>
              <dl className="mt-3 space-y-2 text-sm leading-6">
                <div>
                  <dt className="text-slate-500">Evidence</dt>
                  <dd className="text-slate-800">{p.evidence}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Diagnosis</dt>
                  <dd className="text-slate-800">{p.diagnosis}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Action</dt>
                  <dd className="text-slate-800">{p.action}</dd>
                </div>
              </dl>
            </details>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold">模型差异</h2>
        <p className="mt-1 text-sm text-slate-500">哪个 AI 最了解我？</p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {(["deepseek", "tencent-hy", "qwen"] as const).map((id) => {
            const row = metrics.byProvider[id];
            return (
              <div key={id} className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="font-medium">{PROVIDER_LABELS[id]}</p>
                <p className="mt-2 text-sm">认知度 {row?.awareness ?? 0}</p>
                <p className="text-sm">发现率 {row?.discovery ?? 0}</p>
                <p className="text-sm">推荐率 {row?.recommendation ?? 0}</p>
                <p className="text-sm">幻觉风险 {row?.hallucinationRisk ?? 0}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm leading-6 text-slate-600">
        <h2 className="text-base font-semibold text-slate-900">测试方法</h2>
        <p className="mt-2">30个消费者问题 · 3个模型 · 18个无品牌问题 · 12个品牌相关问题</p>
        <p>联网搜索关闭 · 模型API基线（Model API baseline）</p>
        <p>结果不等同于消费者 AI App（ChatGPT / 豆包等）的最终呈现。</p>
      </section>
    </div>
  );
}

function ScoreCard({ label, value, hint }: { label: string; value: number; hint: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value.toFixed(1)}</p>
      <p className="mt-1 text-xs text-slate-500">{hint}</p>
    </div>
  );
}

function Fact({
  label,
  value,
  extra,
}: {
  label: string;
  value?: string | null;
  extra?: { evidenceCount: number; providers: string[] };
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-900">{value || NO_STABLE_COGNITION}</p>
      {extra && extra.evidenceCount > 0 ? (
        <p className="mt-1 text-xs text-slate-500">
          evidenceCount={extra.evidenceCount} · {extra.providers.length} 个模型
          {extra.providers.length ? `（${extra.providers.join(", ")}）` : ""}
        </p>
      ) : null}
    </div>
  );
}

function CmpRow({ dim, want, got }: { dim: string; want?: string | null; got?: string | null }) {
  if (!want?.trim()) return null;
  return (
    <tr className="border-b border-slate-100">
      <td className="py-2 pr-3 text-slate-500">{dim}</td>
      <td className="py-2 pr-3 text-slate-800">{want}</td>
      <td className="py-2 text-slate-800">{got || NO_STABLE_COGNITION}</td>
    </tr>
  );
}
