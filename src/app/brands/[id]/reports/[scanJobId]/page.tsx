import Link from "next/link";
import { notFound } from "next/navigation";
import { GenerateReportButton } from "@/components/GenerateReportButton";
import { PageHeader } from "@/components/PageHeader";
import { ReportDocument } from "@/components/ReportDocument";
import { isCalibrationBrand } from "@/domain/brands/calibration";
import type { BrandPortrait } from "@/ai/profile/types";
import type { GeoMetrics } from "@/server/analysis/metrics";
import { getBrandById } from "@/server/brands/queries";
import { getScanJobById } from "@/server/scans/queries";
import { getScanReport } from "@/server/report/engine";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string; scanJobId: string }>;
};

export default async function ScanReportPage({ params }: PageProps) {
  const { id, scanJobId } = await params;
  const brand = await getBrandById(id);
  if (!brand) notFound();
  const job = await getScanJobById(scanJobId);
  if (!job || job.brandId !== brand.id) notFound();
  const report = await getScanReport(scanJobId);
  const metrics = report.profile?.profileJson
    ? (JSON.parse(report.profile.profileJson) as GeoMetrics)
    : null;
  const portrait = report.profile?.portraitJson
    ? (JSON.parse(report.profile.portraitJson) as BrandPortrait)
    : null;
  const testedAt = (job.completedAt ?? job.createdAt).toISOString().slice(0, 10);

  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-4">
        <Link
          href={`/brands/${brand.id}/scans/${scanJobId}/analysis`}
          className="text-sm text-slate-500 hover:text-slate-800"
        >
          ← 指标页
        </Link>
        <Link
          href={`/brands/${brand.id}/scans/${scanJobId}/profile`}
          className="text-sm text-slate-500 hover:text-slate-800"
        >
          AI眼中的你
        </Link>
      </div>
      <PageHeader title="BrandMirror 报告" description="10分钟看懂：AI把你看成谁，以及现在最值得做的事。" />
      <GenerateReportButton scanJobId={scanJobId} />
      {metrics ? (
        <ReportDocument
          brand={brand}
          testedAt={testedAt}
          metrics={metrics}
          portrait={portrait}
          diagnoses={report.diagnoses}
          prescriptions={report.prescriptions}
          calibration={isCalibrationBrand(brand)}
        />
      ) : (
        <p className="text-sm text-slate-600">请先完成分析，再生成报告。</p>
      )}
    </div>
  );
}
