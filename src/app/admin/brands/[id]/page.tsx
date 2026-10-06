import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getBrandById } from "@/server/brands/queries";
import { cohortLabel } from "@/server/admin/overview";
import { savePilotFeedback, updateBrandAliasesForm, updateBrandCohortForm } from "@/server/admin/pilot";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export default async function AdminBrandDetailPage({ params }: PageProps) {
  const { id } = await params;
  const brand = await getBrandById(id);
  if (!brand) notFound();

  const aliases = brand.aliasesJson
    ? (JSON.parse(brand.aliasesJson) as string[]).join("\n")
    : brand.name;
  const latestScan = await prisma.scanJob.findFirst({
    where: { brandId: id },
    orderBy: { createdAt: "desc" },
  });
  const feedback = await prisma.pilotFeedback.findMany({
    where: { brandId: id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-8">
      <div>
        <Link href="/admin/brands" className="text-sm text-slate-500">
          ← Brands
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">{brand.name}</h1>
        <p className="mt-1 text-sm text-slate-600">
          标签 {cohortLabel(brand.cohort, brand.isCalibration)}
        </p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
        <h2 className="font-medium">Pilot 标记</h2>
        <form action={updateBrandCohortForm} className="mt-3 flex flex-wrap items-end gap-3">
          <input type="hidden" name="brandId" value={brand.id} />
          <label>
            Cohort
            <select name="cohort" defaultValue={brand.cohort} className="ml-2 rounded border px-2 py-1">
              <option value="calibration">Calibration</option>
              <option value="pilot">Pilot</option>
              <option value="customer">Customer</option>
            </select>
          </label>
          <button className="rounded bg-slate-900 px-3 py-1.5 text-white" type="submit">
            保存
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
        <h2 className="font-medium">Aliases（人工确认，最多 5 个）</h2>
        <form action={updateBrandAliasesForm} className="mt-3 space-y-2">
          <input type="hidden" name="brandId" value={brand.id} />
          <textarea
            name="aliases"
            rows={5}
            defaultValue={aliases}
            className="w-full rounded border px-3 py-2"
          />
          <button className="rounded bg-slate-900 px-3 py-1.5 text-white" type="submit">
            保存别称
          </button>
        </form>
      </section>

      {latestScan ? (
        <section className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
          <h2 className="font-medium">最新扫描</h2>
          <p className="mt-2 text-slate-600">{latestScan.id}</p>
          <div className="mt-3 flex flex-wrap gap-3">
            <Link className="underline" href={`/admin/scans/${latestScan.id}/facts`}>
              Fact Review
            </Link>
            <Link className="underline" href={`/brands/${brand.id}/reports/${latestScan.id}`}>
              客户报告
            </Link>
          </div>
        </section>
      ) : null}

      <section className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
        <h2 className="font-medium">Pilot Feedback</h2>
        {latestScan ? (
          <form action={savePilotFeedback} className="mt-4 grid gap-3">
            <input type="hidden" name="brandId" value={brand.id} />
            <input type="hidden" name="scanJobId" value={latestScan.id} />
            <label>
              New Insight
              <textarea name="newInsight" rows={2} className="mt-1 w-full rounded border px-2 py-1" />
            </label>
            <label>
              Surprising Insight
              <textarea name="surprisingInsight" rows={2} className="mt-1 w-full rounded border px-2 py-1" />
            </label>
            <label>
              Incorrect Finding
              <textarea name="incorrectFinding" rows={2} className="mt-1 w-full rounded border px-2 py-1" />
            </label>
            <label>
              Actions willing to take
              <textarea name="actionableItems" rows={2} className="mt-1 w-full rounded border px-2 py-1" />
            </label>
            <label>
              Preferred Frequency
              <select name="preferredFrequency" className="mt-1 rounded border px-2 py-1">
                <option value="monthly">每月</option>
                <option value="quarterly">每季度</option>
                <option value="half_year">半年</option>
                <option value="once">一次就够</option>
              </select>
            </label>
            <label>
              Willingness
              <select name="willingness" className="mt-1 rounded border px-2 py-1">
                <option value="YES">YES</option>
                <option value="MAYBE">MAYBE</option>
                <option value="NO">NO</option>
              </select>
            </label>
            <label>
              Willingness note
              <input name="willingnessNote" className="mt-1 w-full rounded border px-2 py-1" />
            </label>
            <label>
              Quoted Price
              <input name="quotedPrice" type="number" step="1" className="mt-1 rounded border px-2 py-1" />
            </label>
            <label className="flex items-center gap-2">
              <input name="paid" type="checkbox" value="true" />
              Paid
            </label>
            <div className="grid gap-2 sm:grid-cols-2">
              <label>
                资料准备（分钟）
                <input name="dossierMinutes" type="number" className="mt-1 w-full rounded border px-2 py-1" />
              </label>
              <label>
                问题审核（分钟）
                <input name="questionReviewMinutes" type="number" className="mt-1 w-full rounded border px-2 py-1" />
              </label>
              <label>
                报告审核（分钟）
                <input name="reportReviewMinutes" type="number" className="mt-1 w-full rounded border px-2 py-1" />
              </label>
              <label>
                客户沟通（分钟）
                <input name="clientMinutes" type="number" className="mt-1 w-full rounded border px-2 py-1" />
              </label>
            </div>
            <button className="w-fit rounded bg-slate-900 px-3 py-1.5 text-white" type="submit">
              保存反馈
            </button>
          </form>
        ) : (
          <p className="mt-2 text-slate-500">尚无扫描，无法记录 PilotFeedback。</p>
        )}

        {feedback.length ? (
          <ul className="mt-6 space-y-3">
            {feedback.map((f) => (
              <li key={f.id} className="rounded border border-slate-100 p-3">
                <p>
                  {f.createdAt.toISOString().slice(0, 10)} · {f.willingness ?? "—"} · paid={String(f.paid)}
                </p>
                <p className="mt-1 text-slate-600">{f.newInsight}</p>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </div>
  );
}
