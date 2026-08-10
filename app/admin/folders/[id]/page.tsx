import { ArrowDown, ArrowUp, ChevronLeft, ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import ConfirmButton from "@/components/ConfirmButton";
import FolderForm from "@/components/FolderForm";
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
          <Link href={`/admin/folders/${folder.id}/posts/new`} className="btn-primary btn-sm">
            <Plus className="h-4 w-4" />새 글
          </Link>
        </div>

        {posts.length === 0 ? (
          <div className="card p-10 text-center">
            <p className="t-sub">아직 글이 없습니다.</p>
            <Link href={`/admin/folders/${folder.id}/posts/new`} className="btn-primary mt-4">
              첫 글 쓰기
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {posts.map((post, index) => (
              <li key={post.id} className="card flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                <div className="flex flex-col gap-1">
                  <ReorderButton
                    id={post.id}
                    folderId={folder.id}
                    direction="up"
                    disabled={index === 0}
                  />
                  <ReorderButton
                    id={post.id}
                    folderId={folder.id}
                    direction="down"
                    disabled={index === posts.length - 1}
                  />
                </div>

                {post.images[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={post.images[0]} alt="" className="rounded-tds-lg h-14 w-14 shrink-0 object-cover" />
                ) : (
                  <div className="rounded-tds-lg bg-surface-2 h-14 w-14 shrink-0" />
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-ink truncate font-bold">{post.title}</h3>
                    {!post.published && <span className="badge">비공개</span>}
                  </div>
                  <p className="text-ink-3 mt-1 text-xs font-medium">
                    사진 {post.images.length}장 · 링크 {post.links.length}개
                  </p>
                </div>

                <div className="flex shrink-0 gap-2">
                  <Link href={`/admin/folders/${folder.id}/posts/${post.id}`} className="btn-ghost btn-sm">
                    <Pencil className="h-3.5 w-3.5" />
                    수정
                  </Link>
                  <form action={deletePostAction}>
                    <input type="hidden" name="id" value={post.id} />
                    <input type="hidden" name="folder_id" value={folder.id} />
                    <ConfirmButton className="btn-danger btn-sm" message={`"${post.title}" 글을 삭제할까요?`}>
                      <Trash2 className="h-3.5 w-3.5" />
                      삭제
                    </ConfirmButton>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

function ReorderButton({
  id,
  folderId,
  direction,
  disabled,
}: {
  id: string;
  folderId: string;
  direction: "up" | "down";
  disabled: boolean;
}) {
  return (
    <form action={movePostAction}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="folder_id" value={folderId} />
      <input type="hidden" name="direction" value={direction} />
      <button
        type="submit"
        disabled={disabled}
        aria-label={direction === "up" ? "위로" : "아래로"}
        className="icon-btn h-6 w-6 rounded-md"
      >
        {direction === "up" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
      </button>
    </form>
  );
}
