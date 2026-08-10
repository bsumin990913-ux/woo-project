"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

import Modal from "@/components/Modal";
import PostForm from "@/components/PostForm";

export default function PostCreateModal({
  folderId,
  size = "sm",
  label = "새 글",
}: {
  folderId: string;
  /** 목록 안에서는 작게, 빈 상태 화면에서는 기본 크기로 */
  size?: "sm" | "md";
  label?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Modal
      open={open}
      onOpenChange={setOpen}
      title="새 글 쓰기"
      trigger={
        <button className={size === "sm" ? "btn-primary btn-sm" : "btn-primary"}>
          <Plus className="h-4 w-4" />
          {label}
        </button>
      }
    >
      <PostForm folderId={folderId} inModal onDone={() => setOpen(false)} onCancel={() => setOpen(false)} />
    </Modal>
  );
}
