import Link from "next/link";
import { BrandCard } from "@/components/BrandCard";
import { PageHeader } from "@/components/PageHeader";
import { listBrands } from "@/server/brands/queries";

export const dynamic = "force-dynamic";

export default async function BrandsPage() {
  const brands = await listBrands();

  return (
    <div>
      <PageHeader
        title="品牌列表"
        description="查看已创建的品牌体检档案。"
        action={{ href: "/brands/new", label: "新建品牌" }}
      />

      {brands.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white/60 px-6 py-16 text-center">
          <p className="text-sm text-slate-600">还没有品牌，先创建第一个吧。</p>
          <Link
            href="/brands/new"
            className="mt-4 inline-flex h-10 items-center rounded-lg bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800"
          >
            新建品牌
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {brands.map((brand) => (
            <BrandCard key={brand.id} brand={brand} />
          ))}
        </div>
      )}
    </div>
  );
}
