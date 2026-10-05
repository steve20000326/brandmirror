import type { ClientReportViewModel } from "@/server/reports/types";

export function ClientReport({
  view,
  publicView = false,
}: {
  view: ClientReportViewModel;
  publicView?: boolean;
}) {
  return (
    <article className="report-doc space-y-16 text-slate-900">
      <section className="report-cover">
        <p className="text-sm tracking-wide text-slate-500">BrandMirror</p>
        <p className="text-sm text-slate-500">AI品牌镜</p>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl">
          AI眼中的「{view.brand.name}」
        </h1>
        <p className="mt-2 text-lg text-slate-600">AI品牌认知与GEO诊断报告</p>
        <dl className="mt-6 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
          <div>行业：{view.brand.industry}</div>
          <div>测试日期：{view.reportMeta.testedAt}</div>
          <div>模型：{view.reportMeta.modelCount}</div>
          <div>测试问题：{view.reportMeta.questionCount}</div>
          <div>AI观察：{view.reportMeta.observationCount}</div>
        </dl>
        {view.brand.isCalibration ? (
          <p className="mt-4 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-950">
            Calibration Brand · 虚构校准品牌
          </p>
        ) : null}
      </section>

      <section>
        <h2 className="text-2xl font-semibold">先说结论</h2>
        <p className="mt-4 max-w-3xl text-lg leading-8">{view.executiveSummary}</p>
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs text-slate-500">{view.stage.disclaimer}</p>
          <p className="mt-1 text-xl font-semibold">
            Stage {view.stage.id} · {view.stage.title}
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold">AI品牌成绩单</h2>
        <div className="mt-4 rounded-xl border border-slate-900 bg-slate-900 p-6 text-white">
          <p className="text-sm text-slate-300">AI Brand Score</p>
          <p className="mt-1 text-4xl font-semibold">{view.scores.aiBrandScore.toFixed(1)}</p>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {view.scores.items.map((item) => (
            <div key={item.key} className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-sm text-slate-500">{item.label}</p>
              <p className="mt-1 text-2xl font-semibold">{item.value.toFixed(1)}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.explanation}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="text-lg font-semibold">{view.risk.label}</h3>
          <p className="mt-1 text-2xl font-semibold">{view.risk.value.toFixed(1)}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">{view.risk.explanation}</p>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold">AI现在怎样认识你的品牌？</h2>
        {view.profile.emptyNote ? (
          <p className="mt-3 text-sm text-slate-600">{view.profile.emptyNote}</p>
        ) : null}
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {view.profile.fields.map((field) => (
            <div key={field.label} className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs text-slate-500">{field.label}</p>
              <p className="mt-1 font-medium">{field.value}</p>
              <p className="mt-1 text-xs text-slate-500">{field.level}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold">你希望成为谁，AI现在怎么看你</h2>
        {view.positioningComparison.available ? (
          <table className="mt-4 w-full text-sm">
            <thead>
              <tr className="border-b text-left text-slate-500">
                <th className="py-2">维度</th>
                <th className="py-2">品牌目标</th>
                <th className="py-2">AI当前认知</th>
              </tr>
            </thead>
            <tbody>
              {view.positioningComparison.rows.map((row) => (
                <tr key={row.dimension} className="border-b border-slate-100">
                  <td className="py-2">{row.dimension}</td>
                  <td className="py-2">{row.desired}</td>
                  <td className="py-2">{row.actual}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="mt-3 text-sm leading-6 text-slate-700">
            {view.positioningComparison.emptyNote}
          </p>
        )}
      </section>

      <section>
        <h2 className="text-2xl font-semibold">BrandMirror发现的5个主要问题</h2>
        <ol className="mt-4 space-y-4">
          {view.diagnoses.map((d, i) => (
            <li key={`${d.title}-${i}`} className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="text-xs text-slate-500">
                {i + 1} · {d.severityLabel}
              </p>
              <p className="mt-1 font-medium">{d.title}</p>
              <p className="mt-2 text-sm leading-6">发现：{d.finding}</p>
              <ul className="mt-2 list-disc pl-5 text-sm text-slate-600">
                {d.evidence.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
              <p className="mt-2 text-sm leading-6">意味着什么：{d.meaning}</p>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <h2 className="text-2xl font-semibold">现在最值得做的事情</h2>
        <p className="mt-2 text-sm text-slate-600">
          BrandMirror不会给你几十条泛泛建议，只保留当前最值得优先处理的5～10项。
        </p>
        <div className="mt-4 space-y-4">
          {view.prescriptions.map((p) => (
            <details
              key={p.priority}
              open={p.priority <= 3}
              className="rounded-xl border border-slate-200 bg-white p-5"
            >
              <summary className="cursor-pointer font-medium">
                P{p.priority} {p.title}
              </summary>
              <p className="mt-3 text-xs text-slate-500">
                执行难度 {p.difficultyLabel} · 时间尺度 {p.timeHorizonLabel}
              </p>
              <p className="mt-3 text-sm leading-6">
                <span className="text-slate-500">为什么：</span> {p.why}
              </p>
              <p className="mt-2 text-sm leading-6">
                <span className="text-slate-500">怎么做：</span> {p.action}
              </p>
            </details>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold">不同AI怎么看你的品牌</h2>
        <p className="mt-2 text-sm text-slate-600">
          当公开品牌信息不足时，部分模型可能自行补全未经品牌资料支持的信息。
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-slate-500">
                <th className="py-2" />
                {view.providerComparison.map((p) => (
                  <th key={p.label} className="py-2">
                    {p.label}
                    <div className="font-normal text-xs">{p.modelLabel}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(
                [
                  ["品牌认知", "awareness"],
                  ["自然发现", "discovery"],
                  ["推荐表现", "recommendation"],
                  ["认知匹配", "alignment"],
                  ["信息补全风险", "informationRisk"],
                ] as const
              ).map(([label, key]) => (
                <tr key={key} className="border-b border-slate-100">
                  <td className="py-2">{label}</td>
                  {view.providerComparison.map((p) => (
                    <td key={p.label} className="py-2">
                      {p[key].toFixed(1)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm leading-7 text-slate-700">
        <h2 className="text-lg font-semibold text-slate-900">测试方法</h2>
        <p className="mt-2">
          {view.reportMeta.questionCount}个消费者问题 · {view.reportMeta.modelCount}个模型 ·{" "}
          {view.reportMeta.observationCount}次观察 · {view.reportMeta.unbrandedQuestionCount}
          个无品牌问题 · {view.reportMeta.brandedQuestionCount}个品牌相关问题
        </p>
        <p>
          {view.methodology.thinking} · {view.methodology.search} · {view.methodology.surface}
        </p>
        <p>测试模型：{view.methodology.models.join("、")}</p>
        <p>{view.methodology.note}</p>
        <p className="mt-3">{view.methodology.disclaimer}</p>
        {publicView ? null : null}
      </section>
    </article>
  );
}
