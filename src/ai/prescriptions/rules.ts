import type { DiagnosisItem } from "@/ai/diagnosis/types";
import type { BrandPortrait } from "@/ai/profile/types";
import type { GeoMetrics } from "@/server/analysis/metrics";
import { PRESCRIPTION_ENGINE_VERSION, type PrescriptionItem } from "./types";

export type PrescriptionFacts = {
  brandName: string;
  industry: string;
  targetAudience: string | null;
  priceTier: string | null;
  desiredPositioning: string | null;
  coreProducts: string | null;
  metrics: GeoMetrics;
  portrait: BrandPortrait;
  diagnoses: DiagnosisItem[];
};

const GENERIC_BANNED = [
  "加强品牌建设",
  "提高品牌曝光",
  "增加优质内容",
  "提高品牌知名度",
  "做好SEO",
  "做好 SEO",
  "加强社交媒体运营",
  "优化年轻化认知",
];

const EFFECT =
  "建议优先补强这些公开品牌信号，并在下一轮监测中观察 AI 认知是否发生变化。";

function has(diagnoses: DiagnosisItem[], code: string) {
  return diagnoses.some((d) => d.code === code);
}

function evidenceOf(diagnoses: DiagnosisItem[], code: string): string {
  return diagnoses.find((d) => d.code === code)?.evidence.join(" ") ?? "";
}

export function draftPrescriptions(facts: PrescriptionFacts): PrescriptionItem[] {
  const { brandName, diagnoses, metrics, portrait } = facts;
  const lowCognition =
    has(diagnoses, "LOW_AWARENESS") && has(diagnoses, "LOW_DISCOVERY") && !portrait.hasStableCognition;

  const drafts: PrescriptionItem[] = [];

  if (has(diagnoses, "LOW_AWARENESS") || has(diagnoses, "HALLUCINATION_RISK") || lowCognition) {
    drafts.push({
      priority: 0,
      title: "建立统一、可核验的基础品牌事实源",
      category: "brand_facts",
      evidence: evidenceOf(diagnoses, "LOW_AWARENESS") || evidenceOf(diagnoses, "HALLUCINATION_RISK"),
      diagnosis: lowCognition
        ? "当前最主要问题不是“定位错了”，而是 AI 基本没有形成品牌认知。"
        : "模型缺少可引用的品牌事实，才会在被问及时表示未知或自行补全。",
      action: `在官网/品牌简介等品牌可控公开页面，用同一套表述写清：品牌名称（含简称「${brandName.replace(/(女装|服饰|服装|品牌)$/u, "")}」与全称）、公司主体、品牌定位、主要产品、价格带、目标消费者、官方渠道。三处以上页面保持一致，避免各渠道各写一套。`,
      expectedEffect: EFFECT,
      difficulty: "low",
      timeHorizon: "short",
      evidenceSource: "model_observation",
    });
  }

  if (has(diagnoses, "LOW_DISCOVERY") || has(diagnoses, "LOW_RECOMMENDATION")) {
    drafts.push({
      priority: 0,
      title: "建立品牌与核心品类的公开关联",
      category: "competitor_gap",
      evidence:
        evidenceOf(diagnoses, "LOW_DISCOVERY") ||
        evidenceOf(diagnoses, "COMPETITOR_DOMINATED") ||
        `${facts.metrics.discovery} discovery / ${facts.metrics.recommendation} recommendation`,
      diagnosis: "无品牌品类提问中品牌几乎不被想起，说明模型没有把品牌放进该品类候选集。",
      action: `在品牌可控渠道建立「${facts.industry || "职业女装"} / 通勤女装」品类主题页，明确写出${brandName}服务的品类边界、代表单品（${facts.coreProducts || "通勤西装、连衣裙、针织、大衣"}），并与竞品区隔一句话。不要只发氛围图，要让品类词与品牌名同页共现。`,
      expectedEffect: EFFECT,
      difficulty: "medium",
      timeHorizon: "short",
      evidenceSource: "competitor_gap",
    });
  }

  drafts.push({
    priority: 0,
    title: "建立品牌与目标消费者的可读取关联",
    category: "audience",
    evidence: `品牌资料目标消费者：${facts.targetAudience || "未填写"}。AI 人群认知：${portrait.audience.summary}。`,
    diagnosis: lowCognition
      ? "AI 尚未形成人群画像；需要先让模型“知道这是谁的品牌”，而不是优化既有人群心智。"
      : "目标人群与 AI 认知需要被公开资料对齐。",
    action: `在官网/公众号建立「${facts.targetAudience || "目标职业女性"}」说明模块：写清年龄段、生活城市、着装场景，并配套 2～3 篇内容，例如《${facts.targetAudience || "职业女性"}如何选择有质感但不过度成熟的通勤装》《一套适合从办公室穿到商务晚餐的通勤搭配》。`,
    expectedEffect: EFFECT,
    difficulty: "medium",
    timeHorizon: "short",
    evidenceSource: "brand_profile",
  });

  drafts.push({
    priority: 0,
    title: "把品牌绑到具体高价值使用场景",
    category: "scenario",
    evidence: has(diagnoses, "LOW_DISCOVERY")
      ? evidenceOf(diagnoses, "LOW_DISCOVERY")
      : "无品牌场景题中品牌未被自然提及。",
    diagnosis: "模型目前不会在具体消费场景中检索到该品牌。",
    action: `首批覆盖 4 个具体场景并做成内容集群：会议、客户拜访、日常办公、出差。每篇同时出现品牌名、场景词、单品名。示例标题：《重要客户会议，职业女性怎样穿得专业但不过度正式》《出差两日只需两套：办公室到晚餐的通勤搭配》。`,
    expectedEffect: EFFECT,
    difficulty: "medium",
    timeHorizon: "medium",
    evidenceSource: "model_observation",
  });

  drafts.push({
    priority: 0,
    title: "补充可被模型引用的第三方品牌信号",
    category: "third_party",
    evidence: `无品牌提问中品牌提及 ${metrics.competitorPoints.brand} 分；${metrics.competitorPoints.leader ?? "竞品"} 为 ${metrics.competitorPoints.leaderPoints} 分。`,
    diagnosis: "模型候选集大量来自第三方常见品牌共现，而非品牌自说自话。",
    action: `优先争取 2～3 个可被公开索引的第三方条目：行业媒体品牌介绍、电商官方旗舰店完整品牌故事、百科/名录类资料（仅写已核实事实）。每条都包含全称、简称、品类、价格带，避免只放海报。`,
    expectedEffect: EFFECT,
    difficulty: "high",
    timeHorizon: "medium",
    evidenceSource: "competitor_gap",
  });

  if (has(diagnoses, "HALLUCINATION_RISK")) {
    drafts.push({
      priority: 0,
      title: "用事实页约束模型未经支持的信息补全",
      category: "hallucination_control",
      evidence: evidenceOf(diagnoses, "HALLUCINATION_RISK"),
      diagnosis:
        "部分模型正在补全缺失信息，存在生成未经品牌资料支持描述的风险。优先动作不是继续发情绪向内容。",
      action: `列出并统一发布“不要猜测”的事实清单：成立时间（若暂不公开则各渠道都不写具体年份）、价格带、面料/工艺、门店数量。删除或修正互相矛盾的旧简介。给客服/电商详情页同一份事实卡。`,
      expectedEffect: EFFECT,
      difficulty: "low",
      timeHorizon: "short",
      evidenceSource: "model_observation",
    });
  }

  if (has(diagnoses, "COMPETITOR_DOMINATED")) {
    drafts.push({
      priority: 0,
      title: "在竞品高频场景做可对比的结构化差异说明",
      category: "structured_information",
      evidence: evidenceOf(diagnoses, "COMPETITOR_DOMINATED"),
      diagnosis: "模型在职业女装回答里默认调用竞争品牌，需要提供可对比的结构化差异，而不是空喊曝光。",
      action: `制作一页「适合谁 / 不适合谁 / 价格带 / 代表场景 / 与常见职业女装品牌的差异」结构化对照（不点名攻击）。把该页放在官网关于我们与商品列表入口。`,
      expectedEffect: EFFECT,
      difficulty: "medium",
      timeHorizon: "short",
      evidenceSource: "competitor_gap",
    });
  }

  if (has(diagnoses, "POSITIONING_GAP") && portrait.hasStableCognition) {
    drafts.push({
      priority: 0,
      title: "校正公开定位用语，减少风格错位",
      category: "positioning",
      evidence: evidenceOf(diagnoses, "POSITIONING_GAP"),
      diagnosis: "AI 已形成与期望不符的风格标签，需要改公开用语而非先做年轻化口号。",
      action: `盘点官网与主视觉中的风格词，把与期望「${facts.desiredPositioning ?? ""}」冲突的高频词替换为统一口径，并各写 2 篇场景稿示范正确风格。`,
      expectedEffect: EFFECT,
      difficulty: "medium",
      timeHorizon: "medium",
      evidenceSource: "brand_profile",
    });
  }

  drafts.push({
    priority: 0,
    title: "用结构化字段标注价格带与产品信息",
    category: "structured_information",
    evidence: `价格带资料：${facts.priceTier ?? "未填写"}；AI 价格认知：${portrait.priceTier.summary}。`,
    diagnosis: "缺少结构化价格与产品字段时，模型更容易省略品牌或随意补价格。",
    action: `在官网商品/品牌页用固定字段写：价格带（${facts.priceTier || "中高端"}）、代表价位区间、面料、版型、适用季节。不要只在海报里写“品质”。`,
    expectedEffect: EFFECT,
    difficulty: "low",
    timeHorizon: "short",
    evidenceSource: "brand_profile",
  });

  const ranked = rankPrescriptions(drafts, { lowCognition, diagnoses }).slice(0, 10);
  const bounded = ranked.length < 5 ? drafts.slice(0, 5) : ranked;
  return bounded.map((item, i) => ({ ...item, priority: i + 1 }));
}

function rankPrescriptions(
  items: PrescriptionItem[],
  ctx: { lowCognition: boolean; diagnoses: DiagnosisItem[] },
): PrescriptionItem[] {
  const order = ctx.lowCognition
    ? [
        "brand_facts",
        "competitor_gap",
        "audience",
        "scenario",
        "third_party",
        "hallucination_control",
        "structured_information",
        "authority",
        "content",
        "positioning",
      ]
    : [
        "hallucination_control",
        "brand_facts",
        "competitor_gap",
        "positioning",
        "audience",
        "scenario",
        "structured_information",
        "third_party",
        "content",
        "authority",
      ];
  const seen = new Set<string>();
  const unique: PrescriptionItem[] = [];
  for (const item of items) {
    const key = item.category + item.title;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(item);
  }
  return unique.sort((a, b) => order.indexOf(a.category) - order.indexOf(b.category));
}

export function assertPrescriptionQuality(items: PrescriptionItem[]) {
  if (items.length < 5 || items.length > 10) {
    throw new Error(`prescription count must be 5-10, got ${items.length}`);
  }
  for (const item of items) {
    if (!item.evidence.trim() || !item.diagnosis.trim() || !item.action.trim()) {
      throw new Error("each prescription needs evidence, diagnosis, action");
    }
    for (const banned of GENERIC_BANNED) {
      if (item.title.includes(banned) || (item.action === banned)) {
        throw new Error(`generic prescription: ${banned}`);
      }
    }
    if (/一定(会|能)推荐|保证排名|DeepSeek一定会/.test(item.action + item.expectedEffect)) {
      throw new Error("must not promise model ranking");
    }
  }
}

export { PRESCRIPTION_ENGINE_VERSION };
