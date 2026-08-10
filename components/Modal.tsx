"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";

/**
 * 모바일에서는 아래에서 올라오는 바텀시트, 데스크톱에서는 가운데 모달.
 * 본문 스크롤과 하단 고정 버튼은 폼 쪽(.form-stack[data-modal])에서 처리한다.
 */
export default function Modal({
  open,
  onOpenChange,
  title,
  description,
  trigger,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  trigger: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-panel" aria-describedby={description ? undefined : ""}>
          <div className="dialog-head">
            {/* 모바일 바텀시트의 손잡이 */}
            <span className="sheet-grabber mb-3 sm:hidden" aria-hidden />
            <Dialog.Title className="dialog-title pr-10">{title}</Dialog.Title>
            {description && <Dialog.Description className="t-sub mt-1 text-[14px]">{description}</Dialog.Description>}
            <Dialog.Close className="dialog-close" aria-label="닫기">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>

          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
