import Link from "next/link";

import { getSiteSettings } from "@/lib/queries";

export default async function NotFound() {
  // 전체 목록을 비공개로 돌린 상태면 첫 화면으로 보내봐야 또 404 다.
  const { index_published } = await getSiteSettings();

  return (
    <main className="bg-canvas flex min-h-screen flex-col items-center justify-center gap-4 px-5 text-center">
      <p className="text-ink-3/40 text-7xl font-black tracking-tight">404</p>
      <h1 className="t-h3 text-ink">페이지를 찾을 수 없습니다</h1>
      <p className="t-sub">주소가 바뀌었거나, 비공개로 전환된 페이지일 수 있어요.</p>
      {index_published && (
        <Link href="/" className="btn-primary btn-lg mt-3">
          전체 목록으로
        </Link>
      )}
    </main>
  );
}
