"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";

import ImageUploader from "@/components/ImageUploader";
import LinksEditor from "@/components/LinksEditor";
import SubmitButton from "@/components/SubmitButton";
import { savePostAction, type FormState } from "@/lib/actions";
import type { Post } from "@/lib/types";

export default function PostForm({
  folderId,
  post,
  inModal = false,
  onDone,
  onCancel,
}: {
  folderId: string;
  post?: Post;
  inModal?: boolean;
  /** 저장이 끝났을 때 (모달 닫기용) */
  onDone?: () => void;
  onCancel?: () => void;
}) {
  const [state, formAction] = useActionState<FormState, FormData>(savePostAction, {});
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  // 같은 결과를 두 번 처리하지 않도록 마지막으로 처리한 저장 시각을 기억한다
  const handled = useRef(0);

  useEffect(() => {
    if (!state.ok || !state.at || state.at === handled.current) return;
    handled.current = state.at;

    toast.success(post ? "저장했습니다." : "글을 등록했습니다.");
    // 모달에서 등록했으면 닫고, 수정 화면이었으면 폴더 화면으로 돌아간다
    if (onDone) onDone();
    else router.push(`/admin/folders/${folderId}`);
  }, [state, onDone, post, folderId, router]);

  /** 어느 칸에서든 Ctrl/Cmd + Enter 로 저장 (저장 버튼까지 스크롤할 필요 없이) */
  function onKeyDown(event: React.KeyboardEvent<HTMLFormElement>) {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      formRef.current?.requestSubmit();
    }
  }

  return (
    <form ref={formRef} action={formAction} onKeyDown={onKeyDown} className="form-stack" data-modal={inModal}>
      <div className="form-body">
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
              autoFocus={inModal}
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
              rows={inModal ? 5 : 8}
              className="input resize-y"
              placeholder="이 글의 내용을 적어 주세요. 줄바꿈은 그대로 보여집니다."
              defaultValue={post?.body ?? ""}
            />
          </div>
        </section>
      </div>

      <section className="form-actions card flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6">
        <label className="flex cursor-pointer items-center gap-2.5 text-sm font-semibold">
          <input
            type="checkbox"
            name="published"
            defaultChecked={post ? post.published : true}
            className="accent-brand h-[18px] w-[18px] cursor-pointer"
          />
          공개하기
        </label>

        <div className="flex items-center gap-2">
          <kbd className="text-ink-3 hidden text-[11px] font-medium sm:inline">⌘/Ctrl + Enter</kbd>
          {onCancel ? (
            <button type="button" className="btn-ghost" onClick={onCancel}>
              취소
            </button>
          ) : (
            <Link href={`/admin/folders/${folderId}`} className="btn-ghost">
              취소
            </Link>
          )}
          <SubmitButton>{post ? "변경사항 저장" : "글 등록"}</SubmitButton>
        </div>
      </section>
    </form>
  );
}
