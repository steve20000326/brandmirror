import Link from "next/link";

export default function HomePage() {
  return (
    <div className="space-y-16">
      <section className="pt-6 sm:pt-12">
        <p className="text-sm font-medium tracking-wide text-slate-500">
          BrandMirror · AI品牌镜
        </p>
        <h1 className="mt-4 max-w-2xl text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
          看看AI眼中的你的品牌
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
          BrandMirror通过真实消费者问题测试主流AI如何理解、推荐和比较你的品牌，并给出针对性的GEO优化建议。
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/brands/new"
            className="inline-flex h-11 items-center justify-center rounded-lg bg-slate-900 px-5 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            开始品牌体检
          </Link>
          <Link
            href="/brands"
            className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-5 text-sm font-medium text-slate-800 transition hover:bg-slate-50"
          >
            查看品牌
          </Link>
        </div>
      </section>

      <section className="grid gap-8 border-t border-slate-200 pt-12 sm:grid-cols-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">AI怎么看你</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            看看AI认为你的客户、定位、价格和品牌风格是什么。
          </p>
        </div>
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            AI会不会想到你
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            当消费者没有主动提品牌名称时，测试AI是否仍会推荐你。
          </p>
        </div>
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            接下来应该改什么
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            根据实际AI回答生成具体GEO优化建议，而不是泛泛而谈。
          </p>
        </div>
      </section>
    </div>
  );
}
