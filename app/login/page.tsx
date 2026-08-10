import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import LoginForm from "@/components/LoginForm";
import ThemeToggle from "@/components/ThemeToggle";
import { isAdminPasswordSet, isAuthenticated } from "@/lib/auth";

export const metadata: Metadata = { title: "관리자 로그인", robots: { index: false } };

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await isAuthenticated()) redirect("/admin");

  return (
    <main className="brand-hero flex min-h-screen items-center justify-center px-5 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/" className="chip">
            <ChevronLeft className="h-3.5 w-3.5" />
            사이트로
          </Link>
          <ThemeToggle />
        </div>

        <div className="card shadow-card p-7">
          <h1 className="t-h3 text-ink mb-1.5">관리자 로그인</h1>
          <p className="t-sub mb-6 text-[14px]">대시보드에 들어가려면 비밀번호가 필요합니다.</p>

          {isAdminPasswordSet() ? (
            <LoginForm />
          ) : (
            <p className="rounded-tds-lg bg-surface-2 text-ink-2 px-4 py-3.5 text-sm leading-6">
              <code className="font-mono font-semibold">ADMIN_PASSWORD</code> 환경변수가 설정되어 있지 않습니다.
              <br />
              <code className="font-mono">.env.local</code> 에 비밀번호를 넣고 서버를 다시 시작해 주세요.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
