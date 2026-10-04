"use client";

import { useEffect, useState } from "react";

type ProviderRow = {
  provider: string;
  label: string;
  model: string;
  modelLabel: string;
  configured: boolean;
};

type TestState = {
  status: "idle" | "testing" | "ok" | "fail";
  latencyMs?: number;
  error?: string;
};

export function ModelHealthPanel() {
  const [rows, setRows] = useState<ProviderRow[]>([]);
  const [tests, setTests] = useState<Record<string, TestState>>({});

  useEffect(() => {
    void fetch("/api/admin/models")
      .then((r) => r.json())
      .then((data: { providers: ProviderRow[] }) => {
        setRows(data.providers);
        const initial: Record<string, TestState> = {};
        for (const p of data.providers) {
          initial[p.provider] = { status: "idle" };
        }
        setTests(initial);
      });
  }, []);

  async function testOne(provider: string) {
    setTests((prev) => ({ ...prev, [provider]: { status: "testing" } }));
    const res = await fetch("/api/admin/models", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider }),
    });
    const data = (await res.json()) as {
      ok?: boolean;
      latencyMs?: number;
      error?: string;
    };
    setTests((prev) => ({
      ...prev,
      [provider]: data.ok
        ? { status: "ok", latencyMs: data.latencyMs }
        : { status: "fail", latencyMs: data.latencyMs, error: data.error },
    }));
  }

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Provider</th>
              <th className="px-4 py-3 font-medium">Model</th>
              <th className="px-4 py-3 font-medium">配置</th>
              <th className="px-4 py-3 font-medium">状态</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const t = tests[row.provider] ?? { status: "idle" };
              return (
                <tr key={row.provider} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-900">{row.label}</td>
                  <td className="px-4 py-3 text-slate-700">{row.model}</td>
                  <td className="px-4 py-3">
                    {row.configured ? "Configured" : "Not Configured"}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {t.status === "idle" ? "未测试" : null}
                    {t.status === "testing" ? "测试中…" : null}
                    {t.status === "ok" ? (
                      <span className="text-emerald-700">
                        ✓ Connected
                        {typeof t.latencyMs === "number" ? ` · 延迟：${t.latencyMs} ms` : ""}
                      </span>
                    ) : null}
                    {t.status === "fail" ? (
                      <span className="text-rose-700">
                        ✕ Connection Failed
                        {t.error ? ` · ${t.error}` : ""}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      disabled={t.status === "testing" || !row.configured}
                      onClick={() => void testOne(row.provider)}
                      className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      测试连接
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-500">
        测试只发送「请只回复：OK」，不会写入扫描结果。API Key 不会显示在本页。
      </p>
    </div>
  );
}
