import { ChevronLeft, ExternalLink, Eye, Images, Link2, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import SortablePostList from "@/components/SortablePostList";
import ConfirmButton from "@/components/ConfirmButton";
import FolderForm from "@/components/FolderForm";
import PostCreateModal from "@/components/PostCreateModal";
import { deletePostAction, movePostAction } from "@/lib/actions";
import { getFolder, listAllPosts } from "@/lib/queries";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const folder = await getFolder(id).catch(() => null);
  return { title: folder ? folder.name : "폴더" };
}

export default async function EditFolderPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { saved } = await searchParams;

  const folder = await getFolder(id).catch(() => null);
  if (!folder) notFound();

  const posts = await listAllPosts(folder.id);

  return (
    <>
      <div className="mb-7">
        <Link href="/admin" className="chip">
          <ChevronLeft className="h-3.5 w-3.5" />
          폴더 목록
        </Link>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <h1 className="t-h2 text-ink flex items-center gap-2.5">
            <span
              className="h-5 w-5 shrink-0 rounded-full"
              style={{ backgroundColor: folder.theme_color, boxShadow: "inset 0 0 0 1px rgba(0,0,0,.08)" }}
              title={`테마 컬러 ${folder.theme_color}`}
            />
            {folder.name}
          </h1>
          <Link href={`/${encodeURIComponent(folder.slug)}`} target="_blank" className="btn-ghost btn-sm">
            <ExternalLink className="h-3.5 w-3.5" />
            공개 페이지 보기
          </Link>
        </div>
      </div>

      {saved && (
        <p className="badge badge-live rounded-tds-lg mb-6 h-auto w-full px-4 py-3.5 text-sm">저장했습니다.</p>
      )}

      <FolderForm folder={folder} />

      <section className="mt-12">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="t-h3 text-ink">글 {posts.length}개</h2>
            <p className="t-sub mt-1 text-[14px]">이 폴더의 공개 페이지에 순서대로 나열됩니다.</p>
          </div>
          <PostCreateModal folderId={folder.id} />
        </div>

      {posts.length === 0 ? (
          <div className="card p-10 text-center">
            <p className="t-sub">아직 글이 없습니다.</p>
            <div className="mt-4">
              <PostCreateModal folderId={folder.id} />
            </div>
          </div>
        ) : (
          <SortablePostList initialPosts={posts} folderId={folder.id} />
        )}
      </section>
    </>
  );
}
