import { PageHeader } from "@/components/PageHeader";
import { ModelHealthPanel } from "@/components/ModelHealthPanel";

export const dynamic = "force-dynamic";

export default function AdminModelsPage() {
  return (
    <div>
      <PageHeader
        title="Models"
        description="检查 DeepSeek、Tencent HY、Qwen 是否已配置并可连通。不显示 API Key。"
      />
      <ModelHealthPanel />
    </div>
  );
}
