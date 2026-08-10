import Link from "next/link";

import FolderForm from "@/components/FolderForm";

export const metadata = { title: "새 폴더" };

export default function NewFolderPage() {
  return (
    <>
      <div className="mb-7">
        <Link href="/admin" className="chip">
          ← 폴더 목록
        </Link>
        <h1 className="t-h2 text-ink mt-3">새 폴더 만들기</h1>
        <p className="t-sub mt-1.5 text-[14px]">만들고 나면 이 폴더 안에 글을 계속 추가할 수 있습니다.</p>
      </div>

      <FolderForm />
    </>
  );
}
