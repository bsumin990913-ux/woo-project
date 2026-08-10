import Link from "next/link";
import { notFound } from "next/navigation";

import PostForm from "@/components/PostForm";
import { getFolder } from "@/lib/queries";

export const dynamic = "force-dynamic";
export const metadata = { title: "새 글" };

export default async function NewPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const folder = await getFolder(id).catch(() => null);
  if (!folder) notFound();

  return (
    <>
      <div className="mb-7">
        <Link
          href={`/admin/folders/${folder.id}`}
          className="text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          ← {folder.name}
        </Link>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight">새 글 쓰기</h1>
      </div>

      <PostForm folderId={folder.id} />
    </>
  );
}
