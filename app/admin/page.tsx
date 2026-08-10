import { Eye, ExternalLink, FileText, Globe, Lock, Settings2, Trash2 } from "lucide-react";
import Link from "next/link";

import FolderCreateModal from "@/components/FolderCreateModal";
import SortableFolderList from "@/components/SortableFolderList";
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
        <FolderCreateModal />
      </div>

      {/* 첫 화면(전체 목록) 공개 여부 */}
      <section className="card mb-6 flex flex-col sm:flex-row sm:items-center gap-4 p-5">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <span
            className={`rounded-tds-lg flex h-11 w-11 shrink-0 items-center justify-center ${
              settings.index_published ? "bg-brand-weak text-brand-weak-fg" : "bg-surface-2 text-ink-3"
            }`}
          >
            {settings.index_published ? <Globe className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
          </span>
          <div className="flex sm:hidden flex-wrap items-center gap-2">
            <h2 className="text-ink text-[15px] font-bold">첫 화면 전체 목록</h2>
            {settings.index_published ? (
              <span className="badge badge-live">공개</span>
            ) : (
              <span className="badge">비공개</span>
            )}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="hidden sm:flex flex-wrap items-center gap-2">
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
          <div className="mt-5">
            <FolderCreateModal />
          </div>
        </div>
      ) : (
        <SortableFolderList initialFolders={folders} />
      )}
    </>
  );
}
