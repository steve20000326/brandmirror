import { describe, expect, it } from "vitest";
import {
  FASHION_PACK_VERSION,
  FASHION_QUESTION_BANK,
  countByCategory,
  generateFashionQuestions,
} from "./index";
import type { BrandGenerationContext } from "../types";

const lanxu: BrandGenerationContext = {
  id: "cmuct10de0000zgvzodr6dqnr",
  name: "澜序女装",
  industry: "品牌女装",
  coreProducts: "通勤西装、连衣裙、针织衫、大衣",
  targetAudience: "30～45岁城市职业女性",
  priceTier: "中高端",
  competitors: [{ name: "玖姿" }, { name: "朗姿" }, { name: "哥弟" }],
};

describe("Fashion question bank", () => {
  it("has at least 120 templates with 24 per category", () => {
    expect(FASHION_QUESTION_BANK.length).toBeGreaterThanOrEqual(120);
    const counts = countByCategory(FASHION_QUESTION_BANK);
    expect(counts.brand_cognition).toBeGreaterThanOrEqual(24);
    expect(counts.category_discovery).toBeGreaterThanOrEqual(24);
    expect(counts.audience_scenario).toBeGreaterThanOrEqual(24);
    expect(counts.competitor_comparison).toBeGreaterThanOrEqual(24);
    expect(counts.purchase_decision).toBeGreaterThanOrEqual(24);
  });
});

describe("generateFashionQuestions", () => {
  it("generates exactly 30 questions", () => {
    const qs = generateFashionQuestions(lanxu);
    expect(qs).toHaveLength(30);
  });

  it("matches category quotas 5/8/7/5/5", () => {
    const qs = generateFashionQuestions(lanxu);
    const counts = {
      brand_cognition: 0,
      category_discovery: 0,
      audience_scenario: 0,
      competitor_comparison: 0,
      purchase_decision: 0,
    };
    for (const q of qs) counts[q.questionType] += 1;
    expect(counts).toEqual({
      brand_cognition: 5,
      category_discovery: 8,
      audience_scenario: 7,
      competitor_comparison: 5,
      purchase_decision: 5,
    });
  });

  it("has 12 brand-present and 18 brand-absent questions", () => {
    const qs = generateFashionQuestions(lanxu);
    expect(qs.filter((q) => q.brandPresent)).toHaveLength(12);
    expect(qs.filter((q) => !q.brandPresent)).toHaveLength(18);
  });

  it("has no duplicate texts", () => {
    const qs = generateFashionQuestions(lanxu);
    const texts = qs.map((q) => q.text);
    expect(new Set(texts).size).toBe(texts.length);
  });

  it("contains no unresolved placeholders or null/undefined tokens", () => {
    const qs = generateFashionQuestions(lanxu);
    for (const q of qs) {
      expect(q.text).not.toMatch(/\{[a-zA-Z0-9_]+\}/);
      expect(q.text).not.toMatch(/\bundefined\b|\bnull\b/i);
      expect(q.source).toBe(FASHION_PACK_VERSION);
    }
  });

  it("is deterministic for the same brand", () => {
    const a = generateFashionQuestions(lanxu);
    const b = generateFashionQuestions(lanxu);
    expect(a.map((q) => q.text)).toEqual(b.map((q) => q.text));
  });

  it("never puts brand name into brandPresent=false questions", () => {
    const qs = generateFashionQuestions(lanxu);
    for (const q of qs.filter((item) => !item.brandPresent)) {
      expect(q.text).not.toContain(lanxu.name);
    }
  });

  it("does not crash when competitors are missing", () => {
    const qs = generateFashionQuestions({
      ...lanxu,
      id: "brand-no-competitors",
      competitors: [],
    });
    expect(qs).toHaveLength(30);
    expect(qs.filter((q) => q.questionType === "competitor_comparison")).toHaveLength(5);
    for (const q of qs) {
      expect(q.text).not.toMatch(/\{competitor/);
      expect(q.text).not.toMatch(/\bundefined\b|\bnull\b/i);
    }
  });

  it("does not crash with a single competitor", () => {
    const qs = generateFashionQuestions({
      ...lanxu,
      id: "brand-one-competitor",
      competitors: [{ name: "玖姿" }],
    });
    expect(qs).toHaveLength(30);
  });
});
