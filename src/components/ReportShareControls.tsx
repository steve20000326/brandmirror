"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ReportShareControls({
  scanJobId,
  enabled,
  tokenPreview,
}: {
  scanJobId: string;
  enabled: boolean;
  tokenPreview: string | null;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function setEnabled(next: boolean) {
    setPending(true);
    await fetch(`/api/reports/${scanJobId}/share`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: next }),
    });
    setPending(false);
    router.refresh();
  }

  return (
    <div className="print-hidden mb-8 rounded-xl border border-slate-200 bg-white p-4 text-sm">
      <p className="font-medium">报告分享</p>
      {tokenPreview && enabled ? (
        <p className="mt-1 text-slate-600">公开链接已开启（只读）</p>
      ) : (
        <p className="mt-1 text-slate-600">分享关闭后，旧链接将失效。</p>
      )}
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => void setEnabled(true)}
          className="rounded-lg bg-slate-900 px-3 py-1.5 text-white disabled:opacity-60"
        >
          Enable Share
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => void setEnabled(false)}
          className="rounded-lg border border-slate-300 px-3 py-1.5 disabled:opacity-60"
        >
          Disable Share
        </button>
        <button
          type="button"
          className="rounded-lg border border-slate-300 px-3 py-1.5"
          onClick={() => window.print()}
        >
          打印 / 保存 PDF
        </button>
      </div>
    </div>
  );
}
