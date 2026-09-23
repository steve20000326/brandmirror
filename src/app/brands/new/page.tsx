import { BrandForm } from "@/components/BrandForm";
import { PageHeader } from "@/components/PageHeader";

export default function NewBrandPage() {
  return (
    <div>
      <PageHeader
        title="新建品牌体检"
        description="告诉BrandMirror你的真实品牌定位，我们才能判断AI是否正确理解了你。"
      />
      <BrandForm />
    </div>
  );
}
