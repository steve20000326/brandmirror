import Link from "next/link";
import { brandStatusLabel, formatDate } from "@/lib/utils";
import type { BrandListItem } from "@/types/brand";

type BrandCardProps = {
  brand: BrandListItem;
};

export function BrandCard({ brand }: BrandCardProps) {
  return (
    <Link
      href={`/brands/${brand.id}`}
      className="block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{brand.name}</h2>
          <p className="mt-1 text-sm text-slate-600">{brand.industry}</p>
        </div>
        <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
          {brandStatusLabel(brand.status)}
        </span>
      </div>
      <p className="mt-4 text-xs text-slate-500">
        创建于 {formatDate(brand.createdAt)}
      </p>
    </Link>
  );
}
