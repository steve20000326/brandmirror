import { PageHeader } from "@/components/PageHeader";
import { ModelHealthPanel } from "@/components/ModelHealthPanel";

export const dynamic = "force-dynamic";

export default function AdminModelsPage() {
  return (
    <div>
      <PageHeader
        title="模型连接"
        description="检查 DeepSeek、Tencent HY、Qwen 是否已配置并可连通。本次为模型 API 基线，不等同于消费者 App。"
      />
      <ModelHealthPanel />
    </div>
  );
}
