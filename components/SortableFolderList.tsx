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
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import ConfirmButton from "@/components/ConfirmButton";
import PostCreateModal from "@/components/PostCreateModal";
import PublishSwitch from "@/components/PublishSwitch";
import { deleteFolderAction, reorderFoldersAction, toggleFolderPublishedAction } from "@/lib/actions";
import { brandStyle } from "@/lib/theme";
import type { FolderWithCount } from "@/lib/types";

export default function SortableFolderList({ initialFolders }: { initialFolders: FolderWithCount[] }) {
  const [folders, setFolders] = useState(initialFolders);
  const [, startTransition] = useTransition();
  // 저장이 날아가는 중에 서버 목록이 덮어쓰지 않게 잠깐 막는다
  const savingRef = useRef(false);

  useEffect(() => {
    if (!savingRef.current) setFolders(initialFolders);
  }, [initialFolders]);

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

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = folders.findIndex((f) => f.id === active.id);
    const newIndex = folders.findIndex((f) => f.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    // 화면은 즉시 바꾸고, 서버 저장이 실패하면 되돌린다
    const previous = folders;
    const next = arrayMove(folders, oldIndex, newIndex);
    setFolders(next);
    savingRef.current = true;

    startTransition(async () => {
      try {
        await reorderFoldersAction(next.map((f) => f.id));
      } catch {
        setFolders(previous);
        toast.error("순서를 저장하지 못했습니다. 다시 시도해 주세요.");
      } finally {
        savingRef.current = false;
      }
    });
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={folders.map((f) => f.id)} strategy={verticalListSortingStrategy}>
        <ul className="space-y-3">
          {folders.map((folder) => (
            <SortableFolderItem key={folder.id} folder={folder} />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

function SortableFolderItem({ folder }: { folder: FolderWithCount }) {
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
            <PublishSwitch
              published={folder.published}
              onChange={(next) => toggleFolderPublishedAction(folder.id, next)}
            />
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

      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {/* 이 폴더에 글을 쓰러 갈 때 "관리" 로 한 번 들어갔다 나올 필요가 없다 */}
        <PostCreateModal folderId={folder.id} label="글" />
        <Link href={`/${encodeURIComponent(folder.slug)}`} target="_blank" className="btn-ghost btn-sm">
          <ExternalLink className="h-3.5 w-3.5" />
          보기
        </Link>
        <Link href={`/admin/folders/${folder.id}`} className="btn-ghost btn-sm">
          <Settings2 className="h-3.5 w-3.5" />
          관리
        </Link>
        <form action={deleteFolderAction} className="flex">
          <input type="hidden" name="id" value={folder.id} />
          {/* 되돌릴 수 없는 동작이라 아이콘만 두고 무게를 낮춘다 */}
          <ConfirmButton
            className="btn-danger"
            triggerClassName="icon-btn text-ink-3 hover:text-danger hover:border-danger/40 h-[34px] w-[34px] rounded-tds-sm"
            title={`"${folder.name}" 폴더를 삭제할까요?`}
            message="폴더 안의 글과 사진이 모두 함께 지워집니다. 되돌릴 수 없습니다."
            confirmLabel="폴더 삭제"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="sr-only">삭제</span>
          </ConfirmButton>
        </form>
      </div>
    </li>
  );
}
