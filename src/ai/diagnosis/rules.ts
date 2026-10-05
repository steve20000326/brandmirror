import type { BrandPortrait } from "@/ai/profile/types";
import { NO_STABLE_COGNITION } from "@/ai/profile/types";
import type { GeoMetrics } from "@/server/analysis/metrics";
import { DIAGNOSIS_ENGINE_VERSION, type DiagnosisCode, type DiagnosisItem } from "./types";

export type DiagnosisFacts = {
  brandName: string;
  metrics: GeoMetrics;
  portrait: BrandPortrait;
  absentQuestionCount: number;
  absentMentionCount: number;
  presentQuestionCount: number;
  recommendedOnAbsent: number;
  desiredAudience: string | null;
  desiredPositioning: string | null;
  desiredPriceTier: string | null;
};

function overlap(a: string, b: string): boolean {
  const na = a.replace(/\s/g, "");
  const nb = b.replace(/\s/g, "");
  return na.includes(nb) || nb.includes(na);
}

export function detectDiagnoses(facts: DiagnosisFacts): DiagnosisItem[] {
  const { metrics, portrait, brandName } = facts;
  const items: DiagnosisItem[] = [];

  if (metrics.awareness < 30) {
    items.push({
      code: "LOW_AWARENESS",
      severity: metrics.awareness < 15 ? "high" : "medium",
      title: "即使直接询问品牌，AI 也没有形成稳定认知",
      finding: `在 ${facts.presentQuestionCount} 条品牌相关提问中，Awareness 仅为 ${metrics.awareness}。即使直接问到「${brandName}」，模型也缺少有依据的品牌认知。`,
      evidence: [
        `品牌相关提问 ${facts.presentQuestionCount} 条，Awareness = ${metrics.awareness}。`,
        `DeepSeek / Hy3 / Qwen 认知度分别为 ${metrics.byProvider.deepseek?.awareness ?? 0} / ${metrics.byProvider["tencent-hy"]?.awareness ?? 0} / ${metrics.byProvider.qwen?.awareness ?? 0}。`,
      ],
      businessMeaning: "品牌还没有进入模型可核验的品牌知识集合，直接询问也很难得到稳定描述。",
      confidence: 0.9,
    });
  }

  if (metrics.discovery < 20) {
    items.push({
      code: "LOW_DISCOVERY",
      severity: "high",
      title: "消费者未点名时，AI 很少自然想到该品牌",
      finding: `在消费者没有主动提及品牌时，AI 很少自然想到${brandName}。Discovery Score = ${metrics.discovery}。`,
      evidence: [
        `${facts.absentQuestionCount} 条无品牌问题中，品牌出现 ${facts.absentMentionCount} 次。`,
        `Discovery Score = ${metrics.discovery}（阈值 20）。`,
      ],
      businessMeaning: "品牌尚未进入 AI 的自然品牌候选集，品类提问几乎不会被想起。",
      confidence: 0.95,
    });
  }

  if (metrics.recommendation < 20) {
    items.push({
      code: "LOW_RECOMMENDATION",
      severity: metrics.recommendation < 10 ? "high" : "medium",
      title: "品牌很少进入明确推荐位置",
      finding: `即使偶尔被提及，品牌也很少进入明确推荐。Recommendation Score = ${metrics.recommendation}。`,
      evidence: [
        `${facts.absentQuestionCount} 条无品牌问题中，明确推荐 ${facts.recommendedOnAbsent} 次。`,
        `Recommendation Score = ${metrics.recommendation}。`,
      ],
      businessMeaning: "在购买与场景提问中，品牌几乎不会被当作可推荐选项。",
      confidence: 0.9,
    });
  }

  if (metrics.alignment < 20 && metrics.awareness >= 20) {
    items.push({
      code: "LOW_ALIGNMENT",
      severity: "medium",
      title: "AI 描述与品牌期望资料不一致",
      finding: `Alignment Score = ${metrics.alignment}，模型对品牌的描述与品牌提交资料重合有限。`,
      evidence: [`Alignment Score = ${metrics.alignment}（在已有一定认知的前提下）。`],
      businessMeaning: "公开品牌信号与模型理解之间存在偏差，需要先核对事实源再谈心智优化。",
      confidence: 0.7,
    });
  }

  const points = metrics.competitorPoints;
  if (points.brand <= 0 && points.leaderPoints > 0 && points.leader) {
    const leaderPts = points.competitors[points.leader] ?? points.leaderPoints;
    items.push({
      code: "COMPETITOR_DOMINATED",
      severity: "high",
      title: "竞争品牌占据主要品类回答",
      finding: `无品牌提问中，${brandName} 得分为 0，而 ${points.leader} 等竞争品牌占据主要推荐位置。`,
      evidence: [
        `${brandName} 竞品分点 = ${points.brand}。`,
        `${points.leader} 分点 = ${leaderPts}。`,
        `其他竞品分点：${Object.entries(points.competitors)
          .map(([n, p]) => `${n} ${Math.round(p * 10) / 10}`)
          .join("；")}。`,
      ],
      businessMeaning: "在职业女装/通勤场景中，模型的默认候选集已被竞争品牌占据。",
      confidence: 0.9,
    });
  }

  const h = [
    metrics.byProvider.deepseek?.hallucinationRisk ?? 0,
    metrics.byProvider["tencent-hy"]?.hallucinationRisk ?? 0,
    metrics.byProvider.qwen?.hallucinationRisk ?? 0,
  ];
  const spread = Math.max(...h) - Math.min(...h);
  if (portrait.modelDisagreements.length > 0 || spread >= 10) {
    items.push({
      code: "MODEL_DISAGREEMENT",
      severity: spread >= 15 ? "medium" : "low",
      title: "不同模型对品牌的判断不一致",
      finding: "品牌公开信息在 AI 生态中缺乏一致性，模型之间出现明显分裂。",
      evidence: [
        `幻觉风险 DeepSeek ${h[0]} / Hy3 ${h[1]} / Qwen ${h[2]}。`,
        ...portrait.modelDisagreements.map(
          (d) =>
            `${d.dimension}：${d.views.map((v) => `${v.provider}=${v.value}`).join("，")}`,
        ),
      ],
      businessMeaning: "缺少统一、可被各模型读取的品牌事实源，导致模型各自补全。",
      confidence: 0.75,
    });
  }

  if (metrics.hallucinationRisk >= 10 || Math.max(...h) >= 10) {
    items.push({
      code: "HALLUCINATION_RISK",
      severity: metrics.hallucinationRisk >= 30 ? "high" : "medium",
      title: "部分模型正在补全缺失信息",
      finding:
        "部分模型正在补全缺失信息，存在生成未经品牌资料支持描述的风险。这不是“品牌官方信息错误”，而是模型在资料不足时自行补全。",
      evidence: [
        `Overall Hallucination Risk = ${metrics.hallucinationRisk}。`,
        `Qwen = ${metrics.byProvider.qwen?.hallucinationRisk ?? 0}，DeepSeek = ${metrics.byProvider.deepseek?.hallucinationRisk ?? 0}，Hy3 = ${metrics.byProvider["tencent-hy"]?.hallucinationRisk ?? 0}。`,
      ],
      businessMeaning: "应优先建立清晰、一致的品牌事实页，而不是先做大量心智广告。",
      confidence: 0.85,
    });
  }

  if (
    portrait.hasStableCognition &&
    facts.desiredPositioning &&
    portrait.style.primary.length > 0 &&
    !portrait.style.primary.some((s) => overlap(s.label, facts.desiredPositioning!))
  ) {
    items.push({
      code: "POSITIONING_GAP",
      severity: "medium",
      title: "AI 风格认知与品牌期望定位不一致",
      finding: `品牌希望「${facts.desiredPositioning}」，AI 高频认知为「${portrait.style.primary.map((s) => s.label).join("、")}」。`,
      evidence: portrait.style.primary.map(
        (s) => `${s.label}（evidenceCount=${s.evidenceCount}，providers=${s.providers.join(",")}）`,
      ),
      businessMeaning: "公开内容可能强化了与期望不符的风格标签。",
      confidence: 0.7,
    });
  }

  if (
    portrait.hasStableCognition &&
    facts.desiredAudience &&
    portrait.audience.summary !== NO_STABLE_COGNITION &&
    !overlap(portrait.audience.summary, facts.desiredAudience)
  ) {
    items.push({
      code: "AUDIENCE_GAP",
      severity: "medium",
      title: "AI 理解的人群与品牌目标消费者不一致",
      finding: `品牌希望「${facts.desiredAudience}」，AI 实际「${portrait.audience.summary}」。`,
      evidence: [
        `AI 人群：${portrait.audience.summary}（evidenceCount=${portrait.audience.evidenceCount}）。`,
      ],
      businessMeaning: "人群错位会让推荐出现在错误的消费场景。",
      confidence: 0.7,
    });
  }

  if (portrait.hasStableCognition && portrait.scenarios.weak.length > 0 && portrait.scenarios.strong.length > 0) {
    items.push({
      code: "SCENARIO_GAP",
      severity: "medium",
      title: "AI 想到品牌的场景与品牌希望争夺的场景不一致",
      finding: `AI 较强场景：${portrait.scenarios.strong.map((s) => s.label).join("、")}；较少想到：${portrait.scenarios.weak.map((s) => s.label).join("、")}。`,
      evidence: [
        `强场景 ${portrait.scenarios.strong.length} 个，弱场景 ${portrait.scenarios.weak.length} 个。`,
      ],
      businessMeaning: "需要在目标场景中建立可被模型读取的品牌-场景绑定。",
      confidence: 0.65,
    });
  }

  return items.sort((a, b) => severityRank(a.severity) - severityRank(b.severity) || b.confidence - a.confidence);
}

function severityRank(s: DiagnosisItem["severity"]): number {
  return s === "high" ? 0 : s === "medium" ? 1 : 2;
}

export const ENGINE_VERSION = DIAGNOSIS_ENGINE_VERSION;

export function topDiagnoses(items: DiagnosisItem[], limit = 5): DiagnosisItem[] {
  const order: DiagnosisCode[] = [
    "LOW_AWARENESS",
    "LOW_DISCOVERY",
    "LOW_RECOMMENDATION",
    "COMPETITOR_DOMINATED",
    "HALLUCINATION_RISK",
    "MODEL_DISAGREEMENT",
    "LOW_ALIGNMENT",
    "POSITIONING_GAP",
    "AUDIENCE_GAP",
    "SCENARIO_GAP",
  ];
  return [...items]
    .sort((a, b) => {
      const sev = severityRank(a.severity) - severityRank(b.severity);
      if (sev !== 0) return sev;
      return order.indexOf(a.code) - order.indexOf(b.code);
    })
    .slice(0, limit);
}

export function hasCode(items: DiagnosisItem[], code: DiagnosisCode): boolean {
  return items.some((d) => d.code === code);
}
