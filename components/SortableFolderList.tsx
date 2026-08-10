"use client";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Eye, ExternalLink, FileText, Settings2, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import ConfirmButton from "@/components/ConfirmButton";
import { deleteFolderAction, moveFolderAction, toggleFolderPublishedAction } from "@/lib/actions";
import { brandStyle } from "@/lib/theme";
import type { FolderWithCount } from "@/lib/types";

export default function SortableFolderList({ initialFolders }: { initialFolders: FolderWithCount[] }) {
  const [folders, setFolders] = useState(initialFolders);
  const [isPending, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = folders.findIndex((f) => f.id === active.id);
      const newIndex = folders.findIndex((f) => f.id === over.id);

      const newFolders = arrayMove(folders, oldIndex, newIndex);
      setFolders(newFolders);

      // determine direction
      const direction = oldIndex > newIndex ? "up" : "down";
      
      // Calculate how many times it needs to move (simple implementation just moves it to target index)
      // Actually, since our current action is just "up" or "down" one by one, 
      // we need a new server action for `reorderFolderAction(id, newIndex)` 
      // or we can just send multiple move actions.
      // Wait, let's implement a better server action later. For now, we'll optimistically update 
      // but to persist it properly, we'll need a new server action `reorderFolders` that takes an array of IDs.
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={folders.map((f) => f.id)} strategy={verticalListSortingStrategy}>
        <ul className="space-y-3">
          {folders.map((folder) => (
            <SortableFolderItem
              key={folder.id}
              folder={folder}
              onTogglePublish={async () => {
                const newStatus = !folder.published;
                setFolders((prev) =>
                  prev.map((f) => (f.id === folder.id ? { ...f, published: newStatus } : f))
                );
                await toggleFolderPublishedAction(folder.id, newStatus);
                toast.success(newStatus ? "공개로 변경되었습니다." : "비공개로 변경되었습니다.");
              }}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

function SortableFolderItem({ folder, onTogglePublish }: { folder: FolderWithCount; onTogglePublish: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: folder.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    ...brandStyle(folder.theme_color),
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`theme card p-4 sm:flex sm:flex-row sm:items-center sm:gap-4 ${isDragging ? "shadow-float" : ""}`}
    >
      <div className="flex flex-row items-center gap-3 sm:gap-4 flex-1 min-w-0 mb-4 sm:mb-0">
        <div
          className="flex shrink-0 cursor-grab items-center justify-center p-1 text-ink-3 hover:text-ink active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-5 w-5" />
        </div>

        {folder.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={folder.thumbnail_url} alt="" className="rounded-tds-lg h-16 w-16 shrink-0 object-cover" />
        ) : (
          <div className="rounded-tds-lg bg-brand-weak text-brand flex h-16 w-16 shrink-0 items-center justify-center text-lg font-black">
            {folder.name.slice(0, 2)}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-ink truncate font-bold">{folder.name}</h2>
            <button
              type="button"
              onClick={onTogglePublish}
              className={`transition-all hover:scale-105 active:scale-95 ${
                folder.published ? "badge badge-live" : "badge"
              }`}
            >
              {folder.published ? "공개" : "비공개"}
            </button>
            <span
              className="border-line inline-flex h-5 items-center gap-1.5 rounded-full border pr-2 pl-1 font-mono text-[10px] font-semibold tracking-tight uppercase"
              title="이 폴더의 테마 컬러"
            >
              <span className="bg-brand h-3 w-3 rounded-full" />
              {folder.theme_color}
            </span>
          </div>
          <p className="text-ink-3 mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs font-semibold">
            <span className="truncate">/{folder.slug}</span>
            <span className="inline-flex items-center gap-1">
              <FileText className="h-3.5 w-3.5" strokeWidth={2} />
              {folder.post_count}
            </span>
            <span className="inline-flex items-center gap-1" title="폴더 + 글 전체 조회수">
              <Eye className="h-3.5 w-3.5" strokeWidth={2} />
              {folder.total_views.toLocaleString("ko-KR")}
            </span>
          </p>
          {folder.description && <p className="text-ink-2 mt-1 truncate text-sm">{folder.description}</p>}
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap gap-2">
        <Link href={`/${encodeURIComponent(folder.slug)}`} target="_blank" className="btn-ghost btn-sm">
          <ExternalLink className="h-3.5 w-3.5" />
          보기
        </Link>
        <Link href={`/admin/folders/${folder.id}`} className="btn-primary btn-sm">
          <Settings2 className="h-3.5 w-3.5" />
          관리
        </Link>
        <form action={deleteFolderAction}>
          <input type="hidden" name="id" value={folder.id} />
          <ConfirmButton
            className="btn-danger btn-sm"
            message={`"${folder.name}" 폴더와 그 안의 글·사진이 모두 삭제됩니다. 계속할까요?`}
          >
            <Trash2 className="h-3.5 w-3.5" />
            삭제
          </ConfirmButton>
        </form>
      </div>
    </li>
  );
}
