export type BrandMirrorStageId = "A" | "B" | "C" | "D" | "E";

export type BrandMirrorStage = {
  id: BrandMirrorStageId;
  title: string;
  disclaimer: "BrandMirror内部诊断阶段";
};

const STAGES: Record<BrandMirrorStageId, string> = {
  A: "AI尚未形成品牌认知",
  B: "AI知道品牌，但很少自然想到",
  C: "AI会想到品牌，但推荐能力弱",
  D: "AI认知形成，但存在明显定位偏差",
  E: "AI认知与品牌定位较稳定",
};

export function detectBrandMirrorStage(metrics: {
  awareness: number;
  discovery: number;
  recommendation: number;
  alignment: number;
}): BrandMirrorStage {
  const { awareness, discovery, recommendation, alignment } = metrics;
  let id: BrandMirrorStageId = "A";
  if (awareness < 20 && discovery < 10) id = "A";
  else if (awareness >= 20 && discovery < 20) id = "B";
  else if (discovery >= 20 && recommendation < 20) id = "C";
  else if (awareness >= 30 && alignment < 50) id = "D";
  else if (awareness >= 30 && discovery >= 20 && alignment >= 50) id = "E";
  else id = "A";

  return {
    id,
    title: STAGES[id],
    disclaimer: "BrandMirror内部诊断阶段",
  };
}
