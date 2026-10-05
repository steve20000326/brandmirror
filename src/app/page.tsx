import Link from "next/link";

export default function HomePage() {
  return (
    <div className="space-y-16">
      <section className="pt-6 sm:pt-12">
        <p className="text-sm font-medium tracking-wide text-slate-500">BrandMirror</p>
        <p className="text-sm text-slate-500">AI品牌镜</p>
        <h1 className="mt-4 max-w-2xl text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
          看看AI眼中的你的品牌
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
          用真实消费者问题测试主流AI如何认识、发现和推荐你的品牌，并得到一份可执行的GEO优化处方。
        </p>
        <div className="mt-8">
          <Link
            href="/brands/new"
            className="inline-flex h-11 items-center justify-center rounded-lg bg-slate-900 px-5 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            开始品牌体检
          </Link>
        </div>
      </section>
      <section className="grid gap-8 border-t border-slate-200 pt-12 sm:grid-cols-3">
        <div>
          <h2 className="text-base font-semibold">AI怎么看你</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            看看主流AI如何描述你的人群、价格、风格和产品。
          </p>
        </div>
        <div>
          <h2 className="text-base font-semibold">AI会不会想到你</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            当消费者没有主动提品牌名称时，测试AI是否仍会发现并推荐你。
          </p>
        </div>
        <div>
          <h2 className="text-base font-semibold">你现在最值得改什么</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            根据真实回答给出 5～10 条可执行的 GEO 优化处方。
          </p>
        </div>
      </section>
    </div>
  );
}
