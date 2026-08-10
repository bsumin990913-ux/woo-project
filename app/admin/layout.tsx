import { ExternalLink, LayoutDashboard, LogOut } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import ThemeToggle from "@/components/ThemeToggle";
import { logoutAction } from "@/lib/actions";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = {
  title: { default: "대시보드", template: "%s · 대시보드" },
  robots: { index: false, follow: false },
};

// 로그인 여부는 반드시 요청 시점에 확인해야 한다(빌드 때 결과가 굳으면 안 됨)
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="min-h-screen">
      <header className="border-line bg-canvas/80 sticky top-0 z-30 border-b backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-3">
          <Link href="/admin" className="text-ink flex items-center gap-2 text-[15px] font-extrabold tracking-tight">
            <span className="bg-brand text-on-brand flex h-7 w-7 items-center justify-center rounded-[9px]">
              <LayoutDashboard className="h-4 w-4" />
            </span>
            대시보드
          </Link>

          <nav className="flex items-center gap-2">
            <Link href="/" target="_blank" className="btn-ghost btn-sm">
              사이트 보기
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
            <ThemeToggle />
            <form action={logoutAction}>
              <button type="submit" className="btn-ghost btn-sm">
                <LogOut className="h-3.5 w-3.5" />
                로그아웃
              </button>
            </form>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-5 py-8 sm:py-10">{children}</div>
    </div>
  );
}
