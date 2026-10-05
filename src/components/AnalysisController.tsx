"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";

type Props = {
  brandId: string;
  scanJobId: string;
  scanStatus: string;
  initialAnalysisStatus: string;
  initialAnalyzed: number;
  totalTasks: number;
};

export function AnalysisController({
  brandId,
  scanJobId,
  scanStatus,
  initialAnalysisStatus,
  initialAnalyzed,
  totalTasks,
}: Props) {
  const [status, setStatus] = useState(initialAnalysisStatus);
  const [analyzed, setAnalyzed] = useState(initialAnalyzed);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const looping = useRef(false);

  const canStart = scanStatus === "completed" || scanStatus === "partial";
  const done = status === "completed" || status === "partial" || status === "failed";

  const processLoop = useCallback(async () => {
    if (looping.current) return;
    looping.current = true;
    setBusy(true);
    setError(null);
    try {
      let pending = 1;
      while (pending > 0) {
        const res = await fetch(`/api/analysis-runs/${scanJobId}/process`, {
          method: "POST",
        });
        const data = (await res.json()) as {
          pending?: number;
          completed?: number;
          status?: string;
          error?: string;
        };
        if (!res.ok) {
          setError(data.error ?? "分析失败");
          break;
        }
        pending = data.pending ?? 0;
        setAnalyzed(data.completed ?? 0);
        setStatus(data.status ?? "running");
      }
    } finally {
      looping.current = false;
      setBusy(false);
    }
  }, [scanJobId]);

  return (
    <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-base font-semibold text-slate-900">品牌认知分析</h2>
      <p className="mt-2 text-sm text-slate-600">
        将 90 条原始回答结构化，并由程序计算 GEO 指标。不会改写原始回答。
      </p>

      {status === "running" || busy ? (
        <div className="mt-4 space-y-2 text-sm text-slate-700">
          <p className="text-base font-medium">正在理解90条AI回答……</p>
          <p>
            分析完成：{analyzed} / {totalTasks}
          </p>
          <ul className="list-disc space-y-1 pl-5 text-slate-600">
            <li>提取品牌提及</li>
            <li>识别推荐关系</li>
            <li>识别竞品</li>
            <li>分析品牌认知</li>
            <li>检测未经支持的品牌事实</li>
          </ul>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-3">
        {done && !busy ? (
          <>
            <Link
              href={`/brands/${brandId}/scans/${scanJobId}/analysis`}
              className="inline-flex h-11 items-center rounded-lg bg-slate-900 px-5 text-sm font-medium text-white hover:bg-slate-800"
            >
              查看分析结果
            </Link>
            <Link
              href={`/brands/${brandId}/reports/${scanJobId}`}
              className="inline-flex h-11 items-center rounded-lg border border-slate-300 px-5 text-sm font-medium text-slate-800 hover:bg-slate-50"
            >
              打开完整报告
            </Link>
          </>
        ) : null}
        {canStart && !done && !busy ? (
          <button
            type="button"
            onClick={() => void processLoop()}
            className="inline-flex h-11 items-center rounded-lg bg-slate-900 px-5 text-sm font-medium text-white hover:bg-slate-800"
          >
            分析品牌认知
          </button>
        ) : null}
        {status === "partial" && !busy ? (
          <button
            type="button"
            onClick={() => void processLoop()}
            className="inline-flex h-11 items-center rounded-lg border border-slate-300 px-5 text-sm font-medium text-slate-800 hover:bg-slate-50"
          >
            继续分析失败项
          </button>
        ) : null}
      </div>
      {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}
    </section>
  );
}
