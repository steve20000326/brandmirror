import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import type { ProviderId } from "@/ai/providers/types";
import { CONSUMER_BASELINE_PROMPT_VERSION } from "@/ai/prompts/consumer-baseline";
import { FASHION_PACK_VERSION } from "@/domain/industry-packs/fashion";
import { PROVIDER_LABELS } from "@/server/scans/types";
import { getBrandById } from "@/server/brands/queries";
import { getScanJobById, listScanObservations, listScanUsage } from "@/server/scans/queries";
import { AnalysisController } from "@/components/AnalysisController";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string; scanJobId: string }>;
};

const PROVIDER_ORDER: ProviderId[] = ["deepseek", "tencent-hy", "qwen"];

export default async function ScanResultPage({ params }: PageProps) {
  const { id, scanJobId } = await params;
  const brand = await getBrandById(id);
  if (!brand) notFound();

  const job = await getScanJobById(scanJobId);
  if (!job || job.brandId !== brand.id) notFound();

  const observations = await listScanObservations(scanJobId);
  const usageRows = await listScanUsage(scanJobId);

  const usageByProvider = PROVIDER_ORDER.map((provider) => {
    const rows = usageRows.filter((u) => u.provider === provider);
    return {
      provider,
      requests: rows.length,
      promptTokens: rows.reduce((s, r) => s + r.promptTokens, 0),
      completionTokens: rows.reduce((s, r) => s + r.completionTokens, 0),
      totalTokens: rows.reduce((s, r) => s + r.totalTokens, 0),
    };
  });
  const totals = usageByProvider.reduce(
    (acc, p) => ({
      requests: acc.requests + p.requests,
      promptTokens: acc.promptTokens + p.promptTokens,
      completionTokens: acc.completionTokens + p.completionTokens,
      totalTokens: acc.totalTokens + p.totalTokens,
    }),
    { requests: 0, promptTokens: 0, completionTokens: 0, totalTokens: 0 },
  );

  const questionMap = new Map<
    string,
    {
      text: string;
      brandPresent: boolean;
      questionType: string | null;
      answers: typeof observations;
    }
  >();
  for (const obs of observations) {
    const existing = questionMap.get(obs.questionId);
    if (existing) {
      existing.answers.push(obs);
    } else {
      questionMap.set(obs.questionId, {
        text: obs.question.text,
        brandPresent: obs.question.brandPresent,
        questionType: obs.question.questionType,
        answers: [obs],
      });
    }
  }
  const questions = [...questionMap.values()];

  return (
    <div>
      <div className="mb-2">
        <Link
          href={`/brands/${brand.id}/scan`}
          className="text-sm text-slate-500 hover:text-slate-800"
        >
          ← 返回扫描
        </Link>
      </div>
      <PageHeader
        title="扫描完成"
        description={`${job.completedTasks} / ${job.totalTasks} · ${brand.name}`}
      />

      <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-950">
        本结果来自模型API标准化测试，不等同于对应消费者AI应用的实际回答。Search：OFF · Surface：Model API
      </div>

      <div className="mb-8 grid gap-3 rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-700 shadow-sm sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <p className="text-xs text-slate-500">扫描时间</p>
          <p className="mt-1">
            {job.startedAt ? job.startedAt.toLocaleString("zh-CN") : "—"}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Fashion Pack Version</p>
          <p className="mt-1">{FASHION_PACK_VERSION}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Prompt Version</p>
          <p className="mt-1">{CONSUMER_BASELINE_PROMPT_VERSION}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Search</p>
          <p className="mt-1">OFF</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Surface</p>
          <p className="mt-1">Model API</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">状态</p>
          <p className="mt-1">{job.status}</p>
        </div>
      </div>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">本次模型调用</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {usageByProvider.map((p) => (
            <div key={p.provider} className="rounded-lg bg-slate-50 px-3 py-3 text-sm">
              <p className="font-medium text-slate-900">{PROVIDER_LABELS[p.provider]}</p>
              <p className="mt-1 text-slate-600">{p.requests} requests</p>
              <p className="text-slate-600">{p.totalTokens} tokens</p>
            </div>
          ))}
          <div className="rounded-lg bg-slate-900 px-3 py-3 text-sm text-white">
            <p className="font-medium">Total</p>
            <p className="mt-1">{totals.requests} requests</p>
            <p>{totals.totalTokens} tokens</p>
          </div>
        </div>
      </section>

      <AnalysisController
        brandId={brand.id}
        scanJobId={job.id}
        scanStatus={job.status}
        initialAnalysisStatus={job.analysisStatus}
        initialAnalyzed={job.analyzedTasks}
        totalTasks={job.totalTasks}
      />

      <div className="space-y-4">
        {questions.map((q, index) => (
          <details
            key={`${q.text}-${index}`}
            className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm"
          >
            <summary className="cursor-pointer text-sm font-medium text-slate-900">
              {index + 1}. {q.text}
              {q.brandPresent ? (
                <span className="ml-2 text-xs font-normal text-slate-500">含品牌</span>
              ) : (
                <span className="ml-2 text-xs font-normal text-slate-500">无品牌</span>
              )}
            </summary>
            <div className="mt-4 space-y-4">
              {PROVIDER_ORDER.map((provider) => {
                const obs = q.answers.find((a) => a.provider === provider);
                return (
                  <div key={provider} className="border-t border-slate-100 pt-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      {PROVIDER_LABELS[provider]}
                    </p>
                    {obs?.status === "completed" && obs.rawResponse ? (
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-800">
                        {obs.rawResponse}
                      </p>
                    ) : (
                      <p className="mt-2 text-sm text-rose-700">
                        {obs?.errorMessage ?? obs?.status ?? "无结果"}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
