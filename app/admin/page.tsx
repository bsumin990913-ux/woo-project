import Link from "next/link";

import ConfirmButton from "@/components/ConfirmButton";
import SetupNotice from "@/components/SetupNotice";
import { deleteFolderAction, moveFolderAction } from "@/lib/actions";
import { listAllFolders } from "@/lib/queries";
import type { FolderWithCount } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  let folders: FolderWithCount[] = [];
  let failure: string | null = null;

  try {
    folders = await listAllFolders();
  } catch (error) {
    failure = error instanceof Error ? error.message : String(error);
  }

  if (failure) return <SetupNotice detail={failure} />;

  return (
    <>
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">프로젝트 폴더</h1>
          <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
            폴더 하나가 공개 페이지 하나입니다. 순서를 바꾸면 방문자 화면에도 그대로 반영돼요.
          </p>
        </div>
        <Link href="/admin/folders/new" className="btn-primary">
          + 새 폴더
        </Link>
      </div>

      {folders.length === 0 ? (
        <div className="card p-14 text-center">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">아직 폴더가 없습니다.</p>
          <Link href="/admin/folders/new" className="btn-primary mt-5">
            첫 폴더 만들기
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {folders.map((folder, index) => (
            <li key={folder.id} className="card flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
              <div className="flex flex-col gap-1">
                <ReorderButton id={folder.id} direction="up" disabled={index === 0} />
                <ReorderButton id={folder.id} direction="down" disabled={index === folders.length - 1} />
              </div>

              {folder.thumbnail_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={folder.thumbnail_url} alt="" className="h-16 w-16 shrink-0 rounded-xl object-cover" />
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-lg font-black text-zinc-300 dark:bg-zinc-800 dark:text-zinc-600">
                  {folder.name.slice(0, 2)}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate font-bold">{folder.name}</h2>
                  {folder.published ? (
                    <span className="badge bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
                      공개
                    </span>
                  ) : (
                    <span className="badge bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">비공개</span>
                  )}
                </div>
                <p className="mt-0.5 truncate text-xs text-zinc-400 dark:text-zinc-500">
                  /{folder.slug} · 글 {folder.post_count}개 · 링크 {folder.links.length}개
                </p>
                {folder.description && (
                  <p className="mt-1 truncate text-sm text-zinc-500 dark:text-zinc-400">{folder.description}</p>
                )}
              </div>

              <div className="flex shrink-0 flex-wrap gap-2">
                <Link href={`/${encodeURIComponent(folder.slug)}`} target="_blank" className="btn-ghost btn-sm">
                  보기 ↗
                </Link>
                <Link href={`/admin/folders/${folder.id}`} className="btn-primary btn-sm">
                  관리
                </Link>
                <form action={deleteFolderAction}>
                  <input type="hidden" name="id" value={folder.id} />
                  <ConfirmButton
                    className="btn-danger btn-sm"
                    message={`"${folder.name}" 폴더와 그 안의 글·사진이 모두 삭제됩니다. 계속할까요?`}
                  >
                    삭제
                  </ConfirmButton>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function ReorderButton({ id, direction, disabled }: { id: string; direction: "up" | "down"; disabled: boolean }) {
  return (
    <form action={moveFolderAction}>
      <input type="hidden" name="id" value={id} />
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
