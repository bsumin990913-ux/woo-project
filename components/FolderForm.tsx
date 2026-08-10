"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import ImageUploader from "@/components/ImageUploader";
import LinksEditor from "@/components/LinksEditor";
import SubmitButton from "@/components/SubmitButton";
import { saveFolderAction, type FormState } from "@/lib/actions";
import { slugify } from "@/lib/platform";
import type { Folder } from "@/lib/types";

export default function FolderForm({ folder }: { folder?: Folder }) {
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
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
          {state.error}
        </p>
      )}

      <section className="card space-y-5 p-5 sm:p-6">
        <h2 className="text-sm font-bold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">기본 정보</h2>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="name">
              폴더명 <span className="text-red-500">*</span>
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
              공개 주소 <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-1.5">
              <span className="shrink-0 text-sm text-zinc-400">/</span>
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
          <h2 className="text-sm font-bold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">링크</h2>
          <p className="hint">주소를 넣으면 인스타·유튜브·틱톡 등을 자동으로 알아보고 아이콘을 붙여 줍니다.</p>
        </div>
        <LinksEditor name="links" defaultValue={folder?.links ?? []} />
      </section>

      <section className="card flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6">
        <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium">
          <input
            type="checkbox"
            name="published"
            defaultChecked={folder ? folder.published : true}
            className="h-4 w-4 cursor-pointer accent-zinc-900 dark:accent-white"
          />
          공개하기
          <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">(끄면 나만 볼 수 있습니다)</span>
        </label>

        <div className="flex gap-2">
          <Link href="/admin" className="btn-ghost">
            취소
          </Link>
          <SubmitButton>{folder ? "변경사항 저장" : "폴더 만들기"}</SubmitButton>
        </div>
      </section>
    </form>
  );
}
