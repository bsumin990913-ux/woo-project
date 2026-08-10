import Link from "next/link";

import FolderForm from "@/components/FolderForm";

export const metadata = { title: "새 폴더" };

export default function NewFolderPage() {
  return (
    <>
      <div className="mb-7">
        <Link href="/admin" className="text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
          ← 폴더 목록
        </Link>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight">새 폴더 만들기</h1>
        <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
          만들고 나면 이 폴더 안에 글을 계속 추가할 수 있습니다.
        </p>
      </div>

      <FolderForm />
    </>
  );
}
