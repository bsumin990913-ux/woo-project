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
    <main className="flex min-h-screen items-center justify-center px-5 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/" className="text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
            ← 사이트로
          </Link>
          <ThemeToggle />
        </div>

        <div className="card p-7">
          <h1 className="mb-1 text-xl font-bold tracking-tight">관리자 로그인</h1>
          <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">대시보드에 들어가려면 비밀번호가 필요합니다.</p>

          {isAdminPasswordSet() ? (
            <LoginForm />
          ) : (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
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
