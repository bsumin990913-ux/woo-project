"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createSession, destroySession, isAdminPasswordSet, requireAdmin, verifyPassword } from "@/lib/auth";
import { MEDIA_BUCKET, supabaseAdmin } from "@/lib/supabase";
import { normalizeUrl } from "@/lib/platform";
import { safeBrand } from "@/lib/theme";
import { normalizeImages, normalizeLinks, type LinkItem } from "@/lib/types";

export type FormState = { error?: string };

/* ── 공통 유틸 ─────────────────────────────────────────────── */

function str(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function bool(formData: FormData, key: string): boolean {
  return formData.get(key) === "on" || formData.get(key) === "true";
}

function parseLinks(raw: string): LinkItem[] {
  try {
    return normalizeLinks(JSON.parse(raw || "[]")).map((link) => ({
      label: link.label.trim(),
      url: normalizeUrl(link.url),
    }));
  } catch {
    return [];
  }
}

function parseImages(raw: string): string[] {
  try {
    return normalizeImages(JSON.parse(raw || "[]"));
  } catch {
    return [];
  }
}

/** 퍼블릭 URL → 스토리지 내부 경로 (삭제용). 우리 버킷이 아니면 null. */
function storagePath(publicUrl: string): string | null {
  const marker = `/storage/v1/object/public/${MEDIA_BUCKET}/`;
  const index = publicUrl.indexOf(marker);
  if (index === -1) return null;
  return decodeURIComponent(publicUrl.slice(index + marker.length));
}

async function removeFromStorage(urls: (string | null | undefined)[]): Promise<void> {
  const paths = urls.map((u) => (u ? storagePath(u) : null)).filter((p): p is string => !!p);
  if (paths.length === 0) return;
  // 스토리지 정리는 실패해도 본 작업을 막지 않는다
  await supabaseAdmin().storage.from(MEDIA_BUCKET).remove(paths).catch(() => undefined);
}

function refreshPublic(slug?: string, postId?: string) {
  revalidatePath("/");
  revalidatePath("/admin");
  if (slug) {
    revalidatePath(`/${slug}`);
    if (postId) revalidatePath(`/${slug}/${postId}`);
  }
}

/* ── 인증 ──────────────────────────────────────────────────── */

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!isAdminPasswordSet()) {
    return { error: "ADMIN_PASSWORD 환경변수가 설정되지 않았습니다. .env.local 을 확인해 주세요." };
  }
  if (!verifyPassword(str(formData, "password"))) {
    return { error: "비밀번호가 올바르지 않습니다." };
  }
  await createSession();
  redirect("/admin");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/login");
}

/* ── 폴더 ──────────────────────────────────────────────────── */

export async function saveFolderAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();

  const id = str(formData, "id");
  const name = str(formData, "name");
  const slug = str(formData, "slug");

  if (!name) return { error: "폴더명을 입력해 주세요." };
  if (!slug) return { error: "주소(슬러그)를 입력해 주세요." };
  if (slug === "admin" || slug === "login" || slug === "api") {
    return { error: `"${slug}" 는 예약된 주소라 사용할 수 없습니다.` };
  }

  const payload = {
    name,
    slug,
    description: str(formData, "description"),
    intro: str(formData, "intro"),
    thumbnail_url: str(formData, "thumbnail_url") || null,
    links: parseLinks(str(formData, "links")),
    theme_color: safeBrand(str(formData, "theme_color")),
    published: bool(formData, "published"),
  };

  const db = supabaseAdmin();
  let targetId = id;

  if (id) {
    const { error } = await db.from("folders").update(payload).eq("id", id);
    if (error) return { error: friendlyDbError(error.message, slug) };
  } else {
    const { data, error } = await db.from("folders").insert(payload).select("id").single();
    if (error) return { error: friendlyDbError(error.message, slug) };
    targetId = String(data.id);
  }

  refreshPublic(slug);
  redirect(`/admin/folders/${targetId}?saved=1`);
}

export async function deleteFolderAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = str(formData, "id");
  if (!id) redirect("/admin");

  const db = supabaseAdmin();
  const { data: folder } = await db.from("folders").select("slug, thumbnail_url").eq("id", id).maybeSingle();
  const { data: posts } = await db.from("posts").select("images").eq("folder_id", id);

  const urls: (string | null)[] = [folder?.thumbnail_url ?? null];
  for (const post of posts ?? []) urls.push(...normalizeImages((post as { images: unknown }).images));
  await removeFromStorage(urls);

  await db.from("folders").delete().eq("id", id); // posts 는 ON DELETE CASCADE
  refreshPublic(folder?.slug);
  redirect("/admin");
}

export async function moveFolderAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = str(formData, "id");
  const direction = str(formData, "direction") === "up" ? -1 : 1;

  const db = supabaseAdmin();
  const { data } = await db
    .from("folders")
    .select("id, sort_order, created_at")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as { id: string }[];
  const index = rows.findIndex((row) => row.id === id);
  const target = index + direction;
  if (index === -1 || target < 0 || target >= rows.length) redirect("/admin");

  const reordered = [...rows];
  [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
  await Promise.all(reordered.map((row, i) => db.from("folders").update({ sort_order: i }).eq("id", row.id)));

  refreshPublic();
  redirect("/admin");
}

/* ── 글 ────────────────────────────────────────────────────── */

export async function savePostAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();

  const id = str(formData, "id");
  const folderId = str(formData, "folder_id");
  const title = str(formData, "title");

  if (!folderId) return { error: "폴더 정보가 없습니다. 페이지를 새로고침해 주세요." };
  if (!title) return { error: "제목을 입력해 주세요." };

  const payload = {
    folder_id: folderId,
    title,
    links: parseLinks(str(formData, "links")),
    images: parseImages(str(formData, "images")),
    body: str(formData, "body"),
    published: bool(formData, "published"),
  };

  const db = supabaseAdmin();
  if (id) {
    const { error } = await db.from("posts").update(payload).eq("id", id);
    if (error) return { error: error.message };
  } else {
    const { error } = await db.from("posts").insert(payload);
    if (error) return { error: error.message };
  }

  const { data: folder } = await db.from("folders").select("slug").eq("id", folderId).maybeSingle();
  refreshPublic(folder?.slug, id || undefined);
  redirect(`/admin/folders/${folderId}?saved=1`);
}

export async function deletePostAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = str(formData, "id");
  const folderId = str(formData, "folder_id");

  const db = supabaseAdmin();
  const { data: post } = await db.from("posts").select("images").eq("id", id).maybeSingle();
  await removeFromStorage(normalizeImages((post as { images?: unknown } | null)?.images));

  await db.from("posts").delete().eq("id", id);

  const { data: folder } = await db.from("folders").select("slug").eq("id", folderId).maybeSingle();
  refreshPublic(folder?.slug, id);
  redirect(`/admin/folders/${folderId}`);
}

export async function movePostAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = str(formData, "id");
  const folderId = str(formData, "folder_id");
  const direction = str(formData, "direction") === "up" ? -1 : 1;

  const db = supabaseAdmin();
  const { data } = await db
    .from("posts")
    .select("id, sort_order, created_at")
    .eq("folder_id", folderId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as { id: string }[];
  const index = rows.findIndex((row) => row.id === id);
  const target = index + direction;
  if (index === -1 || target < 0 || target >= rows.length) redirect(`/admin/folders/${folderId}`);

  const reordered = [...rows];
  [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
  await Promise.all(reordered.map((row, i) => db.from("posts").update({ sort_order: i }).eq("id", row.id)));

  const { data: folder } = await db.from("folders").select("slug").eq("id", folderId).maybeSingle();
  refreshPublic(folder?.slug);
  redirect(`/admin/folders/${folderId}`);
}

/* ── 에러 문구 다듬기 ──────────────────────────────────────── */

function friendlyDbError(message: string, slug: string): string {
  if (message.includes("duplicate key") || message.includes("folders_slug_key")) {
    return `주소 "${slug}" 는 이미 다른 폴더가 쓰고 있습니다. 다른 주소를 입력해 주세요.`;
  }
  if (message.includes('relation "public.folders" does not exist')) {
    return "테이블이 아직 없습니다. supabase/schema.sql 을 Supabase SQL Editor 에서 실행해 주세요.";
  }
  if (message.includes("theme_color")) {
    return "테마 컬러 컬럼이 아직 없습니다. supabase/schema.sql 을 Supabase SQL Editor 에서 다시 한 번 실행해 주세요.";
  }
  return message;
}
