"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { generateBrandQuestionPlan } from "@/server/brands/actions";

type Props = {
  brandId: string;
  hasPlan: boolean;
  industrySupported: boolean;
};

export function GeneratePlanButton({
  brandId,
  hasPlan,
  industrySupported,
}: Props) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!industrySupported) {
    return (
      <div className="space-y-2">
        <button
          type="button"
          disabled
          className="inline-flex h-11 cursor-not-allowed items-center rounded-lg bg-slate-300 px-5 text-sm font-medium text-slate-600"
        >
          生成AI测试方案
        </button>
        <p className="text-sm text-slate-500">
          当前MVP仅开放品牌女装Industry Pack，其他行业将在验证后逐步增加。
        </p>
      </div>
    );
  }

  if (hasPlan) {
    return (
      <Link
        href={`/brands/${brandId}/questions`}
        className="inline-flex h-11 items-center rounded-lg bg-slate-900 px-5 text-sm font-medium text-white transition hover:bg-slate-800"
      >
        查看AI测试方案
      </Link>
    );
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await generateBrandQuestionPlan(brandId);
            if (result?.error) {
              setError(result.error);
            }
          });
        }}
        className="inline-flex h-11 items-center rounded-lg bg-slate-900 px-5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "生成中…" : "生成AI测试方案"}
      </button>
      {error ? (
        <p role="alert" className="text-sm text-rose-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
