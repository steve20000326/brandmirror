"use client";

import { useActionState, type ReactNode } from "react";
import { createBrand, type CreateBrandState } from "@/server/brands/actions";

const initialState: CreateBrandState = {};

function Field({
  label,
  name,
  required,
  placeholder,
  as = "input",
  rows = 3,
}: {
  label: string;
  name: string;
  required?: boolean;
  placeholder?: string;
  as?: "input" | "textarea";
  rows?: number;
}) {
  const className =
    "mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100";

  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-800">
        {label}
        {required ? <span className="ml-0.5 text-rose-600">*</span> : null}
      </span>
      {as === "textarea" ? (
        <textarea
          name={name}
          rows={rows}
          placeholder={placeholder}
          className={className}
        />
      ) : (
        <input
          name={name}
          type="text"
          placeholder={placeholder}
          className={className}
          required={required}
        />
      )}
    </label>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

export function BrandForm() {
  const [state, formAction, pending] = useActionState(createBrand, initialState);

  return (
    <form action={formAction} className="space-y-6">
      {state.error ? (
        <div
          role="alert"
          className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
        >
          {state.error}
        </div>
      ) : null}

      <Section title="基础信息">
        <Field label="品牌名称" name="name" required placeholder="例如：澜序女装" />
        <Field label="所属行业" name="industry" required placeholder="例如：品牌女装" />
        <Field label="官网" name="websiteUrl" placeholder="https://" />
        <Field
          label="官方商城/店铺"
          name="officialStoreUrl"
          placeholder="https://"
        />
        <div className="sm:col-span-2">
          <Field
            label="品牌简介"
            name="description"
            as="textarea"
            placeholder="简要描述品牌是什么、服务谁"
          />
        </div>
      </Section>

      <Section title="品牌商业信息">
        <div className="sm:col-span-2">
          <Field
            label="核心产品"
            name="coreProducts"
            as="textarea"
            rows={2}
            placeholder="例如：通勤西装、连衣裙、针织衫"
          />
        </div>
        <Field
          label="目标消费者"
          name="targetAudience"
          placeholder="例如：30～45岁城市职业女性"
        />
        <Field label="价格档次" name="priceTier" placeholder="例如：中高端" />
      </Section>

      <Section title="希望AI如何认识品牌">
        <div className="sm:col-span-2">
          <Field
            label="品牌希望形成的定位"
            name="desiredPositioning"
            as="textarea"
            rows={2}
            placeholder="例如：现代、克制、有品质感的都市职业女性品牌"
          />
        </div>
        <div className="sm:col-span-2">
          <Field
            label="希望AI关联的核心关键词"
            name="desiredKeywords"
            as="textarea"
            rows={2}
            placeholder="现代职业女性, 品质通勤, 中高端, 简约"
          />
        </div>
      </Section>

      <Section title="竞争品牌">
        <Field label="竞品1" name="competitor1" placeholder="例如：玖姿" />
        <Field label="竞品2" name="competitor2" placeholder="例如：朗姿" />
        <Field label="竞品3" name="competitor3" placeholder="例如：哥弟" />
      </Section>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-11 items-center justify-center rounded-lg bg-slate-900 px-6 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "保存中…" : "保存品牌"}
        </button>
      </div>
    </form>
  );
}
