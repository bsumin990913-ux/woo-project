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
import { GripVertical, Eye, Images, Link2, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";

import ConfirmButton from "@/components/ConfirmButton";
import PublishSwitch from "@/components/PublishSwitch";
import { deletePostAction, reorderPostsAction, togglePostPublishedAction } from "@/lib/actions";
import type { Post } from "@/lib/types";
import { toast } from "sonner";

export default function SortablePostList({
  initialPosts,
  folderId,
}: {
  initialPosts: Post[];
  folderId: string;
}) {
  const [posts, setPosts] = useState(initialPosts);
  const [, startTransition] = useTransition();
  // 저장이 날아가는 중에 서버 목록이 덮어쓰지 않게 잠깐 막는다
  const savingRef = useRef(false);

  useEffect(() => {
    if (!savingRef.current) setPosts(initialPosts);
  }, [initialPosts]);

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

    const oldIndex = posts.findIndex((p) => p.id === active.id);
    const newIndex = posts.findIndex((p) => p.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    // 화면은 즉시 바꾸고, 서버 저장이 실패하면 되돌린다
    const previous = posts;
    const next = arrayMove(posts, oldIndex, newIndex);
    setPosts(next);
    savingRef.current = true;

    startTransition(async () => {
      try {
        await reorderPostsAction(folderId, next.map((p) => p.id));
      } catch {
        setPosts(previous);
        toast.error("순서를 저장하지 못했습니다. 다시 시도해 주세요.");
      } finally {
        savingRef.current = false;
      }
    });
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={posts.map((p) => p.id)} strategy={verticalListSortingStrategy}>
        <ul className="space-y-3">
          {posts.map((post) => (
            <SortablePostItem key={post.id} post={post} folderId={folderId} />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

function SortablePostItem({ post, folderId }: { post: Post; folderId: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: post.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`card p-4 sm:flex sm:flex-row sm:items-center sm:gap-4 ${isDragging ? "shadow-float" : ""}`}
    >
      <div className="flex flex-row items-center gap-3 sm:gap-4 flex-1 min-w-0 mb-4 sm:mb-0">
        <div
          className="flex shrink-0 cursor-grab items-center justify-center p-1 text-ink-3 hover:text-ink active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-5 w-5" />
        </div>

        {post.images[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.images[0]} alt="" className="rounded-tds-lg h-14 w-14 shrink-0 object-cover" />
        ) : (
          <div className="rounded-tds-lg bg-surface-2 h-14 w-14 shrink-0" />
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-ink truncate font-bold">{post.title}</h3>
            <PublishSwitch published={post.published} onChange={(next) => togglePostPublishedAction(post.id, next)} />
          </div>
          <p className="text-ink-3 mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs font-semibold">
            <span className="inline-flex items-center gap-1">
              <Images className="h-3.5 w-3.5" strokeWidth={2} />
              {post.images.length}
            </span>
            <span className="inline-flex items-center gap-1">
              <Link2 className="h-3.5 w-3.5" strokeWidth={2} />
              {post.links.length}
            </span>
            <span className="inline-flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" strokeWidth={2} />
              {post.views.toLocaleString("ko-KR")}
            </span>
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Link href={`/admin/folders/${folderId}/posts/${post.id}`} className="btn-ghost btn-sm">
          <Pencil className="h-3.5 w-3.5" />
          수정
        </Link>
        <form action={deletePostAction} className="flex">
          <input type="hidden" name="id" value={post.id} />
          <input type="hidden" name="folder_id" value={folderId} />
          <ConfirmButton
            className="btn-danger"
            triggerClassName="icon-btn text-ink-3 hover:text-danger hover:border-danger/40 h-[34px] w-[34px] rounded-tds-sm"
            title={`"${post.title}" 글을 삭제할까요?`}
            message="이 글에 올린 사진도 함께 지워집니다. 되돌릴 수 없습니다."
            confirmLabel="글 삭제"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="sr-only">삭제</span>
          </ConfirmButton>
        </form>
      </div>
    </li>
  );
}
