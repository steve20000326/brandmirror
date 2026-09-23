import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { PageHeader } from "@/components/PageHeader";
import { getIndustryPack } from "@/domain/industry-packs";
import {
  FASHION_PACK_LABEL,
  FASHION_PACK_VERSION,
} from "@/domain/industry-packs/fashion";
import type { QuestionCategory } from "@/domain/industry-packs/types";
import { QUESTION_CATEGORY_META } from "@/lib/question-meta";
import { getBrandById } from "@/server/brands/queries";
import { listPlanQuestions } from "@/server/brands/questions";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
      {children}
    </span>
  );
}

export default async function BrandQuestionsPage({ params }: PageProps) {
  const { id } = await params;
  const brand = await getBrandById(id);

  if (!brand) {
    notFound();
  }

  const pack = getIndustryPack(brand.industry);
  if (!pack) {
    return (
      <div>
        <Link
          href={`/brands/${brand.id}`}
          className="text-sm text-slate-500 hover:text-slate-800"
        >
          ← 返回品牌详情
        </Link>
        <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          当前MVP仅开放品牌女装Industry Pack，其他行业将在验证后逐步增加。
        </div>
      </div>
    );
  }

  const questions = await listPlanQuestions(brand.id, pack.version);

  if (questions.length === 0) {
    return (
      <div>
        <Link
          href={`/brands/${brand.id}`}
          className="text-sm text-slate-500 hover:text-slate-800"
        >
          ← 返回品牌详情
        </Link>
        <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <p className="text-sm text-slate-600">尚未生成测试方案。</p>
          <Link
            href={`/brands/${brand.id}`}
            className="mt-4 inline-flex h-10 items-center rounded-lg bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800"
          >
            返回生成
          </Link>
        </div>
      </div>
    );
  }

  const withoutBrand = questions.filter((q) => !q.brandPresent).length;
  const withBrand = questions.length - withoutBrand;

  const grouped = (
    Object.keys(QUESTION_CATEGORY_META) as QuestionCategory[]
  ).map((key) => ({
    key,
    meta: QUESTION_CATEGORY_META[key],
    items: questions.filter((q) => q.questionType === key),
  }));

  return (
    <div>
      <div className="mb-2">
        <Link
          href={`/brands/${brand.id}`}
          className="text-sm text-slate-500 hover:text-slate-800"
        >
          ← 返回品牌详情
        </Link>
      </div>

      <PageHeader
        title="AI品牌测试方案"
        description="BrandMirror将使用以下消费者问题观察AI如何认识、发现、比较和推荐你的品牌。"
      />

      <div className="mb-6 grid gap-3 rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-700 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-xs text-slate-500">品牌</p>
          <p className="mt-1 font-medium text-slate-900">{brand.name}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">行业</p>
          <p className="mt-1 font-medium text-slate-900">{brand.industry}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">测试问题</p>
          <p className="mt-1 font-medium text-slate-900">{questions.length}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Industry Pack</p>
          <p className="mt-1 font-medium text-slate-900">{FASHION_PACK_LABEL}</p>
        </div>
      </div>

      <div className="mb-10 rounded-xl border border-slate-900/10 bg-slate-900 px-5 py-5 text-white">
        <p className="text-lg font-semibold tracking-tight">
          {withoutBrand} / {questions.length} 道问题没有出现品牌名称
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          这些问题用于测试消费者没有主动提及品牌时，AI是否仍会自然想到并推荐该品牌。
          （含品牌 {withBrand} 题 · 无品牌 {withoutBrand} 题 · 来源{" "}
          {FASHION_PACK_VERSION}）
        </p>
      </div>

      <div className="space-y-10">
        {grouped.map((group) => (
          <section key={group.key}>
            <div className="mb-4 flex items-baseline justify-between gap-3">
              <h2 className="text-base font-semibold text-slate-900">
                {group.meta.title}
              </h2>
              <span className="text-xs text-slate-500">{group.items.length} 题</span>
            </div>
            <ol className="space-y-3">
              {group.items.map((q, index) => (
                <li
                  key={q.id}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm"
                >
                  <div className="flex flex-wrap gap-2">
                    {q.brandPresent ? <Tag>含品牌</Tag> : <Tag>无品牌</Tag>}
                    {q.purchaseIntent === "high" ? <Tag>高购买意图</Tag> : null}
                    {q.scenario ? <Tag>场景题</Tag> : null}
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-900">
                    <span className="mr-2 text-slate-400">{index + 1}.</span>
                    {q.text}
                  </p>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>

      <div className="mt-12 flex flex-wrap items-center gap-3 border-t border-slate-200 pt-8">
        <button
          type="button"
          disabled
          className="inline-flex h-11 cursor-not-allowed items-center rounded-lg bg-slate-300 px-5 text-sm font-medium text-slate-600"
        >
          开始AI扫描
        </button>
        <span className="text-sm text-slate-500">Day 3开放</span>
      </div>
    </div>
  );
}
