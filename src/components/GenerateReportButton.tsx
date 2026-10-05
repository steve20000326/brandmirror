"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function GenerateReportButton({ scanJobId }: { scanJobId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="mb-6">
      <button
        type="button"
        disabled={pending}
        onClick={async () => {
          setPending(true);
          setError(null);
          const res = await fetch(`/api/reports/${scanJobId}`, { method: "POST" });
          const json = (await res.json()) as { ok: boolean; error?: string };
          setPending(false);
          if (!json.ok) {
            setError(json.error ?? "生成失败");
            return;
          }
          router.refresh();
        }}
        className="inline-flex h-10 items-center rounded-lg bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
      >
        {pending ? "正在生成诊断与处方…" : "生成 / 刷新报告"}
      </button>
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
