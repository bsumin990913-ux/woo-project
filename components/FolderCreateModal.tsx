"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

import FolderForm from "@/components/FolderForm";
import Modal from "@/components/Modal";

export default function FolderCreateModal({ label = "새 폴더" }: { label?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <Modal
      open={open}
      onOpenChange={setOpen}
      title="새 폴더 만들기"
      description="만들고 나면 이 폴더 안에 글을 계속 추가할 수 있습니다."
      trigger={
        <button className="btn-primary">
          <Plus className="h-4 w-4" />
          {label}
        </button>
      }
    >
      <FolderForm inModal onCancel={() => setOpen(false)} />
    </Modal>
  );
}
