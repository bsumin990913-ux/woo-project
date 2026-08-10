"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";

/**
 * 삭제처럼 되돌릴 수 없는 동작 앞에 확인 단계를 둔다.
 * 예전에는 window.confirm 을 썼는데, 프로젝트의 다른 다이얼로그와 생김새가 완전히 달랐다.
 *
 * 폼 안에 두고 쓴다. 확인을 누르면 그때 폼을 제출한다.
 */
export default function ConfirmButton({
  children,
  title,
  message,
  confirmLabel = "삭제",
  className = "btn-danger",
  triggerClassName,
  pendingLabel = "처리 중…",
}: {
  children: React.ReactNode;
  title?: string;
  message: string;
  confirmLabel?: string;
  className?: string;
  /** 트리거 버튼에만 다른 모양을 주고 싶을 때 */
  triggerClassName?: string;
  pendingLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const { pending } = useFormStatus();
  const triggerRef = useRef<HTMLButtonElement>(null);

  /** 다이얼로그는 Portal 로 폼 바깥에 그려지므로 submit 버튼이 폼에 닿지 않는다.
   *  트리거가 속한 폼을 직접 찾아 제출한다. */
  function confirm() {
    setOpen(false);
    triggerRef.current?.form?.requestSubmit();
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={pending ? `${triggerClassName ?? className} btn-loading` : (triggerClassName ?? className)}
        disabled={pending}
        aria-busy={pending}
        aria-label={pending ? pendingLabel : undefined}
        onClick={() => setOpen(true)}
      >
        {children}
      </button>

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="dialog-overlay" />
          <Dialog.Content className="dialog-panel">
            <div className="dialog-head">
              <span className="sheet-grabber mb-3 sm:hidden" aria-hidden />
              <Dialog.Title className="dialog-title">{title ?? "정말 삭제할까요?"}</Dialog.Title>
              <Dialog.Description className="t-sub mt-2 text-[14px]">{message}</Dialog.Description>
            </div>

            <div className="border-line bg-surface flex justify-end gap-2 border-t px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6">
              <Dialog.Close className="btn-ghost">취소</Dialog.Close>
              {/* 확인을 누른 뒤에야 진짜 제출된다 */}
              <button type="button" className={className} onClick={confirm} autoFocus>
                {confirmLabel}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
