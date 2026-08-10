"use client";

import Link from "next/link";
import { useActionState } from "react";

import ImageUploader from "@/components/ImageUploader";
import LinksEditor from "@/components/LinksEditor";
import SubmitButton from "@/components/SubmitButton";
import { savePostAction, type FormState } from "@/lib/actions";
import type { Post } from "@/lib/types";

export default function PostForm({ folderId, post }: { folderId: string; post?: Post }) {
  const [state, formAction] = useActionState<FormState, FormData>(savePostAction, {});

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="folder_id" value={folderId} />
      {post && <input type="hidden" name="id" value={post.id} />}

      {state.error && (
        <p className="rounded-tds-lg bg-danger-weak px-4 py-3.5 text-sm font-medium text-danger">{state.error}</p>
      )}

      <section className="card space-y-5 p-5 sm:p-6">
        <div>
          <label className="label" htmlFor="title">
            제목 <span className="text-danger">*</span>
          </label>
          <input
            id="title"
            name="title"
            className="input"
            placeholder="예) 1차 시안 공개"
            defaultValue={post?.title ?? ""}
            required
          />
        </div>

        <div>
          <label className="label">링크</label>
          <LinksEditor name="links" defaultValue={post?.links ?? []} />
        </div>

        <div>
          <label className="label">사진</label>
          <p className="hint mt-0 mb-2">여러 장 넣을 수 있고, 첫 번째 사진이 목록의 대표 이미지가 됩니다.</p>
          <ImageUploader name="images" defaultValue={post?.images ?? []} />
        </div>

        <div>
          <label className="label" htmlFor="body">
            소개
          </label>
          <textarea
            id="body"
            name="body"
            rows={8}
            className="input resize-y"
            placeholder="이 글의 내용을 적어 주세요. 줄바꿈은 그대로 보여집니다."
            defaultValue={post?.body ?? ""}
          />
        </div>
      </section>

      <section className="card flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6">
        <label className="flex cursor-pointer items-center gap-2.5 text-sm font-semibold">
          <input
            type="checkbox"
            name="published"
            defaultChecked={post ? post.published : true}
            className="accent-brand h-[18px] w-[18px] cursor-pointer"
          />
          공개하기
        </label>

        <div className="flex gap-2">
          <Link href={`/admin/folders/${folderId}`} className="btn-ghost">
            취소
          </Link>
          <SubmitButton>{post ? "변경사항 저장" : "글 등록"}</SubmitButton>
        </div>
      </section>
    </form>
  );
}
