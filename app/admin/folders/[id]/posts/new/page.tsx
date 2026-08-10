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
        <Link href={`/admin/folders/${folder.id}`} className="chip">
          ← {folder.name}
        </Link>
        <h1 className="t-h2 text-ink mt-3">새 글 쓰기</h1>
      </div>

      <PostForm folderId={folder.id} />
    </>
  );
}
