"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import type { ProviderId } from "@/ai/providers/types";
import type { ScanProgress } from "@/server/scans/types";
import { PROVIDER_LABELS } from "@/server/scans/types";

const DISCLAIMER =
  "本次为“模型API基线扫描”，所有模型均关闭联网搜索，并采用统一测试条件。结果用于比较模型自身对品牌的认知，不等同于DeepSeek App、腾讯元宝、通义等消费者产品的实际回答。";

type Props = {
  brandId: string;
  initialJobId: string | null;
  initialProgress: ScanProgress | null;
  allConfigured: boolean;
  missingLabels: string[];
};

export function ScanController({
  brandId,
  initialJobId,
  initialProgress,
  allConfigured,
  missingLabels,
}: Props) {
  const [jobId, setJobId] = useState(initialJobId);
  const [progress, setProgress] = useState<ScanProgress | null>(initialProgress);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const looping = useRef(false);

  const refresh = useCallback(async (id: string) => {
    const res = await fetch(`/api/scan-jobs/${id}`);
    if (!res.ok) return;
    const data = (await res.json()) as ScanProgress;
    setProgress(data);
    return data;
  }, []);

  const processLoop = useCallback(
    async (id: string) => {
      if (looping.current) return;
      looping.current = true;
      setBusy(true);
      setError(null);
      try {
        let pending = 1;
        while (pending > 0) {
          const res = await fetch(`/api/scan-jobs/${id}/process`, { method: "POST" });
          const data = (await res.json()) as {
            pending?: number;
            error?: string;
          };
          if (!res.ok) {
            setError(data.error ?? "批次处理失败");
            break;
          }
          pending = data.pending ?? 0;
          await refresh(id);
        }
      } finally {
        looping.current = false;
        setBusy(false);
        await refresh(id);
      }
    },
    [refresh],
  );

  async function startScan() {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/scan-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandId }),
      });
      const data = (await res.json()) as {
        scanJobId?: string;
        error?: string;
      };
      if (!res.ok || !data.scanJobId) {
        setError(data.error ?? "无法创建扫描任务");
        setBusy(false);
        return;
      }
      setJobId(data.scanJobId);
      await refresh(data.scanJobId);
      await processLoop(data.scanJobId);
    } catch {
      setError("扫描启动失败");
      setBusy(false);
    }
  }

  const done =
    progress &&
    (progress.status === "completed" || progress.status === "partial" || progress.status === "failed");
  const canContinue = progress && progress.pendingTasks > 0;
  const percent = progress
    ? Math.round((progress.completedTasks / Math.max(progress.totalTasks, 1)) * 100)
    : 0;

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-950">
        <p className="font-medium">模型基线扫描</p>
        <p className="mt-1">{DISCLAIMER}</p>
      </div>

      {!allConfigured ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-800">
          {missingLabels.join("、")}尚未配置。请先在 .env 填写密钥，并到
          <Link href="/admin/models" className="mx-1 underline">
            模型连接
          </Link>
          完成 3 / 3 测试后再开始扫描。不会以缺失模型冒充三模型测试。
        </div>
      ) : null}

      {!progress ? (
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">模型基线扫描</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            30个消费者问题 × 3个AI模型 = 90次独立观察
          </p>
          <ul className="mt-4 space-y-1 text-sm text-slate-700">
            <li>DeepSeek V4.1 Flash</li>
            <li>Tencent Hy3</li>
            <li>Qwen3.8 Flash</li>
          </ul>
          <button
            type="button"
            disabled={!allConfigured || busy}
            onClick={() => void startScan()}
            className="mt-6 inline-flex h-11 items-center rounded-lg bg-slate-900 px-5 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "准备中…" : "开始扫描"}
          </button>
        </section>
      ) : (
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            {done ? "扫描已结束" : "正在观察AI如何回答消费者问题……"}
          </h2>
          <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">
            完成 {progress.completedTasks} / {progress.totalTasks}
          </p>
          <p className="mt-1 text-sm text-slate-500">{percent}%</p>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full bg-slate-900 transition-all"
              style={{ width: `${percent}%` }}
            />
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {progress.byProvider.map((p) => (
              <div key={p.provider} className="rounded-lg border border-slate-200 px-3 py-3">
                <p className="text-sm font-medium text-slate-900">
                  {PROVIDER_LABELS[p.provider as ProviderId]}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {p.completed} / {p.total}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {p.failed > 0 ? `失败 ${p.failed}` : p.pending + p.running > 0 ? "运行中" : "完成"}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {canContinue ? (
              <button
                type="button"
                disabled={busy || !allConfigured}
                onClick={() => jobId && void processLoop(jobId)}
                className="inline-flex h-11 items-center rounded-lg bg-slate-900 px-5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {busy ? "扫描中…" : "继续扫描"}
              </button>
            ) : null}
            {done && jobId ? (
              <Link
                href={`/brands/${brandId}/scans/${jobId}`}
                className="inline-flex h-11 items-center rounded-lg bg-slate-900 px-5 text-sm font-medium text-white hover:bg-slate-800"
              >
                查看扫描结果
              </Link>
            ) : null}
          </div>
        </section>
      )}

      {error ? (
        <p role="alert" className="text-sm text-rose-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
