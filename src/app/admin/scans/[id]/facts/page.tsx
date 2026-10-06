import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { loadFactReviewRows, summarizeFactReviews } from "@/server/admin/fact-review";
import { saveFactReviewForm } from "@/server/admin/pilot";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export default async function FactReviewPage({ params }: PageProps) {
  const { id } = await params;
  const job = await prisma.scanJob.findUnique({
    where: { id },
    include: { brand: { select: { id: true, name: true } } },
  });
  if (!job) notFound();

  const rows = await loadFactReviewRows(id);
  const summary = summarizeFactReviews(rows);

  return (
    <div>
      <Link href="/admin/scans" className="text-sm text-slate-500">
        ← Scans
      </Link>
      <h1 className="mt-2 text-2xl font-semibold">Fact Review</h1>
      <p className="mt-1 text-sm text-slate-600">{job.brand.name}</p>
      <p className="mt-3 text-sm text-slate-600">
        Unsupported Claims {summary.total} · Confirmed True {summary.confirmedTrue} · Confirmed False{" "}
        {summary.confirmedFalse} · Unknown {summary.unknown} · Pending {summary.pending}
      </p>
      <p className="mt-2 text-xs text-slate-500">
        只标记人工核实结果。不会覆盖原始 Analyzer JSON（unsupported_specifics 保持不变）。
      </p>

      {rows.length === 0 ? (
        <p className="mt-6 text-sm text-slate-500">当前扫描没有 Unsupported Claims。</p>
      ) : (
        <form action={saveFactReviewForm} className="mt-6 space-y-4">
          <input type="hidden" name="scanJobId" value={id} />
          {rows.map((row) => (
            <section
              key={`${row.observationId}:${row.index}`}
              className="rounded-xl border border-slate-200 bg-white p-4 text-sm"
            >
              <p className="text-xs text-slate-500">
                {row.provider} · {row.questionText}
              </p>
              <p className="mt-2 font-medium">{row.claim}</p>
              <p className="mt-1 text-slate-600">{row.reason}</p>
              <div className="mt-3 flex flex-wrap gap-4">
                {(["confirmed_true", "confirmed_false", "unknown"] as const).map((status) => (
                  <label key={status} className="flex items-center gap-1">
                    <input
                      type="radio"
                      name={`status:${row.observationId}:${row.index}`}
                      value={status}
                      defaultChecked={row.status === status}
                    />
                    {status === "confirmed_true"
                      ? "Confirmed True"
                      : status === "confirmed_false"
                        ? "Confirmed False"
                        : "Unknown"}
                  </label>
                ))}
              </div>
              <input
                name={`note:${row.observationId}:${row.index}`}
                defaultValue={row.note ?? ""}
                placeholder="备注"
                className="mt-3 w-full rounded border px-2 py-1"
              />
            </section>
          ))}
          <button className="rounded bg-slate-900 px-4 py-2 text-white" type="submit">
            保存 Fact Review 并刷新 Risk Summary 文案
          </button>
        </form>
      )}

      <p className="mt-6 text-sm">
        <Link className="underline" href={`/admin/brands/${job.brand.id}`}>
          返回品牌 Pilot 记录
        </Link>
      </p>
    </div>
  );
}
