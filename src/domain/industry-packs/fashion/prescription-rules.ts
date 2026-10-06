import type { PrescriptionFacts, PrescriptionItem } from "@/ai/prescriptions/types";
import type { PackPrescriptionRule } from "../types";

function overlayFashionActions(facts: PrescriptionFacts, items: PrescriptionItem[]): PrescriptionItem[] {
  const brandName = facts.brandName;
  const shortName = brandName.replace(/(女装|服饰|服装|品牌)$/u, "");
  const products = facts.coreProducts || "通勤西装、连衣裙、针织、大衣";
  const audience = facts.targetAudience || "目标职业女性";

  return items.map((item) => {
    if (item.category === "brand_facts") {
      return {
        ...item,
        action: `在官网/品牌简介等品牌可控公开页面，用同一套表述写清：品牌名称（含简称「${shortName}」与全称）、公司主体、品牌定位、主要产品、价格带、目标消费者、官方渠道。三处以上页面保持一致，避免各渠道各写一套。`,
      };
    }
    if (item.category === "competitor_gap" && item.title.includes("核心品类")) {
      return {
        ...item,
        action: `在品牌可控渠道建立「${facts.industry || "职业女装"} / 通勤女装」品类主题页，明确写出${brandName}服务的品类边界、代表单品（${products}），并与竞品区隔一句话。不要只发氛围图，要让品类词与品牌名同页共现。`,
      };
    }
    if (item.category === "audience") {
      return {
        ...item,
        action: `在官网/公众号建立「${audience}」说明模块：写清年龄段、生活城市、着装场景，并配套 2～3 篇内容，例如《${audience}如何选择有质感但不过度成熟的通勤装》《一套适合从办公室穿到商务晚餐的通勤搭配》。`,
      };
    }
    if (item.category === "scenario") {
      return {
        ...item,
        action: `首批覆盖 4 个具体场景并做成内容集群：会议、客户拜访、日常办公、出差。每篇同时出现品牌名、场景词、单品名。示例标题：《重要客户会议，职业女性怎样穿得专业但不过度正式》《出差两日只需两套：办公室到晚餐的通勤搭配》。`,
      };
    }
    if (item.title.includes("结构化差异")) {
      return {
        ...item,
        diagnosis: "模型在职业女装回答里默认调用竞争品牌，需要提供可对比的结构化差异，而不是空喊曝光。",
        action: `制作一页「适合谁 / 不适合谁 / 价格带 / 代表场景 / 与常见职业女装品牌的差异」结构化对照（不点名攻击）。把该页放在官网关于我们与商品列表入口。`,
      };
    }
    if (item.category === "structured_information" && item.title.includes("价格带")) {
      return {
        ...item,
        action: `在官网商品/品牌页用固定字段写：价格带（${facts.priceTier || "中高端"}）、代表价位区间、面料、版型、适用季节。不要只在海报里写“品质”。`,
      };
    }
    if (item.category === "hallucination_control") {
      return {
        ...item,
        action: `列出并统一发布“不要猜测”的事实清单：成立时间（若暂不公开则各渠道都不写具体年份）、价格带、面料/工艺、门店数量。删除或修正互相矛盾的旧简介。给客服/电商详情页同一份事实卡。`,
      };
    }
    return item;
  });
}

export const fashionPrescriptionRules: PackPrescriptionRule[] = [
  (facts, items) => overlayFashionActions(facts as PrescriptionFacts, items as PrescriptionItem[]),
];
