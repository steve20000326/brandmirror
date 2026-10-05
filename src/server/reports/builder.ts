import type { BrandPortrait } from "@/ai/profile/types";
import { NO_STABLE_COGNITION } from "@/ai/profile/types";
import { CONSUMER_BASELINE_PROMPT_VERSION } from "@/ai/prompts/consumer-baseline";
import { FASHION_PACK_VERSION } from "@/domain/industry-packs/fashion";
import type { GeoMetrics } from "@/server/analysis/metrics";
import { PROVIDER_MODEL_LABELS } from "@/server/scans/types";
import { detectBrandMirrorStage } from "./stage";
import {
  REPORT_DISCLAIMER,
  type ClientDiagnosis,
  type ClientPrescription,
  type ClientProfileField,
  type ClientReportViewModel,
  type CognitionLevel,
} from "./types";

const DIAGNOSIS_TITLES: Record<string, string> = {
  LOW_AWARENESS: "即使直接询问，AI也缺少稳定的品牌认知",
  LOW_DISCOVERY: "AI几乎不会主动想到你的品牌",
  LOW_RECOMMENDATION: "品牌很少进入明确推荐位置",
  LOW_ALIGNMENT: "AI描述与品牌期望不完全一致",
  COMPETITOR_DOMINATED: "竞争品牌已经占据主要推荐位置",
  MODEL_DISAGREEMENT: "不同模型对品牌的判断不一致",
  HALLUCINATION_RISK: "部分模型会在信息不足时自行补全",
  POSITIONING_GAP: "AI理解的风格与品牌期望存在偏差",
  AUDIENCE_GAP: "AI理解的人群与品牌目标不一致",
  SCENARIO_GAP: "AI想到品牌的场景与期望场景不一致",
};

function severityLabel(severity: string): string {
  if (severity === "high") return "优先处理";
  if (severity === "medium") return "值得关注";
  return "持续观察";
}

function difficultyLabel(value: string | null): string {
  if (value === "low") return "低";
  if (value === "high") return "高";
  return "中";
}

function timeHorizonLabel(value: string | null): string {
  if (value === "short") return "1～2周";
  if (value === "long") return "持续";
  return "1个月";
}

export function cognitionLevel(confidence: number, evidenceCount = 0): CognitionLevel {
  if (evidenceCount <= 0 && confidence < 0.4) return "暂无稳定认知";
  if (confidence >= 0.7) return "稳定认知";
  if (confidence >= 0.4) return "初步认知";
  return "暂无稳定认知";
}

export function getReportStatus(input: {
  portraitJson: string | null;
  diagnosisCount: number;
  prescriptionCount: number;
  analysisStatus: string;
}): "ready" | "incomplete" {
  if (input.analysisStatus !== "completed" && input.analysisStatus !== "partial") {
    return "incomplete";
  }
  if (!input.portraitJson) return "incomplete";
  if (input.diagnosisCount < 1) return "incomplete";
  if (input.prescriptionCount < 5) return "incomplete";
  return "ready";
}

function clampSummary(text: string): string {
  return text.trim();
}

export function buildExecutiveSummary(params: {
  brandName: string;
  stored: string | null;
  stageId: string;
  absentCount: number;
  absentMentions: number;
  hallucinationRisk: number;
}): string {
  if (params.stageId === "A") {
    const extra =
      params.hallucinationRisk >= 10
        ? "，同时部分模型会在信息不足时自行补全未经品牌资料支持的信息。"
        : "。";
    return `当前主流AI尚未形成稳定的${params.brandName}品牌认知。在消费者未主动提及品牌的${params.absentCount}次测试中，品牌${params.absentMentions === 0 ? "一次也没有自然进入推荐结果" : `仅出现${params.absentMentions}次`}${extra}`;
  }
  if (params.stored && params.stored.trim()) return params.stored.trim();
  return `当前测试显示，AI对${params.brandName}的认知仍不稳定，需要结合成绩单与处方优先处理公开品牌信号。`;
}

function field(
  label: string,
  value: string | null | undefined,
  confidence: number,
  evidenceCount: number,
): ClientProfileField {
  const level = cognitionLevel(confidence, evidenceCount);
  if (level === "暂无稳定认知" || !value || value === NO_STABLE_COGNITION) {
    return { label, value: "暂无稳定认知", level: "暂无稳定认知" };
  }
  return { label, value, level };
}

export function buildClientReportViewModel(input: {
  brand: {
    name: string;
    industry: string;
    isCalibration: boolean;
    targetAudience: string | null;
    priceTier: string | null;
    desiredPositioning: string | null;
    coreProducts: string | null;
  };
  testedAt: string;
  questionCount: number;
  observationCount: number;
  unbrandedQuestionCount: number;
  brandedQuestionCount: number;
  absentObservationCount: number;
  analysisStatus: string;
  metrics: GeoMetrics;
  portrait: BrandPortrait | null;
  summary: string | null;
  diagnoses: Array<{
    code: string;
    severity: string;
    title: string;
    finding: string | null;
    evidenceJson: string | null;
    businessMeaning: string | null;
  }>;
  prescriptions: Array<{
    priority: number;
    title: string;
    evidence: string | null;
    diagnosis: string | null;
    action: string | null;
    difficulty: string | null;
    timeHorizon: string | null;
  }>;
}): ClientReportViewModel {
  const metrics = input.metrics;
  const stage = detectBrandMirrorStage({
    awareness: metrics.awareness,
    discovery: metrics.discovery,
    recommendation: metrics.recommendation,
    alignment: metrics.alignment,
  });
  const portrait = input.portrait;
  const executiveSummary = buildExecutiveSummary({
    brandName: input.brand.name,
    stored: input.summary,
    stageId: stage.id,
    absentCount: input.absentObservationCount,
    absentMentions: 0,
    hallucinationRisk: metrics.hallucinationRisk,
  });

  const scores = {
    aiBrandScore: metrics.aiBrandScore,
    items: [
      {
        key: "awareness",
        label: "AI认知度",
        value: metrics.awareness,
        explanation: `在直接询问品牌的测试中，三个模型形成有依据认知的程度为 ${metrics.awareness}。`,
      },
      {
        key: "recommendation",
        label: "AI推荐率",
        value: metrics.recommendation,
        explanation: `当消费者没有主动提品牌时，品牌进入明确推荐位置的程度为 ${metrics.recommendation}。`,
      },
      {
        key: "discovery",
        label: "品类发现率",
        value: metrics.discovery,
        explanation: `当消费者没有主动提品牌名称时，三个AI模型在${input.absentObservationCount}次测试中${metrics.discovery === 0 ? "没有自然想到该品牌" : `自然提到该品牌的比例为 ${metrics.discovery}`}。`,
      },
      {
        key: "alignment",
        label: "AI认知匹配度",
        value: metrics.alignment,
        explanation: `AI描述与品牌提交资料的重合程度为 ${metrics.alignment}。`,
      },
      {
        key: "competitor",
        label: "竞品竞争力",
        value: metrics.competitor,
        explanation:
          metrics.competitor === 0
            ? "无品牌提问中，客户品牌相对指定竞品几乎没有获得提及或排序积分。"
            : `相对指定竞品的提及与排序表现为 ${metrics.competitor}。`,
      },
    ],
  };

  const hasStable = Boolean(portrait?.hasStableCognition);
  const profileFields: ClientProfileField[] = [
    field("目标人群", portrait?.audience.summary, portrait?.audience.confidence ?? 0, portrait?.audience.evidenceCount ?? 0),
    field("价格带", portrait?.priceTier.summary, portrait?.priceTier.confidence ?? 0, portrait?.priceTier.evidenceCount ?? 0),
    field(
      "品牌风格",
      portrait?.style.primary[0]?.label,
      portrait?.style.confidence ?? 0,
      portrait?.style.primary[0]?.evidenceCount ?? 0,
    ),
    field(
      "主要产品",
      portrait?.productAssociations[0]?.label,
      portrait?.productAssociations[0] ? 0.5 : 0,
      portrait?.productAssociations[0]?.evidenceCount ?? 0,
    ),
    field(
      "高关联场景",
      portrait?.scenarios.strong.map((s) => s.label).join("、"),
      portrait?.scenarios.strong.length ? 0.5 : 0,
      portrait?.scenarios.strong[0]?.evidenceCount ?? 0,
    ),
    field(
      "竞争品牌关联",
      portrait?.competitorAssociations.map((c) => c.label).join("、"),
      portrait?.competitorAssociations.length ? 0.5 : 0,
      portrait?.competitorAssociations[0]?.evidenceCount ?? 0,
    ),
  ];

  const diagnoses: ClientDiagnosis[] = input.diagnoses.slice(0, 5).map((d) => {
    const evidence = d.evidenceJson ? (JSON.parse(d.evidenceJson) as string[]) : [];
    return {
      title: DIAGNOSIS_TITLES[d.code] || d.title,
      severityLabel: severityLabel(d.severity),
      finding: d.finding ?? "",
      evidence,
      meaning: d.businessMeaning ?? "",
    };
  });

  const prescriptions: ClientPrescription[] = input.prescriptions.map((p) => ({
    priority: p.priority,
    title: p.title,
    why: [p.evidence, p.diagnosis].filter(Boolean).join(" "),
    action: p.action ?? "",
    difficultyLabel: difficultyLabel(p.difficulty),
    timeHorizonLabel: timeHorizonLabel(p.timeHorizon),
  }));

  const providerComparison = (["deepseek", "tencent-hy", "qwen"] as const).map((id) => {
    const row = metrics.byProvider[id];
    return {
      label: id === "deepseek" ? "DeepSeek" : id === "qwen" ? "Qwen" : "Hy3",
      modelLabel: PROVIDER_MODEL_LABELS[id],
      awareness: row?.awareness ?? 0,
      discovery: row?.discovery ?? 0,
      recommendation: row?.recommendation ?? 0,
      alignment: row?.alignment ?? 0,
      informationRisk: row?.hallucinationRisk ?? 0,
    };
  });

  return {
    brand: {
      name: input.brand.name,
      industry: input.brand.industry,
      isCalibration: input.brand.isCalibration,
    },
    reportMeta: {
      testedAt: input.testedAt,
      modelCount: 3,
      questionCount: input.questionCount,
      observationCount: input.observationCount,
      unbrandedQuestionCount: input.unbrandedQuestionCount,
      brandedQuestionCount: input.brandedQuestionCount,
      status: getReportStatus({
        portraitJson: portrait ? "{}" : null,
        diagnosisCount: input.diagnoses.length,
        prescriptionCount: input.prescriptions.length,
        analysisStatus: input.analysisStatus,
      }),
    },
    stage,
    executiveSummary: clampSummary(executiveSummary),
    scores,
    risk: {
      label: "AI认知风险",
      value: metrics.hallucinationRisk,
      explanation:
        "当公开品牌信息不足时，部分模型可能自行补全未经品牌资料支持的信息。该指标不计入 AI Brand Score。",
    },
    profile: {
      fields: profileFields,
      emptyNote: hasStable
        ? null
        : "当前数据不足以证明多个AI模型已经形成一致认知。",
    },
    positioningComparison: hasStable
      ? {
          available: true,
          rows: [
            input.brand.targetAudience
              ? {
                  dimension: "人群",
                  desired: input.brand.targetAudience,
                  actual: profileFields[0].value,
                }
              : null,
            input.brand.priceTier
              ? {
                  dimension: "价格",
                  desired: input.brand.priceTier,
                  actual: profileFields[1].value,
                }
              : null,
            input.brand.desiredPositioning
              ? {
                  dimension: "风格",
                  desired: input.brand.desiredPositioning,
                  actual: profileFields[2].value,
                }
              : null,
          ].filter((row): row is NonNullable<typeof row> => Boolean(row)),
          emptyNote: null,
        }
      : {
          available: false,
          rows: [],
          emptyNote: "AI目前尚未形成足够稳定认知，暂时无法进行有效定位差异比较。",
        },
    diagnoses,
    prescriptions,
    providerComparison,
    methodology: {
      thinking: "Thinking OFF",
      search: "Search OFF",
      surface: "Model API Baseline",
      models: [
        PROVIDER_MODEL_LABELS.deepseek,
        PROVIDER_MODEL_LABELS["tencent-hy"],
        PROVIDER_MODEL_LABELS.qwen,
      ],
      note: "当前结果反映模型API在标准化条件下的品牌认知基线，不等同于各消费者AI App在联网搜索、个性化设置等条件下的实际表现。",
      disclaimer: REPORT_DISCLAIMER,
    },
  };
}

export { FASHION_PACK_VERSION, CONSUMER_BASELINE_PROMPT_VERSION };
