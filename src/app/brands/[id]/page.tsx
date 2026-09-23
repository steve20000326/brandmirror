import Link from "next/link";
import { notFound } from "next/navigation";
import { GeneratePlanButton } from "@/components/GeneratePlanButton";
import { PageHeader } from "@/components/PageHeader";
import { isFashionIndustry } from "@/domain/industry-packs";
import { brandStatusLabel } from "@/lib/utils";
import { brandHasQuestionPlan, getBrandById } from "@/server/brands/queries";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="border-b border-slate-100 py-3 last:border-0 sm:grid sm:grid-cols-[160px_1fr] sm:gap-4">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm text-slate-900 sm:mt-0">
        {value?.trim() ? value : "—"}
      </dd>
    </div>
  );
}

export default async function BrandDetailPage({ params }: PageProps) {
  const { id } = await params;
  const brand = await getBrandById(id);

  if (!brand) {
    notFound();
  }

  const hasPlan = await brandHasQuestionPlan(brand.id);
  const industrySupported = isFashionIndustry(brand.industry);

  return (
    <div>
      <div className="mb-2">
        <Link href="/brands" className="text-sm text-slate-500 hover:text-slate-800">
          ← 返回品牌列表
        </Link>
      </div>

      <PageHeader title={brand.name} />

      <div className="mb-8 inline-flex items-center gap-2 rounded-md bg-slate-100 px-3 py-1.5 text-sm text-slate-700">
        状态：{brandStatusLabel(brand.status)}
      </div>

      <div className="space-y-6">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-2 text-base font-semibold text-slate-900">品牌资料</h2>
          <dl>
            <InfoRow label="所属行业" value={brand.industry} />
            <InfoRow label="官网" value={brand.websiteUrl} />
            <InfoRow label="官方商城/店铺" value={brand.officialStoreUrl} />
            <InfoRow label="品牌简介" value={brand.description} />
            <InfoRow label="核心产品" value={brand.coreProducts} />
            <InfoRow label="目标消费者" value={brand.targetAudience} />
            <InfoRow label="价格档次" value={brand.priceTier} />
          </dl>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-2 text-base font-semibold text-slate-900">
            品牌期望认知
          </h2>
          <dl>
            <InfoRow label="品牌期望定位" value={brand.desiredPositioning} />
            <InfoRow label="期望关键词" value={brand.desiredKeywords} />
          </dl>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-3 text-base font-semibold text-slate-900">竞争品牌</h2>
          {brand.competitors.length === 0 ? (
            <p className="text-sm text-slate-500">暂无竞品</p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {brand.competitors.map((c) => (
                <li
                  key={c.id}
                  className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-800"
                >
                  {c.name}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="mt-10 border-t border-slate-200 pt-8">
        <GeneratePlanButton
          brandId={brand.id}
          hasPlan={hasPlan}
          industrySupported={industrySupported}
        />
      </div>
    </div>
  );
}
