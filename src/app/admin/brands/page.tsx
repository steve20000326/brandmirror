import Link from "next/link";
import { loadAdminBrands, cohortLabel } from "@/server/admin/overview";

export const dynamic = "force-dynamic";

export default async function AdminBrandsPage() {
  const brands = await loadAdminBrands();
  return (
    <div>
      <h1 className="text-2xl font-semibold">Brands</h1>
      <table className="mt-6 w-full text-left text-sm">
        <thead className="text-slate-500">
          <tr>
            <th className="py-2">品牌</th>
            <th>标签</th>
            <th>行业</th>
            <th>创建时间</th>
            <th>最新扫描</th>
            <th>最新 AI Brand Score</th>
            <th>Report</th>
          </tr>
        </thead>
        <tbody>
          {brands.map((b) => (
            <tr key={b.id} className="border-t border-slate-100">
              <td className="py-2">
                <Link href={`/admin/brands/${b.id}`} className="underline">
                  {b.name}
                </Link>
              </td>
              <td>
                <span className="rounded bg-slate-100 px-2 py-0.5 text-xs">
                  {cohortLabel(b.cohort, b.isCalibration)}
                </span>
              </td>
              <td>{b.industry}</td>
              <td>{b.createdAt.toISOString().slice(0, 10)}</td>
              <td>{b.latestScanAt ? b.latestScanAt.toISOString().slice(0, 10) : "—"}</td>
              <td>{b.score == null ? "—" : b.score.toFixed(1)}</td>
              <td className="space-x-2">
                <Link href={`/brands/${b.id}`} className="underline">
                  查看品牌
                </Link>
                {b.latestScanId ? (
                  <Link href={`/brands/${b.id}/reports/${b.latestScanId}`} className="underline">
                    查看报告
                  </Link>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
