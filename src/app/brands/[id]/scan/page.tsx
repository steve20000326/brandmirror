import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { ScanController } from "@/components/ScanController";
import { getUnconfiguredScanProviders } from "@/ai/providers";
import { PROVIDER_LABELS } from "@/server/scans/types";
import { getBrandById } from "@/server/brands/queries";
import { getLatestScanJob, getScanProgress } from "@/server/scans/queries";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function BrandScanPage({ params }: PageProps) {
  const { id } = await params;
  const brand = await getBrandById(id);
  if (!brand) notFound();

  const missing = getUnconfiguredScanProviders();
  const latest = await getLatestScanJob(brand.id);
  const progress = latest ? await getScanProgress(latest.id) : null;

  return (
    <div>
      <div className="mb-2">
        <Link
          href={`/brands/${brand.id}/questions`}
          className="text-sm text-slate-500 hover:text-slate-800"
        >
          ← 返回测试方案
        </Link>
      </div>
      <PageHeader
        title="模型基线扫描"
        description={`${brand.name} · 30 题 × 3 模型 = 90 次独立观察`}
      />
      <ScanController
        brandId={brand.id}
        initialJobId={latest?.id ?? null}
        initialProgress={progress}
        allConfigured={missing.length === 0}
        missingLabels={missing.map((p) => PROVIDER_LABELS[p])}
      />
    </div>
  );
}
