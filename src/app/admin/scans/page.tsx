import Link from "next/link";
import { loadAdminScans } from "@/server/admin/overview";
import { loadUsageOverview, formatKnownCosts } from "@/server/admin/usage";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminScansPage() {
  const scans = await loadAdminScans();
  const profiles = await prisma.brandProfile.findMany({
    select: { scanJobId: true, aiBrandScore: true },
  });
  const scoreByJob = new Map(profiles.map((p) => [p.scanJobId, p.aiBrandScore]));

  return (
    <div>
      <h1 className="text-2xl font-semibold">Scans</h1>
      <div className="mt-6 space-y-6">
        {await Promise.all(
          scans.map(async (job) => {
            const usage = await loadUsageOverview(job.id);
            const costs = formatKnownCosts(usage.overall);
            const unusual = usage.highTokenProviders.size > 0;
            return (
              <section key={job.id} className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
                <div className="flex flex-wrap justify-between gap-2">
                  <p className="font-medium">
                    {job.brand.name}
                    {job.brand.isCalibration ? (
                      <span className="ml-2 text-xs text-amber-700">Calibration</span>
                    ) : null}
                  </p>
                  <Link href={`/brands/${job.brand.id}/reports/${job.id}`} className="underline">
                    进入结果
                  </Link>
                </div>
                <p className="mt-2 text-slate-600">
                  Date {job.createdAt.toISOString().slice(0, 10)} · Questions {job.totalTasks / 3 || "—"} ·
                  Providers 3 · Completed {job.completedTasks} · Failed {job.failedTasks} · Analysis{" "}
                  {job.analysisStatus} · Brand Score {scoreByJob.get(job.id)?.toFixed(1) ?? "—"}
                </p>
                <div className="mt-3 rounded-lg bg-slate-50 p-3">
                  <p className="font-medium">Cost of This Report</p>
                  <p className="mt-1">
                    Known CNY {costs.knownCny ?? "—"} · Known USD {costs.knownUsd ?? "—"}
                    {costs.unknownPricedUsage ? " · Unknown-priced Usage 存在" : ""}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    扫描 / Analyzer / Profile / Diagnosis / Prescription 分项目见 Usage 页。货币不合并。
                  </p>
                  {unusual ? (
                    <p className="mt-2 text-amber-800">Token usage unusually high.</p>
                  ) : null}
                </div>
              </section>
            );
          }),
        )}
      </div>
    </div>
  );
}
