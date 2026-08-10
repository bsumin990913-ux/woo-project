"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import ImageUploader from "@/components/ImageUploader";
import LinksEditor from "@/components/LinksEditor";
import SubmitButton from "@/components/SubmitButton";
import ThemePicker from "@/components/ThemePicker";
import { saveFolderAction, type FormState } from "@/lib/actions";
import { slugify } from "@/lib/platform";
import type { Folder } from "@/lib/types";

export default function FolderForm({ folder, onSuccess }: { folder?: Folder; onSuccess?: () => void }) {
  const [state, formAction] = useActionState<FormState, FormData>(saveFolderAction, {});
  const [name, setName] = useState(folder?.name ?? "");
  const [slug, setSlug] = useState(folder?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(folder?.slug));

  function onNameChange(value: string) {
    setName(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  return (
    <form action={formAction} className="space-y-6">
      {folder && <input type="hidden" name="id" value={folder.id} />}

      {state.error && (
        <p className="rounded-tds-lg bg-danger-weak px-4 py-3.5 text-sm font-medium text-danger">{state.error}</p>
      )}

      <section className="card space-y-5 p-5 sm:p-6">
        <h2 className="t-eyebrow">기본 정보</h2>

        <div className="grid gap-5 sm:grid-cols-2">
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
              required
            />
          </div>

          <div>
            <label className="label" htmlFor="slug">
              공개 주소 <span className="text-danger">*</span>
            </label>
            <div className="flex items-center gap-1.5">
              <span className="text-ink-3 shrink-0 text-sm">/</span>
              <input
                id="slug"
                name="slug"
                className="input"
                placeholder="brand-renewal"
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(slugify(e.target.value));
                }}
                required
              />
            </div>
            <p className="hint">방문자가 보게 될 주소입니다. 영문·숫자·한글 사용 가능.</p>
          </div>
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
          <ImageUploader name="thumbnail_url" single defaultValue={folder?.thumbnail_url ? [folder.thumbnail_url] : []} />
        </div>

        <div>
          <label className="label" htmlFor="intro">
            소개글
          </label>
          <textarea
            id="intro"
            name="intro"
            rows={6}
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
            폴더마다 핵심 컬러를 따로 정할 수 있어요. 버튼·아이콘·배경·포커스 색이 이 한 가지 색에서 자동으로 만들어집니다.
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

      <section className="card flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6">
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

        <div className="flex gap-2">
          {onSuccess ? (
            <button type="button" className="btn-ghost" onClick={onSuccess}>
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
