import { ArrowDown, ArrowUp, Eye, ExternalLink, FileText, Globe, Lock, Plus, Settings2, Trash2 } from "lucide-react";
import Link from "next/link";

import ConfirmButton from "@/components/ConfirmButton";
import SetupNotice from "@/components/SetupNotice";
import { deleteFolderAction, moveFolderAction, setIndexPublishedAction } from "@/lib/actions";
import { getSettingsForAdmin, listAllFolders } from "@/lib/queries";
import { brandStyle } from "@/lib/theme";
import type { FolderWithCount, SiteSettings } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  let folders: FolderWithCount[] = [];
  let settings: SiteSettings & { ready: boolean } = { index_published: true, ready: false };
  let failure: string | null = null;

  try {
    [folders, settings] = await Promise.all([listAllFolders(), getSettingsForAdmin()]);
  } catch (error) {
    failure = error instanceof Error ? error.message : String(error);
  }

  if (failure) return <SetupNotice detail={failure} />;

  const totalViews = folders.reduce((sum, folder) => sum + folder.total_views, 0);

  return (
    <>
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="t-h2 text-ink">프로젝트 폴더</h1>
          <p className="t-sub mt-1.5 text-[14px]">
            폴더 하나가 공개 페이지 하나입니다. 순서를 바꾸면 방문자 화면에도 그대로 반영돼요.
          </p>
        </div>
        <Link href="/admin/folders/new" className="btn-primary">
          <Plus className="h-4 w-4" />새 폴더
        </Link>
      </div>

      {/* 첫 화면(전체 목록) 공개 여부 */}
      <section className="card mb-6 flex flex-wrap items-center gap-4 p-5">
        <span
          className={`rounded-tds-lg flex h-11 w-11 shrink-0 items-center justify-center ${
            settings.index_published ? "bg-brand-weak text-brand-weak-fg" : "bg-surface-2 text-ink-3"
          }`}
        >
          {settings.index_published ? <Globe className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-ink text-[15px] font-bold">첫 화면 전체 목록</h2>
            {settings.index_published ? (
              <span className="badge badge-live">공개</span>
            ) : (
              <span className="badge">비공개</span>
            )}
          </div>
          <p className="hint mt-1">
            {settings.index_published
              ? "주소만 알면 누구나 모든 폴더 목록을 볼 수 있어요."
              : "첫 화면은 숨겨져 있어요. 각 폴더 주소(/슬러그)를 직접 아는 사람만 들어올 수 있습니다."}
          </p>
        </div>

        {settings.ready ? (
          <form action={setIndexPublishedAction} className="shrink-0">
            <input type="hidden" name="value" value={settings.index_published ? "false" : "true"} />
            <button type="submit" className={settings.index_published ? "btn-ghost btn-sm" : "btn-primary btn-sm"}>
              {settings.index_published ? (
                <>
                  <Lock className="h-3.5 w-3.5" />
                  비공개로
                </>
              ) : (
                <>
                  <Globe className="h-3.5 w-3.5" />
                  공개로
                </>
              )}
            </button>
          </form>
        ) : (
          <p className="bg-surface-2 text-ink-2 rounded-tds-md shrink-0 px-3 py-2 text-xs font-medium">
            supabase/schema.sql 을 다시 실행하면 켤 수 있어요
          </p>
        )}
      </section>

      {folders.length > 0 && (
        <p className="t-caption mb-3 px-1">
          전체 조회수 <span className="text-ink font-bold">{totalViews.toLocaleString("ko-KR")}</span>
        </p>
      )}

      {folders.length === 0 ? (
        <div className="card p-14 text-center">
          <p className="t-sub">아직 폴더가 없습니다.</p>
          <Link href="/admin/folders/new" className="btn-primary mt-5">
            첫 폴더 만들기
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {folders.map((folder, index) => (
            <li
              key={folder.id}
              className="theme card flex flex-col gap-4 p-4 sm:flex-row sm:items-center"
              style={brandStyle(folder.theme_color)}
            >
              <div className="flex flex-col gap-1">
                <ReorderButton id={folder.id} direction="up" disabled={index === 0} />
                <ReorderButton id={folder.id} direction="down" disabled={index === folders.length - 1} />
              </div>

              {folder.thumbnail_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={folder.thumbnail_url} alt="" className="rounded-tds-lg h-16 w-16 shrink-0 object-cover" />
              ) : (
                <div className="rounded-tds-lg bg-brand-weak text-brand flex h-16 w-16 shrink-0 items-center justify-center text-lg font-black">
                  {folder.name.slice(0, 2)}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-ink truncate font-bold">{folder.name}</h2>
                  {folder.published ? (
                    <span className="badge badge-live">공개</span>
                  ) : (
                    <span className="badge">비공개</span>
                  )}
                  <span
                    className="border-line inline-flex h-5 items-center gap-1.5 rounded-full border pr-2 pl-1 font-mono text-[10px] font-semibold tracking-tight uppercase"
                    title="이 폴더의 테마 컬러"
                  >
                    <span className="bg-brand h-3 w-3 rounded-full" />
                    {folder.theme_color}
                  </span>
                </div>
                <p className="text-ink-3 mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs font-semibold">
                  <span className="truncate">/{folder.slug}</span>
                  <span className="inline-flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5" strokeWidth={2} />
                    {folder.post_count}
                  </span>
                  <span className="inline-flex items-center gap-1" title="폴더 + 글 전체 조회수">
                    <Eye className="h-3.5 w-3.5" strokeWidth={2} />
                    {folder.total_views.toLocaleString("ko-KR")}
                  </span>
                </p>
                {folder.description && <p className="text-ink-2 mt-1 truncate text-sm">{folder.description}</p>}
              </div>

              <div className="flex shrink-0 flex-wrap gap-2">
                <Link href={`/${encodeURIComponent(folder.slug)}`} target="_blank" className="btn-ghost btn-sm">
                  <ExternalLink className="h-3.5 w-3.5" />
                  보기
                </Link>
                <Link href={`/admin/folders/${folder.id}`} className="btn-primary btn-sm">
                  <Settings2 className="h-3.5 w-3.5" />
                  관리
                </Link>
                <form action={deleteFolderAction}>
                  <input type="hidden" name="id" value={folder.id} />
                  <ConfirmButton
                    className="btn-danger btn-sm"
                    message={`"${folder.name}" 폴더와 그 안의 글·사진이 모두 삭제됩니다. 계속할까요?`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
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
        className="icon-btn h-6 w-6 rounded-md"
      >
        {direction === "up" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
      </button>
    </form>
  );
}
