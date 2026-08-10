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
import { useState } from "react";

import ConfirmButton from "@/components/ConfirmButton";
import { deletePostAction } from "@/lib/actions";
import type { Post } from "@/lib/types";

export default function SortablePostList({
  initialPosts,
  folderId,
}: {
  initialPosts: Post[];
  folderId: string;
}) {
  const [posts, setPosts] = useState(initialPosts);

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
      const oldIndex = posts.findIndex((p) => p.id === active.id);
      const newIndex = posts.findIndex((p) => p.id === over.id);

      const newPosts = arrayMove(posts, oldIndex, newIndex);
      setPosts(newPosts);

      // We should ideally call a reorderPostAction here to persist the new order.
    }
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
      className={`card flex flex-col gap-4 p-4 sm:flex-row sm:items-center ${isDragging ? "shadow-float" : ""}`}
    >
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
          {!post.published && <span className="badge">비공개</span>}
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

      <div className="flex shrink-0 gap-2">
        <Link href={\`/admin/folders/\${folderId}/posts/\${post.id}\`} className="btn-ghost btn-sm">
          <Pencil className="h-3.5 w-3.5" />
          수정
        </Link>
        <form action={deletePostAction}>
          <input type="hidden" name="id" value={post.id} />
          <input type="hidden" name="folder_id" value={folderId} />
          <ConfirmButton className="btn-danger btn-sm" message={\`"\${post.title}" 글을 삭제할까요?\`}>
            <Trash2 className="h-3.5 w-3.5" />
            삭제
          </ConfirmButton>
        </form>
      </div>
    </li>
  );
}
