"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import ImageUploader from "@/components/ImageUploader";
import LinksEditor from "@/components/LinksEditor";
import SubmitButton from "@/components/SubmitButton";
import ThemePicker from "@/components/ThemePicker";
import { saveFolderAction, type FormState } from "@/lib/actions";
import { slugify } from "@/lib/platform";
import type { Folder } from "@/lib/types";

export default function FolderForm({
  folder,
  inModal = false,
  onCancel,
}: {
  folder?: Folder;
  inModal?: boolean;
  onCancel?: () => void;
}) {
  const [state, formAction] = useActionState<FormState, FormData>(saveFolderAction, {});
  const [name, setName] = useState(folder?.name ?? "");
  const [slug, setSlug] = useState(folder?.slug ?? "");
  // 이미 있는 폴더는 주소가 이미 공유돼 있을 수 있다. 이름을 고쳐도 주소는 따라가지 않는다.
  const [slugTouched, setSlugTouched] = useState(Boolean(folder?.slug));
  // 주소는 폴더명에서 자동으로 만들어진다. 바꾸고 싶을 때만 펼친다.
  const [slugOpen, setSlugOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  // 같은 결과를 두 번 처리하지 않도록 마지막으로 처리한 저장 시각을 기억한다
  const handled = useRef(0);

  // 새로 만들 때는 서버가 새 폴더 화면으로 보내 준다. 여기 오는 건 "수정 저장" 뿐.
  useEffect(() => {
    if (!state.ok || !state.at || state.at === handled.current) return;
    handled.current = state.at;
    toast.success("저장했습니다.");
  }, [state]);

  function onNameChange(value: string) {
    setName(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  /** 어느 칸에서든 Ctrl/Cmd + Enter 로 저장 */
  function onKeyDown(event: React.KeyboardEvent<HTMLFormElement>) {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      formRef.current?.requestSubmit();
    }
  }

  return (
    <form ref={formRef} action={formAction} onKeyDown={onKeyDown} className="form-stack" data-modal={inModal}>
      <div className="form-body">
        {folder && <input type="hidden" name="id" value={folder.id} />}

        {state.error && (
          <p className="rounded-tds-lg bg-danger-weak px-4 py-3.5 text-sm font-medium text-danger">{state.error}</p>
        )}

        <section className="card space-y-5 p-5 sm:p-6">
          <h2 className="t-eyebrow">기본 정보</h2>

          <div>
            <label className="label" htmlFor="name">
              폴더명 <span className="text-danger">*</span>
            </label>
            <input
              id="name"
              name="name"
              className="input"
              placeholder="예) 브랜드 리뉴얼 프로젝트"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              autoFocus={inModal}
              required
            />

            {/* 공개 주소는 폴더명에서 자동 생성된다.
                별도 필수 입력칸으로 늘 띄워 두면 새 폴더 만들 때 생각할 게 하나 더 늘어난다. */}
            <input type="hidden" name="slug" value={slug} />
            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-ink-3 min-w-0 truncate font-mono text-[13px]">
                {slug ? `/${slug}` : "/폴더명에서-자동-생성"}
              </span>
              {!slugOpen && (
                <button
                  type="button"
                  className="text-ink-3 hover:text-brand cursor-pointer text-[13px] font-semibold underline underline-offset-2"
                  onClick={() => setSlugOpen(true)}
                >
                  주소 직접 정하기
                </button>
              )}
            </div>

            {slugOpen && (
              <div className="mt-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-ink-3 shrink-0 text-sm">/</span>
                  <input
                    id="slug"
                    className="input"
                    placeholder="brand-renewal"
                    value={slug}
                    onChange={(e) => {
                      setSlugTouched(true);
                      setSlug(slugify(e.target.value));
                    }}
                    aria-label="공개 주소"
                  />
                </div>
                <p className="hint">방문자가 보게 될 주소입니다. 영문·숫자·한글 사용 가능.</p>
              </div>
            )}
          </div>

          <div>
            <label className="label" htmlFor="description">
              한 줄 설명
            </label>
            <input
              id="description"
              name="description"
              className="input"
              placeholder="목록 카드에 작게 표시되는 문구"
              defaultValue={folder?.description ?? ""}
            />
          </div>

          <div>
            <label className="label">썸네일</label>
            <ImageUploader
              name="thumbnail_url"
              single
              defaultValue={folder?.thumbnail_url ? [folder.thumbnail_url] : []}
            />
          </div>

          <div>
            <label className="label" htmlFor="intro">
              소개글
            </label>
            <textarea
              id="intro"
              name="intro"
              rows={inModal ? 4 : 6}
              className="input resize-y"
              placeholder="이 프로젝트가 어떤 작업인지 소개해 주세요. 줄바꿈은 그대로 보여집니다."
              defaultValue={folder?.intro ?? ""}
            />
          </div>
        </section>

        <section className="card space-y-4 p-5 sm:p-6">
          <div>
            <h2 className="t-eyebrow">테마</h2>
            <p className="hint">
              폴더마다 핵심 컬러를 따로 정할 수 있어요. 버튼·아이콘·배경·포커스 색이 이 한 가지 색에서 자동으로
              만들어집니다.
            </p>
          </div>
          <ThemePicker name="theme_color" defaultValue={folder?.theme_color} />
        </section>

        <section className="card space-y-4 p-5 sm:p-6">
          <div>
            <h2 className="t-eyebrow">링크</h2>
            <p className="hint">주소를 넣으면 인스타·유튜브·틱톡 등을 자동으로 알아보고 아이콘을 붙여 줍니다.</p>
          </div>
          <LinksEditor name="links" defaultValue={folder?.links ?? []} />
        </section>
      </div>

      <section className="form-actions card flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6">
        <label className="flex cursor-pointer items-center gap-2.5 text-sm font-semibold">
          <input
            type="checkbox"
            name="published"
            defaultChecked={folder ? folder.published : true}
            className="accent-brand h-[18px] w-[18px] cursor-pointer"
          />
          공개하기
          <span className="text-ink-3 text-xs font-normal">(끄면 나만 볼 수 있습니다)</span>
        </label>

        <div className="flex items-center gap-2">
          <kbd className="text-ink-3 hidden text-[11px] font-medium sm:inline">⌘/Ctrl + Enter</kbd>
          {onCancel ? (
            <button type="button" className="btn-ghost" onClick={onCancel}>
              취소
            </button>
          ) : (
            <Link href="/admin" className="btn-ghost">
              취소
            </Link>
          )}
          <SubmitButton>{folder ? "변경사항 저장" : "폴더 만들기"}</SubmitButton>
        </div>
      </section>
    </form>
  );
}
