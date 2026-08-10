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
        <Link href="/admin" className="text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
          ← 폴더 목록
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-extrabold tracking-tight">{folder.name}</h1>
          <Link href={`/${encodeURIComponent(folder.slug)}`} target="_blank" className="btn-ghost btn-sm">
            공개 페이지 보기 ↗
          </Link>
        </div>
      </div>

      {saved && (
        <p className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
          저장했습니다.
        </p>
      )}

      <FolderForm folder={folder} />

      <section className="mt-12">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight">글 {posts.length}개</h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              이 폴더의 공개 페이지에 순서대로 나열됩니다.
            </p>
          </div>
          <Link href={`/admin/folders/${folder.id}/posts/new`} className="btn-primary btn-sm">
            + 새 글
          </Link>
        </div>

        {posts.length === 0 ? (
          <div className="card p-10 text-center">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">아직 글이 없습니다.</p>
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
                  <img src={post.images[0]} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover" />
                ) : (
                  <div className="h-14 w-14 shrink-0 rounded-xl bg-zinc-100 dark:bg-zinc-800" />
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate font-semibold">{post.title}</h3>
                    {!post.published && (
                      <span className="badge bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">비공개</span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">
                    사진 {post.images.length}장 · 링크 {post.links.length}개
                  </p>
                </div>

                <div className="flex shrink-0 gap-2">
                  <Link href={`/admin/folders/${folder.id}/posts/${post.id}`} className="btn-ghost btn-sm">
                    수정
                  </Link>
                  <form action={deletePostAction}>
                    <input type="hidden" name="id" value={post.id} />
                    <input type="hidden" name="folder_id" value={folder.id} />
                    <ConfirmButton className="btn-danger btn-sm" message={`"${post.title}" 글을 삭제할까요?`}>
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
        className="h-6 w-6 cursor-pointer rounded-md border border-zinc-200 text-xs text-zinc-500 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-25 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
      >
        {direction === "up" ? "↑" : "↓"}
      </button>
    </form>
  );
}
