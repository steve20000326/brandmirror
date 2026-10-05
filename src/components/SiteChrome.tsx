"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isShare = pathname.startsWith("/r/");
  const isAdmin = pathname.startsWith("/admin");

  return (
    <>
      <header className="site-header border-b border-slate-200/80 bg-white/80 backdrop-blur print:hidden">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link href={isAdmin ? "/admin" : "/"} className="text-sm font-semibold tracking-tight">
            BrandMirror
            <span className="ml-2 font-normal text-slate-500">AI品牌镜</span>
          </Link>
          {isShare ? (
            <span className="text-xs text-slate-500">只读报告</span>
          ) : isAdmin && pathname !== "/admin/login" ? (
            <nav className="flex items-center gap-4 text-sm text-slate-600">
              <Link href="/admin">Overview</Link>
              <Link href="/admin/brands">Brands</Link>
              <Link href="/admin/scans">Scans</Link>
              <Link href="/admin/models">Models</Link>
              <Link href="/admin/usage">Usage</Link>
            </nav>
          ) : (
            <nav className="flex items-center gap-4 text-sm text-slate-600">
              <Link href="/brands" className="hover:text-slate-900">
                品牌列表
              </Link>
              <Link
                href="/brands/new"
                className="rounded-md bg-slate-900 px-3 py-1.5 text-white hover:bg-slate-800"
              >
                开始品牌体检
              </Link>
            </nav>
          )}
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6">{children}</main>
      <footer className="border-t border-slate-200/80 py-6 text-center text-xs text-slate-500">
        BrandMirror MVP · AI品牌镜
      </footer>
    </>
  );
}
