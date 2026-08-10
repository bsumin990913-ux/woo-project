"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createSession, destroySession, isAdminPasswordSet, requireAdmin, verifyPassword } from "@/lib/auth";
import { stripSize } from "@/lib/image";
import { MEDIA_BUCKET, supabaseAdmin } from "@/lib/supabase";
import { normalizeUrl } from "@/lib/platform";
import { safeBrand } from "@/lib/theme";
import { normalizeImages, normalizeLinks, type LinkItem } from "@/lib/types";

/**
 * 폼 액션의 결과.
 * - `error` 가 있으면 폼 위에 그대로 띄운다.
 * - `ok` 는 "저장됐다"는 신호. 클라이언트가 토스트를 띄우고 모달을 닫는 데 쓴다.
 *   같은 값을 두 번 받아도 구분할 수 있게 매번 새 `at` 타임스탬프를 붙인다.
 */
export type FormState = { error?: string; ok?: boolean; at?: number };

function saved(): FormState {
  return { ok: true, at: Date.now() };
}

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
  // 주소 뒤에 붙은 `#가로x세로` 를 떼지 않으면 경로가 어긋나 파일이 지워지지 않는다
  const clean = stripSize(publicUrl);
  const marker = `/storage/v1/object/public/${MEDIA_BUCKET}/`;
  const index = clean.indexOf(marker);
  if (index === -1) return null;
  return decodeURIComponent(clean.slice(index + marker.length));
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

/* ── 사이트 설정 ───────────────────────────────────────────── */

/** 첫 화면(/)의 전체 목록 공개 여부를 바꾼다. */
export async function setIndexPublishedAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const next = str(formData, "value") === "true";

  await supabaseAdmin()
    .from("settings")
    .upsert({ id: 1, index_published: next }, { onConflict: "id" });

  revalidatePath("/");
  revalidatePath("/admin");
  redirect("/admin");
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

  // 수정: 이미 그 폴더 화면에 있으므로 이동하지 않는다. 토스트만 띄우면 된다.
  if (id) {
    const { error } = await db.from("folders").update(payload).eq("id", id);
    if (error) return { error: friendlyDbError(error.message, slug) };
    refreshPublic(slug);
    return saved();
  }

  // 새로 만들 때만 이동한다. 만든 직후엔 그 폴더에 글을 넣으러 가는 게 자연스럽다.
  const { data, error } = await db.from("folders").insert(payload).select("id").single();
  if (error) return { error: friendlyDbError(error.message, slug) };

  refreshPublic(slug);
  redirect(`/admin/folders/${String(data.id)}`);
}

/** 드래그로 바뀐 순서를 통째로 저장한다. 배열 순서가 그대로 sort_order 가 된다. */
export async function reorderFoldersAction(ids: string[]): Promise<void> {
  await requireAdmin();
  if (ids.length === 0) return;

  const db = supabaseAdmin();
  await Promise.all(ids.map((id, index) => db.from("folders").update({ sort_order: index }).eq("id", id)));
  refreshPublic();
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

export async function toggleFolderPublishedAction(id: string, published: boolean): Promise<void> {
  await requireAdmin();
  const db = supabaseAdmin();
  await db.from("folders").update({ published }).eq("id", id);
  const { data } = await db.from("folders").select("slug").eq("id", id).maybeSingle();
  refreshPublic(data?.slug);
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

  // 리다이렉트하지 않는다. 모달에서 등록한 경우 같은 주소로 되돌아오면
  // 모달이 열린 채로 남아 "저장이 안 됐나?" 하고 한 번 더 누르게 된다.
  // 어디로 갈지는 화면 쪽에서 정하게 두고, 여기서는 결과만 알려 준다.
  return saved();
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

/** 드래그로 바뀐 순서를 통째로 저장한다. 배열 순서가 그대로 sort_order 가 된다. */
export async function reorderPostsAction(folderId: string, ids: string[]): Promise<void> {
  await requireAdmin();
  if (ids.length === 0) return;

  const db = supabaseAdmin();
  await Promise.all(ids.map((id, index) => db.from("posts").update({ sort_order: index }).eq("id", id)));

  const { data: folder } = await db.from("folders").select("slug").eq("id", folderId).maybeSingle();
  refreshPublic(folder?.slug);
}

export async function togglePostPublishedAction(id: string, published: boolean): Promise<void> {
  await requireAdmin();
  const db = supabaseAdmin();
  await db.from("posts").update({ published }).eq("id", id);
  const { data } = await db.from("posts").select("folder_id").eq("id", id).maybeSingle();
  if (data?.folder_id) {
    const { data: folder } = await db.from("folders").select("slug").eq("id", data.folder_id).maybeSingle();
    refreshPublic(folder?.slug, id);
  }
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
