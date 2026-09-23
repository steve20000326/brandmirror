import type {
  PurchaseIntent,
  QuestionCategory,
  QuestionTemplate,
} from "../types";

type TInput = {
  id: string;
  category: QuestionCategory;
  template: string;
  brandPresent: boolean;
  persona?: string;
  scenario?: string;
  purchaseIntent?: PurchaseIntent;
};

function t(input: TInput): QuestionTemplate {
  return input;
}

/** Brand cognition — brandPresent = true (24) */
const brandCognition: QuestionTemplate[] = [
  t({ id: "fc-bc-01", category: "brand_cognition", brandPresent: true, template: "{brand}是什么定位的女装品牌？", purchaseIntent: "low" }),
  t({ id: "fc-bc-02", category: "brand_cognition", brandPresent: true, template: "{brand}主要面向哪些消费人群？", purchaseIntent: "low" }),
  t({ id: "fc-bc-03", category: "brand_cognition", brandPresent: true, template: "{brand}属于什么价格档次？", purchaseIntent: "low" }),
  t({ id: "fc-bc-04", category: "brand_cognition", brandPresent: true, template: "{brand}的主要风格是什么？", purchaseIntent: "low" }),
  t({ id: "fc-bc-05", category: "brand_cognition", brandPresent: true, template: "{brand}比较适合什么年龄段的女性？", purchaseIntent: "low" }),
  t({ id: "fc-bc-06", category: "brand_cognition", brandPresent: true, template: "{brand}有哪些代表性的产品类型？", purchaseIntent: "low" }),
  t({ id: "fc-bc-07", category: "brand_cognition", brandPresent: true, template: "消费者通常为什么选择{brand}？", purchaseIntent: "medium" }),
  t({ id: "fc-bc-08", category: "brand_cognition", brandPresent: true, template: "{brand}和国内哪些女装品牌定位比较接近？", purchaseIntent: "low" }),
  t({ id: "fc-bc-09", category: "brand_cognition", brandPresent: true, template: "{brand}更适合正式商务还是日常通勤？", purchaseIntent: "medium" }),
  t({ id: "fc-bc-10", category: "brand_cognition", brandPresent: true, template: "{brand}在国内女装市场属于什么类型的品牌？", purchaseIntent: "low" }),
  t({ id: "fc-bc-11", category: "brand_cognition", brandPresent: true, template: "第一次听说{brand}，一般会怎么介绍它？", purchaseIntent: "low" }),
  t({ id: "fc-bc-12", category: "brand_cognition", brandPresent: true, template: "{brand}给人的品牌印象通常是怎样的？", purchaseIntent: "low" }),
  t({ id: "fc-bc-13", category: "brand_cognition", brandPresent: true, template: "{brand}的设计风格偏经典还是偏现代？", purchaseIntent: "low" }),
  t({ id: "fc-bc-14", category: "brand_cognition", brandPresent: true, template: "买{brand}的人通常看重什么？", purchaseIntent: "medium" }),
  t({ id: "fc-bc-15", category: "brand_cognition", brandPresent: true, template: "{brand}的{product}口碑怎么样？", purchaseIntent: "medium" }),
  t({ id: "fc-bc-16", category: "brand_cognition", brandPresent: true, template: "{brand}适不适合长期穿去上班？", purchaseIntent: "medium" }),
  t({ id: "fc-bc-17", category: "brand_cognition", brandPresent: true, template: "{brand}在面料和做工上一般是什么水平？", purchaseIntent: "medium" }),
  t({ id: "fc-bc-18", category: "brand_cognition", brandPresent: true, template: "提到{brand}，大家通常会联想到什么穿衣场景？", purchaseIntent: "low" }),
  t({ id: "fc-bc-19", category: "brand_cognition", brandPresent: true, template: "{brand}更偏向成熟职场风，还是更日常休闲？", purchaseIntent: "low" }),
  t({ id: "fc-bc-20", category: "brand_cognition", brandPresent: true, template: "如果朋友想了解{brand}，你会从哪些方面介绍？", purchaseIntent: "low" }),
  t({ id: "fc-bc-21", category: "brand_cognition", brandPresent: true, template: "{brand}的尺码和版型通常适合什么体型？", purchaseIntent: "medium" }),
  t({ id: "fc-bc-22", category: "brand_cognition", brandPresent: true, template: "{brand}在国内女装里算大众品牌还是更小众？", purchaseIntent: "low" }),
  t({ id: "fc-bc-23", category: "brand_cognition", brandPresent: true, template: "{brand}一年四季的产品线大概覆盖哪些品类？", purchaseIntent: "low" }),
  t({ id: "fc-bc-24", category: "brand_cognition", brandPresent: true, template: "网上大家怎么评价{brand}这个品牌？", purchaseIntent: "medium" }),
];

/** Category discovery — brandPresent = false (24) */
const categoryDiscovery: QuestionTemplate[] = [
  t({ id: "fc-cd-01", category: "category_discovery", brandPresent: false, template: "国内有哪些值得关注的中高端女装品牌？", purchaseIntent: "medium" }),
  t({ id: "fc-cd-02", category: "category_discovery", brandPresent: false, template: "适合城市职业女性的国产女装品牌有哪些？", purchaseIntent: "medium" }),
  t({ id: "fc-cd-03", category: "category_discovery", brandPresent: false, template: "有哪些品牌适合日常通勤穿着？", purchaseIntent: "medium" }),
  t({ id: "fc-cd-04", category: "category_discovery", brandPresent: false, template: "想买品质比较好的国产职业女装，有哪些品牌值得考虑？", purchaseIntent: "high" }),
  t({ id: "fc-cd-05", category: "category_discovery", brandPresent: false, template: "国内中高端职业女装有哪些选择？", purchaseIntent: "medium" }),
  t({ id: "fc-cd-06", category: "category_discovery", brandPresent: false, template: "适合30～45岁职业女性的女装品牌有哪些？", purchaseIntent: "medium" }),
  t({ id: "fc-cd-07", category: "category_discovery", brandPresent: false, template: "哪些国产女装品牌比较适合商务通勤？", purchaseIntent: "medium" }),
  t({ id: "fc-cd-08", category: "category_discovery", brandPresent: false, template: "有哪些品牌的女装适合既正式又不过于老气的职场穿搭？", purchaseIntent: "medium" }),
  t({ id: "fc-cd-09", category: "category_discovery", brandPresent: false, template: "国产{priceTier}女装里，大家常提到哪些品牌？", purchaseIntent: "medium" }),
  t({ id: "fc-cd-10", category: "category_discovery", brandPresent: false, template: "想提升职场着装品质，可以从哪些女装品牌开始了解？", purchaseIntent: "medium" }),
  t({ id: "fc-cd-11", category: "category_discovery", brandPresent: false, template: "有没有适合办公室穿着、看起来比较有质感的女装品牌？", purchaseIntent: "medium" }),
  t({ id: "fc-cd-12", category: "category_discovery", brandPresent: false, template: "国内做通勤西装比较受关注的女装品牌有哪些？", purchaseIntent: "medium" }),
  t({ id: "fc-cd-13", category: "category_discovery", brandPresent: false, template: "想找几家风格不太花哨的职业女装品牌，有什么推荐？", purchaseIntent: "medium" }),
  t({ id: "fc-cd-14", category: "category_discovery", brandPresent: false, template: "品质通勤女装，国产品牌里有哪些选择？", purchaseIntent: "medium" }),
  t({ id: "fc-cd-15", category: "category_discovery", brandPresent: false, template: "上班族买连衣裙，可以关注哪些国产女装品牌？", purchaseIntent: "medium" }),
  t({ id: "fc-cd-16", category: "category_discovery", brandPresent: false, template: "有哪些女装品牌适合想穿得专业但不想太刻板的人？", purchaseIntent: "medium" }),
  t({ id: "fc-cd-17", category: "category_discovery", brandPresent: false, template: "国内口碑不错的职场女装品牌有哪些？", purchaseIntent: "medium" }),
  t({ id: "fc-cd-18", category: "category_discovery", brandPresent: false, template: "想入手一件有质感的大衣，国产女装品牌可以看哪些？", purchaseIntent: "high" }),
  t({ id: "fc-cd-19", category: "category_discovery", brandPresent: false, template: "轻商务风格的国产女装，大家常说起哪些品牌？", purchaseIntent: "medium" }),
  t({ id: "fc-cd-20", category: "category_discovery", brandPresent: false, template: "适合都市上班族的女装品牌，能列几个吗？", purchaseIntent: "medium" }),
  t({ id: "fc-cd-21", category: "category_discovery", brandPresent: false, template: "想找做工更扎实一点的国产女装，有哪些方向？", purchaseIntent: "medium" }),
  t({ id: "fc-cd-22", category: "category_discovery", brandPresent: false, template: "职场针织衫和基础款，有哪些女装品牌值得看看？", purchaseIntent: "medium" }),
  t({ id: "fc-cd-23", category: "category_discovery", brandPresent: false, template: "不想买太快时尚的牌子，职业女装可以看哪些品牌？", purchaseIntent: "medium" }),
  t({ id: "fc-cd-24", category: "category_discovery", brandPresent: false, template: "国内适合日常上班穿的女装品牌，有哪些比较常见？", purchaseIntent: "low" }),
];

/** Audience & scenario — mix of brand present / absent (24) */
const audienceScenario: QuestionTemplate[] = [
  // brandPresent = false (16)
  t({ id: "fc-as-01", category: "audience_scenario", brandPresent: false, scenario: "日常通勤", template: "{targetAudience}日常通勤适合选择哪些女装品牌？", purchaseIntent: "medium", persona: "职业女性" }),
  t({ id: "fc-as-02", category: "audience_scenario", brandPresent: false, scenario: "重要商务会议", template: "职业女性参加重要商务会议，有哪些女装品牌值得考虑？", purchaseIntent: "high", persona: "职业女性" }),
  t({ id: "fc-as-03", category: "audience_scenario", brandPresent: false, scenario: "轻商务办公", template: "想穿得有专业感但不过于正式，有什么女装品牌推荐？", purchaseIntent: "medium", persona: "职业女性" }),
  t({ id: "fc-as-04", category: "audience_scenario", brandPresent: false, scenario: "客户拜访", template: "经常需要见客户的职业女性适合哪些国产女装品牌？", purchaseIntent: "high", persona: "职业女性" }),
  t({ id: "fc-as-05", category: "audience_scenario", brandPresent: false, scenario: "秋冬通勤", template: "秋冬上班想买一件有质感的大衣，有哪些品牌值得考虑？", purchaseIntent: "high", persona: "职业女性" }),
  t({ id: "fc-as-06", category: "audience_scenario", brandPresent: false, scenario: "春夏通勤", template: "春夏通勤想穿得清爽又得体，有哪些女装品牌比较合适？", purchaseIntent: "medium", persona: "职业女性" }),
  t({ id: "fc-as-07", category: "audience_scenario", brandPresent: false, scenario: "职场出差", template: "经常出差的职业女性，行李箱里适合带哪些品牌的衣服？", purchaseIntent: "medium", persona: "职业女性" }),
  t({ id: "fc-as-08", category: "audience_scenario", brandPresent: false, scenario: "公司年会", template: "公司年会想穿得正式一点，女装品牌有哪些选择？", purchaseIntent: "high", persona: "职业女性" }),
  t({ id: "fc-as-09", category: "audience_scenario", brandPresent: false, scenario: "商务社交", template: "商务社交场合，有哪些国产女装品牌比较稳妥？", purchaseIntent: "medium", persona: "职业女性" }),
  t({ id: "fc-as-10", category: "audience_scenario", brandPresent: false, scenario: "周末轻商务", template: "周末偶尔有轻商务安排，可以穿哪些品牌的衣服？", purchaseIntent: "low", persona: "职业女性" }),
  t({ id: "fc-as-11", category: "audience_scenario", brandPresent: false, scenario: "管理层工作场景", template: "在管理层岗位上，日常着装可以参考哪些女装品牌？", purchaseIntent: "medium", persona: "管理层女性" }),
  t({ id: "fc-as-12", category: "audience_scenario", brandPresent: false, scenario: "日常通勤", template: "{targetAudience}想找适合上班的{product}，有哪些品牌推荐？", purchaseIntent: "medium", persona: "职业女性" }),
  t({ id: "fc-as-13", category: "audience_scenario", brandPresent: false, scenario: "客户拜访", template: "要去拜访客户，不想穿得太夸张，女装可以看哪些品牌？", purchaseIntent: "high", persona: "职业女性" }),
  t({ id: "fc-as-14", category: "audience_scenario", brandPresent: false, scenario: "重要商务会议", template: "开重要会议那天，想穿得利落一点，有哪些女装品牌合适？", purchaseIntent: "high", persona: "职业女性" }),
  t({ id: "fc-as-15", category: "audience_scenario", brandPresent: false, scenario: "正式活动", template: "参加正式一点的活动，职业女性可以选哪些女装品牌？", purchaseIntent: "high", persona: "职业女性" }),
  t({ id: "fc-as-16", category: "audience_scenario", brandPresent: false, scenario: "轻商务办公", template: "办公室穿着想兼顾舒适和体面，有哪些品牌值得看看？", purchaseIntent: "medium", persona: "职业女性" }),
  // brandPresent = true (8) — selected subset contributes to the 12 brand-present quota
  t({ id: "fc-as-17", category: "audience_scenario", brandPresent: true, scenario: "日常通勤", template: "{brand}适不适合{targetAudience}日常通勤穿着？", purchaseIntent: "medium", persona: "职业女性" }),
  t({ id: "fc-as-18", category: "audience_scenario", brandPresent: true, scenario: "重要商务会议", template: "参加重要商务会议，穿{brand}合适吗？", purchaseIntent: "high", persona: "职业女性" }),
  t({ id: "fc-as-19", category: "audience_scenario", brandPresent: true, scenario: "客户拜访", template: "见客户时穿{brand}会不会显得不够正式？", purchaseIntent: "high", persona: "职业女性" }),
  t({ id: "fc-as-20", category: "audience_scenario", brandPresent: true, scenario: "秋冬通勤", template: "{brand}的秋冬通勤单品适不适合上班穿？", purchaseIntent: "medium", persona: "职业女性" }),
  t({ id: "fc-as-21", category: "audience_scenario", brandPresent: true, scenario: "职场出差", template: "出差几天，带{brand}的衣服方便搭配吗？", purchaseIntent: "medium", persona: "职业女性" }),
  t({ id: "fc-as-22", category: "audience_scenario", brandPresent: true, scenario: "公司年会", template: "公司年会可以考虑{brand}吗？", purchaseIntent: "high", persona: "职业女性" }),
  t({ id: "fc-as-23", category: "audience_scenario", brandPresent: true, scenario: "轻商务办公", template: "{brand}适不适合轻商务办公场景？", purchaseIntent: "medium", persona: "职业女性" }),
  t({ id: "fc-as-24", category: "audience_scenario", brandPresent: true, scenario: "正式活动", template: "正式活动场合穿{brand}合适吗？", purchaseIntent: "high", persona: "职业女性" }),
];

/**
 * Competitor comparison — brandPresent = true when brand is named.
 * Templates without competitor placeholders work when competitors are missing.
 * (24)
 */
const competitorComparison: QuestionTemplate[] = [
  t({ id: "fc-cc-01", category: "competitor_comparison", brandPresent: true, template: "{brand}和{competitor1}在品牌定位上有什么区别？", purchaseIntent: "medium" }),
  t({ id: "fc-cc-02", category: "competitor_comparison", brandPresent: true, template: "{brand}、{competitor1}和{competitor2}分别适合什么消费者？", purchaseIntent: "medium" }),
  t({ id: "fc-cc-03", category: "competitor_comparison", brandPresent: true, template: "如果主要用于商务通勤，{brand}和{competitor1}应该怎么选？", purchaseIntent: "high" }),
  t({ id: "fc-cc-04", category: "competitor_comparison", brandPresent: true, template: "{brand}相比{competitor1}有什么特点？", purchaseIntent: "medium" }),
  t({ id: "fc-cc-05", category: "competitor_comparison", brandPresent: true, template: "{brand}和{competitor1}属于同一个档次的女装品牌吗？", purchaseIntent: "medium" }),
  t({ id: "fc-cc-06", category: "competitor_comparison", brandPresent: true, template: "买通勤女装时，{brand}和{competitor1}该怎么比较？", purchaseIntent: "high" }),
  t({ id: "fc-cc-07", category: "competitor_comparison", brandPresent: true, template: "{brand}和{competitor2}在风格上有什么不同？", purchaseIntent: "medium" }),
  t({ id: "fc-cc-08", category: "competitor_comparison", brandPresent: true, template: "{brand}、{competitor1}、{competitor3}这几个品牌，各自适合什么场合？", purchaseIntent: "medium" }),
  t({ id: "fc-cc-09", category: "competitor_comparison", brandPresent: true, template: "如果预算差不多，{brand}和{competitor1}你会怎么选？", purchaseIntent: "high" }),
  t({ id: "fc-cc-10", category: "competitor_comparison", brandPresent: true, template: "{brand}和{competitor1}谁更适合日常上班穿？", purchaseIntent: "medium" }),
  t({ id: "fc-cc-11", category: "competitor_comparison", brandPresent: true, template: "{brand}跟{competitor2}比，版型和风格差别大吗？", purchaseIntent: "medium" }),
  t({ id: "fc-cc-12", category: "competitor_comparison", brandPresent: true, template: "第一次买职业女装，在{brand}和{competitor1}之间怎么选比较合适？", purchaseIntent: "high" }),
  t({ id: "fc-cc-13", category: "competitor_comparison", brandPresent: true, template: "{brand}和{competitor3}给人的品牌感觉有什么不一样？", purchaseIntent: "low" }),
  t({ id: "fc-cc-14", category: "competitor_comparison", brandPresent: true, template: "同样买{product}，{brand}和{competitor1}有什么差别？", purchaseIntent: "high" }),
  t({ id: "fc-cc-15", category: "competitor_comparison", brandPresent: true, template: "{brand}、{competitor1}和{competitor2}，哪个更偏正式职场风？", purchaseIntent: "medium" }),
  t({ id: "fc-cc-16", category: "competitor_comparison", brandPresent: true, template: "想在{brand}和{competitor2}里选一个，可以从哪些方面比较？", purchaseIntent: "medium" }),
  // Fallback-friendly templates (no competitor placeholders) — used when competitors missing
  t({ id: "fc-cc-17", category: "competitor_comparison", brandPresent: true, template: "{brand}和同档次国产女装品牌比，定位有什么不同？", purchaseIntent: "medium" }),
  t({ id: "fc-cc-18", category: "competitor_comparison", brandPresent: true, template: "买职业女装时，{brand}通常会和哪些品牌被放在一起比较？", purchaseIntent: "medium" }),
  t({ id: "fc-cc-19", category: "competitor_comparison", brandPresent: true, template: "{brand}在同类通勤女装里，风格算偏保守还是偏现代？", purchaseIntent: "low" }),
  t({ id: "fc-cc-20", category: "competitor_comparison", brandPresent: true, template: "如果只做商务通勤，{brand}和市面上常见职业女装品牌比怎么样？", purchaseIntent: "high" }),
  t({ id: "fc-cc-21", category: "competitor_comparison", brandPresent: true, template: "{brand}和国内其他{priceTier}女装相比，有什么差异？", purchaseIntent: "medium" }),
  t({ id: "fc-cc-22", category: "competitor_comparison", brandPresent: true, template: "消费者在挑选职业女装时，通常会拿{brand}跟哪些品牌对比？", purchaseIntent: "medium" }),
  t({ id: "fc-cc-23", category: "competitor_comparison", brandPresent: true, template: "{brand}放在国产职业女装里，属于什么位置？", purchaseIntent: "low" }),
  t({ id: "fc-cc-24", category: "competitor_comparison", brandPresent: true, template: "和常见的通勤女装品牌比，{brand}更适合什么人？", purchaseIntent: "medium" }),
];

/** Purchase decision — brandPresent = false (24) */
const purchaseDecision: QuestionTemplate[] = [
  t({ id: "fc-pd-01", category: "purchase_decision", brandPresent: false, template: "愿意花中高档预算买一套通勤女装，有哪些品牌值得考虑？", purchaseIntent: "high" }),
  t({ id: "fc-pd-02", category: "purchase_decision", brandPresent: false, template: "想买一件品质较好的职场西装，有哪些国产品牌推荐？", purchaseIntent: "high" }),
  t({ id: "fc-pd-03", category: "purchase_decision", brandPresent: false, template: "35岁职业女性买通勤连衣裙，有哪些品牌比较合适？", purchaseIntent: "high" }),
  t({ id: "fc-pd-04", category: "purchase_decision", brandPresent: false, template: "预算中高档，希望衣服耐穿、有质感，有哪些女装品牌值得看看？", purchaseIntent: "high" }),
  t({ id: "fc-pd-05", category: "purchase_decision", brandPresent: false, template: "第一次购买国产中高端职业女装，可以从哪些品牌开始了解？", purchaseIntent: "high" }),
  t({ id: "fc-pd-06", category: "purchase_decision", brandPresent: false, template: "想买一件能穿好几年的大衣，国产女装品牌有哪些选择？", purchaseIntent: "high" }),
  t({ id: "fc-pd-07", category: "purchase_decision", brandPresent: false, template: "准备添置几件上班常穿的基础款，可以看哪些品牌？", purchaseIntent: "high" }),
  t({ id: "fc-pd-08", category: "purchase_decision", brandPresent: false, template: "想入手一套得体的面试/入职穿搭，女装品牌怎么选？", purchaseIntent: "high" }),
  t({ id: "fc-pd-09", category: "purchase_decision", brandPresent: false, template: "买{product}的话，{priceTier}档次有哪些品牌比较靠谱？", purchaseIntent: "high" }),
  t({ id: "fc-pd-10", category: "purchase_decision", brandPresent: false, template: "不想买到很快过时的衣服，职业女装可以关注哪些品牌？", purchaseIntent: "medium" }),
  t({ id: "fc-pd-11", category: "purchase_decision", brandPresent: false, template: "想在中高档里找更耐穿、有质感的通勤女装，怎么选品牌？", purchaseIntent: "high" }),
  t({ id: "fc-pd-12", category: "purchase_decision", brandPresent: false, template: "打算换一批办公室常穿的衣服，有哪些品牌值得先看看？", purchaseIntent: "high" }),
  t({ id: "fc-pd-13", category: "purchase_decision", brandPresent: false, template: "想买针织衫和基础衬衫搭着上班穿，有哪些品牌推荐？", purchaseIntent: "high" }),
  t({ id: "fc-pd-14", category: "purchase_decision", brandPresent: false, template: "如果一年只重点买几件通勤单品，品牌应该怎么挑？", purchaseIntent: "medium" }),
  t({ id: "fc-pd-15", category: "purchase_decision", brandPresent: false, template: "希望衣服洗了不容易变形，职业女装可以看哪些品牌？", purchaseIntent: "high" }),
  t({ id: "fc-pd-16", category: "purchase_decision", brandPresent: false, template: "给自己置办一套商务一点的穿搭，国产中高端女装可以优先了解哪些品牌？", purchaseIntent: "high" }),
  t({ id: "fc-pd-17", category: "purchase_decision", brandPresent: false, template: "秋冬想买一条能上班穿的裙子，有哪些品牌比较合适？", purchaseIntent: "high" }),
  t({ id: "fc-pd-18", category: "purchase_decision", brandPresent: false, template: "想控制在{priceTier}预算内买通勤装，品牌怎么筛？", purchaseIntent: "high" }),
  t({ id: "fc-pd-19", category: "purchase_decision", brandPresent: false, template: "第一次线下逛职业女装店，可以优先看哪些品牌？", purchaseIntent: "medium" }),
  t({ id: "fc-pd-20", category: "purchase_decision", brandPresent: false, template: "想买一件不太挑身材的通勤外套，有哪些品牌值得试？", purchaseIntent: "high" }),
  t({ id: "fc-pd-21", category: "purchase_decision", brandPresent: false, template: "日常上班和偶尔见客户都要穿，女装品牌怎么选比较省心？", purchaseIntent: "high" }),
  t({ id: "fc-pd-22", category: "purchase_decision", brandPresent: false, template: "准备给衣橱补几件耐穿的基础款，国产女装看哪些？", purchaseIntent: "medium" }),
  t({ id: "fc-pd-23", category: "purchase_decision", brandPresent: false, template: "想买{product}用于上班，价格和品质怎么平衡比较好？", purchaseIntent: "high" }),
  t({ id: "fc-pd-24", category: "purchase_decision", brandPresent: false, template: "如果只想先试一两件看看版型，职业女装品牌可以怎么选？", purchaseIntent: "medium" }),
];

export const FASHION_QUESTION_BANK: QuestionTemplate[] = [
  ...brandCognition,
  ...categoryDiscovery,
  ...audienceScenario,
  ...competitorComparison,
  ...purchaseDecision,
];

export function countByCategory(templates: QuestionTemplate[]): Record<QuestionCategory, number> {
  const counts: Record<QuestionCategory, number> = {
    brand_cognition: 0,
    category_discovery: 0,
    audience_scenario: 0,
    competitor_comparison: 0,
    purchase_decision: 0,
  };
  for (const item of templates) {
    counts[item.category] += 1;
  }
  return counts;
}
