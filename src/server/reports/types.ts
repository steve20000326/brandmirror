import type { BrandMirrorStage } from "./stage";

export type CognitionLevel = "稳定认知" | "初步认知" | "暂无稳定认知";

export type ClientScoreItem = {
  key: string;
  label: string;
  value: number;
  explanation: string;
};

export type ClientProfileField = {
  label: string;
  value: string;
  level: CognitionLevel;
};

export type ClientComparisonRow = {
  dimension: string;
  desired: string;
  actual: string;
};

export type ClientDiagnosis = {
  title: string;
  severityLabel: string;
  finding: string;
  evidence: string[];
  meaning: string;
};

export type ClientPrescription = {
  priority: number;
  title: string;
  why: string;
  action: string;
  difficultyLabel: string;
  timeHorizonLabel: string;
};

export type ClientProviderRow = {
  label: string;
  modelLabel: string;
  awareness: number;
  discovery: number;
  recommendation: number;
  alignment: number;
  informationRisk: number;
};

export type ClientReportViewModel = {
  brand: {
    name: string;
    industry: string;
    isCalibration: boolean;
  };
  reportMeta: {
    testedAt: string;
    modelCount: number;
    questionCount: number;
    observationCount: number;
    unbrandedQuestionCount: number;
    brandedQuestionCount: number;
    status: "ready" | "incomplete";
  };
  stage: BrandMirrorStage;
  executiveSummary: string;
  scores: {
    aiBrandScore: number;
    items: ClientScoreItem[];
  };
  risk: {
    label: string;
    value: number;
    explanation: string;
  };
  profile: {
    fields: ClientProfileField[];
    emptyNote: string | null;
  };
  positioningComparison: {
    available: boolean;
    rows: ClientComparisonRow[];
    emptyNote: string | null;
  };
  diagnoses: ClientDiagnosis[];
  prescriptions: ClientPrescription[];
  providerComparison: ClientProviderRow[];
  methodology: {
    thinking: string;
    search: string;
    surface: string;
    models: string[];
    note: string;
    disclaimer: string;
  };
};

export const REPORT_DISCLAIMER =
  "BrandMirror的结果基于特定时间、特定测试问题和模型版本生成。AI模型及其公开信息来源会持续变化，本报告用于品牌AI认知诊断与优化参考，不保证任何模型在未来特定问题中一定提及、推荐或引用某品牌。";
