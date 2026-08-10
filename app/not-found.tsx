import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-5 px-5 text-center">
      <p className="text-6xl font-black text-zinc-200 dark:text-zinc-800">404</p>
      <h1 className="text-xl font-bold">페이지를 찾을 수 없습니다</h1>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        주소가 바뀌었거나, 비공개로 전환된 페이지일 수 있어요.
      </p>
      <Link href="/" className="btn-primary mt-2">
        전체 목록으로
      </Link>
    </main>
  );
}
