import { ClientReport } from "@/components/ClientReport";
import { loadPublicReport } from "@/server/reports/share";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ shareToken: string }>;
};

export default async function PublicReportPage({ params }: PageProps) {
  const { shareToken } = await params;
  const loaded = await loadPublicReport(shareToken);
  if (!loaded.ok) {
    return (
      <div className="py-16 text-center">
        <h1 className="text-xl font-semibold">此报告链接已失效。</h1>
        <p className="mt-2 text-sm text-slate-600">请联系报告发出方确认是否仍开放分享。</p>
      </div>
    );
  }
  return <ClientReport view={loaded.view} publicView />;
}
