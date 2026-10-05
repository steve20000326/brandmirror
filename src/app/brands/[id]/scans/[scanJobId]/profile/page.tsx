import Link from "next/link";
import { notFound } from "next/navigation";
import { NO_STABLE_COGNITION, type BrandPortrait } from "@/ai/profile/types";
import { PageHeader } from "@/components/PageHeader";
import { isCalibrationBrand } from "@/domain/brands/calibration";
import { getBrandById } from "@/server/brands/queries";
import { getScanJobById } from "@/server/scans/queries";
import { getScanReport } from "@/server/report/engine";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string; scanJobId: string }>;
};

export default async function BrandProfilePage({ params }: PageProps) {
  const { id, scanJobId } = await params;
  const brand = await getBrandById(id);
  if (!brand) notFound();
  const job = await getScanJobById(scanJobId);
  if (!job || job.brandId !== brand.id) notFound();
  const report = await getScanReport(scanJobId);
  const portrait = report.profile?.portraitJson
    ? (JSON.parse(report.profile.portraitJson) as BrandPortrait)
    : null;

  return (
    <div>
      <div className="mb-2">
        <Link
          href={`/brands/${brand.id}/reports/${scanJobId}`}
          className="text-sm text-slate-500 hover:text-slate-800"
        >
          ← 完整报告
        </Link>
      </div>
      {isCalibrationBrand(brand) ? (
        <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm">
          Calibration Brand · 虚构测试品牌
        </div>
      ) : null}
      <PageHeader title={`AI眼中的「${brand.name}」`} />

      <section className="mb-8">
        <h2 className="text-lg font-semibold">AI认为你是一个什么品牌？</h2>
        <p className="mt-3 text-lg leading-8 text-slate-800">
          {portrait?.executiveSummary ?? "请先生成报告。"}
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          <Tag>{portrait?.audience.summary ?? NO_STABLE_COGNITION}</Tag>
          <Tag>{portrait?.priceTier.summary ?? NO_STABLE_COGNITION}</Tag>
          <Tag>
            {portrait?.style.primary[0]?.label ?? NO_STABLE_COGNITION}
          </Tag>
        </div>
      </section>

      <section className="mb-8">
        <h3 className="font-medium">AI最容易在哪些场景想到你</h3>
        <p className="mt-2 text-sm text-slate-700">
          {portrait?.scenarios.strong.length
            ? portrait.scenarios.strong.map((s) => s.label).join("、")
            : NO_STABLE_COGNITION}
        </p>
        <h3 className="mt-6 font-medium">AI很少在哪些场景想到你</h3>
        <p className="mt-2 text-sm text-slate-700">
          {portrait?.scenarios.weak.length
            ? portrait.scenarios.weak.map((s) => s.label).join("、")
            : NO_STABLE_COGNITION}
        </p>
        <h3 className="mt-6 font-medium">AI通常把你和谁放在一起比较</h3>
        <p className="mt-2 text-sm text-slate-700">
          {portrait?.competitorAssociations.length
            ? portrait.competitorAssociations
                .map((c) => `${c.label}（${c.evidenceCount}）`)
                .join("、")
            : NO_STABLE_COGNITION}
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold">品牌希望 VS AI实际</h2>
        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="border-b text-left text-slate-500">
              <th className="py-2">品牌希望</th>
              <th className="py-2">AI实际</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="py-2">{brand.targetAudience ?? "—"}</td>
              <td className="py-2">{portrait?.audience.summary ?? NO_STABLE_COGNITION}</td>
            </tr>
            <tr className="border-b">
              <td className="py-2">{brand.priceTier ?? "—"}</td>
              <td className="py-2">{portrait?.priceTier.summary ?? NO_STABLE_COGNITION}</td>
            </tr>
            <tr>
              <td className="py-2">{brand.desiredPositioning ?? "—"}</td>
              <td className="py-2">
                {portrait?.style.primary[0]?.label ?? NO_STABLE_COGNITION}
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  );
}

function Tag({ children }: { children: string }) {
  return <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-800">{children}</span>;
}
