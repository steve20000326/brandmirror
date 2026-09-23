import type { QuestionCategory } from "../types";

export const FASHION_PACK_ID = "fashion";
export const FASHION_PACK_VERSION = "fashion-v0.1";
export const FASHION_PACK_LABEL = "Fashion v0.1";

/** Fixed 30-question mix for Fashion Pack v0.1 */
export const FASHION_PLAN_QUOTA: Record<QuestionCategory, number> = {
  brand_cognition: 5,
  category_discovery: 8,
  audience_scenario: 7,
  competitor_comparison: 5,
  purchase_decision: 5,
};

/** Audience-scenario mix: 2 with brand name + 5 without → overall 12/18 */
export const AUDIENCE_SCENARIO_BRAND_PRESENT_COUNT = 2;
export const AUDIENCE_SCENARIO_BRAND_ABSENT_COUNT = 5;

export const FASHION_SCENARIOS = [
  "日常通勤",
  "重要商务会议",
  "客户拜访",
  "商务社交",
  "轻商务办公",
  "正式活动",
  "职场出差",
  "秋冬通勤",
  "春夏通勤",
  "周末轻商务",
  "公司年会",
  "管理层工作场景",
] as const;

export const FASHION_FALLBACKS = {
  targetAudience: "城市职业女性",
  priceTier: "中高端",
  product: "通勤女装",
  competitor: "同类女装品牌",
} as const;
