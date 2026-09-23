import type { QuestionCategory } from "@/domain/industry-packs/types";

export const QUESTION_CATEGORY_META: Record<
  QuestionCategory,
  { order: number; title: string }
> = {
  brand_cognition: { order: 1, title: "01 品牌认知" },
  category_discovery: { order: 2, title: "02 品类发现" },
  audience_scenario: { order: 3, title: "03 人群与场景" },
  competitor_comparison: { order: 4, title: "04 竞品比较" },
  purchase_decision: { order: 5, title: "05 购买决策" },
};

export function categoryTitle(type?: string | null): string {
  if (type && type in QUESTION_CATEGORY_META) {
    return QUESTION_CATEGORY_META[type as QuestionCategory].title;
  }
  return type ?? "其他";
}
