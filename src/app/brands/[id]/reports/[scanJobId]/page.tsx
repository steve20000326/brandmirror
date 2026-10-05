import Link from "next/link";
import { notFound } from "next/navigation";
import { ClientReport } from "@/components/ClientReport";
import { GenerateReportButton } from "@/components/GenerateReportButton";
import { ReportShareControls } from "@/components/ReportShareControls";
import { loadClientReport } from "@/server/reports/queries";
import { getOrCreateReportShare } from "@/server/reports/share";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string; scanJobId: string }>;
};

export default async function InternalReportPage({ params }: PageProps) {
  const { id, scanJobId } = await params;
  const loaded = await loadClientReport(scanJobId);
  if (!loaded || loaded.brandId !== id) notFound();

  const share =
    loaded.status === "ready" ? await getOrCreateReportShare(scanJobId) : null;

  return (
    <div>
      <div className="print-hidden mb-4 flex flex-wrap gap-4 text-sm">
        <Link href={`/brands/${id}/scans/${scanJobId}/analysis`} className="text-slate-500">
          ← 指标页
        </Link>
      </div>
      {loaded.status !== "ready" || !loaded.view ? (
        <div>
          <p className="mb-4 text-sm text-slate-600">报告尚未完整，请先生成诊断与处方。</p>
          <GenerateReportButton scanJobId={scanJobId} />
        </div>
      ) : (
        <>
          <ReportShareControls
            scanJobId={scanJobId}
            enabled={Boolean(share?.enabled)}
            tokenPreview={share?.enabled ? share.shareToken.slice(0, 6) : null}
          />
          {share?.enabled ? (
            <p className="print-hidden mb-6 text-sm text-slate-500">
              公开阅读地址已生成（请从地址栏或后台复制完整链接，勿在对外沟通中泄露后台路径）。
            </p>
          ) : null}
          <ClientReport view={loaded.view} />
        </>
      )}
    </div>
  );
}
