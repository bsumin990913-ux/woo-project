import Link from "next/link";
import { notFound } from "next/navigation";

import PostForm from "@/components/PostForm";
import { getFolder, getPost } from "@/lib/queries";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string; postId: string }> };

export async function generateMetadata({ params }: Props) {
  const { postId } = await params;
  const post = await getPost(postId).catch(() => null);
  return { title: post ? post.title : "글 수정" };
}

export default async function EditPostPage({ params }: Props) {
  const { id, postId } = await params;

  const [folder, post] = await Promise.all([
    getFolder(id).catch(() => null),
    getPost(postId).catch(() => null),
  ]);

  if (!folder || !post || post.folder_id !== folder.id) notFound();

  return (
    <>
      <div className="mb-7">
        <Link
          href={`/admin/folders/${folder.id}`}
          className="text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          ← {folder.name}
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-extrabold tracking-tight">글 수정</h1>
          {folder.published && post.published && (
            <Link
              href={`/${encodeURIComponent(folder.slug)}/${post.id}`}
              target="_blank"
              className="btn-ghost btn-sm"
            >
              공개 페이지 보기 ↗
            </Link>
          )}
        </div>
      </div>

      <PostForm folderId={folder.id} post={post} />
    </>
  );
}
