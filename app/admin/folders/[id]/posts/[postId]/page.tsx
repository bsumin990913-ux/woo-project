import { ChevronLeft, ExternalLink } from "lucide-react";
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
        <Link href={`/admin/folders/${folder.id}`} className="chip">
          <ChevronLeft className="h-3.5 w-3.5" />
          {folder.name}
        </Link>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <h1 className="t-h2 text-ink">글 수정</h1>
          {folder.published && post.published && (
            <Link
              href={`/${encodeURIComponent(folder.slug)}/${post.id}`}
              target="_blank"
              className="btn-ghost btn-sm"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              공개 페이지 보기
            </Link>
          )}
        </div>
      </div>

      <PostForm folderId={folder.id} post={post} />
    </>
  );
}
