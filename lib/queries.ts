import "server-only";

import { cache } from "react";

import { supabasePublic, supabaseAdmin } from "@/lib/supabase";
import {
  normalizeFolder,
  normalizePost,
  type Folder,
  type FolderWithCount,
  type Post,
  type SiteSettings,
} from "@/lib/types";

type Row = Record<string, unknown>;

/** 임베드된 posts(views) 배열에서 글 개수와 조회수 합을 뽑는다.
 *  방문자용 클라이언트에서는 RLS 덕분에 공개된 글만 들어온다. */
function rollup(row: Row): { post_count: number; post_views: number } {
  const embedded = Array.isArray(row.posts) ? (row.posts as Row[]) : [];
  return {
    post_count: embedded.length,
    post_views: embedded.reduce((sum, post) => sum + Number(post?.views ?? 0), 0),
  };
}

/** supabase/schema.sql 을 아직 다시 실행하지 않아 views 컬럼이 없는 상태인지 */
function isMissingViews(error: { message?: string } | null): boolean {
  return Boolean(error?.message && /views/.test(error.message));
}

function withRollup(row: Row): FolderWithCount {
  const folder = normalizeFolder(row);
  const { post_count, post_views } = rollup(row);
  return { ...folder, post_count, total_views: folder.views + post_views };
}

/* ── 방문자용 (published 만 보임 · RLS 적용) ───────────────── */

export async function listPublicFolders(): Promise<FolderWithCount[]> {
  // views 컬럼을 아직 안 만들었어도(스키마 재실행 전) 목록은 보여야 한다
  let { data, error } = await supabasePublic()
    .from("folders")
    .select("*, posts(views)")
    .eq("published", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error && isMissingViews(error)) {
    ({ data, error } = await supabasePublic()
      .from("folders")
      .select("*, posts(id)")
      .eq("published", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false }));
  }

  if (error) throw error;
  return (data ?? []).map((row) => withRollup(row as Row));
}

/** 사이트 전역 설정. 테이블/행이 없으면 "공개" 로 본다. */
export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  try {
    const { data, error } = await supabasePublic()
      .from("settings")
      .select("index_published")
      .eq("id", 1)
      .maybeSingle();

    if (error || !data) return { index_published: true };
    return { index_published: (data as Row).index_published !== false };
  } catch {
    return { index_published: true };
  }
});

/**
 * 한 번의 요청 안에서 generateMetadata · generateViewport · 페이지 본문이
 * 같은 폴더를 각각 조회하면 왕복이 3번 생긴다. React cache 로 묶어 1번만 나가게 한다.
 */
export const getPublicFolderBySlug = cache(async (slug: string): Promise<Folder | null> => {
  const { data, error } = await supabasePublic()
    .from("folders")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();

  if (error) throw error;
  return data ? normalizeFolder(data as Row) : null;
});

export const listPublicPosts = cache(async (folderId: string): Promise<Post[]> => {
  const { data, error } = await supabasePublic()
    .from("posts")
    .select("*")
    .eq("folder_id", folderId)
    .eq("published", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => normalizePost(row as Row));
});

export const getPublicPost = cache(async (folderId: string, postId: string): Promise<Post | null> => {
  const { data, error } = await supabasePublic()
    .from("posts")
    .select("*")
    .eq("id", postId)
    .eq("folder_id", folderId)
    .eq("published", true)
    .maybeSingle();

  if (error) throw error;
  return data ? normalizePost(data as Row) : null;
});

/** 빌드 시 정적 생성할 폴더 슬러그 목록. 실패해도 빌드를 막지 않는다. */
export async function listPublicSlugs(): Promise<string[]> {
  try {
    const { data, error } = await supabasePublic().from("folders").select("slug").eq("published", true);
    if (error) return [];
    return (data ?? []).map((row) => String((row as Row).slug ?? "")).filter(Boolean);
  } catch {
    return [];
  }
}

/** 빌드 시 정적 생성할 글 목록 (slug + postId). 실패해도 빌드를 막지 않는다. */
export async function listPublicPostParams(): Promise<{ slug: string; postId: string }[]> {
  try {
    const { data, error } = await supabasePublic()
      .from("posts")
      .select("id, folders!inner(slug, published)")
      .eq("published", true)
      .eq("folders.published", true);

    if (error) return [];
    return (data ?? [])
      .map((row) => {
        const folder = (row as Row).folders as { slug?: unknown } | null;
        return { slug: String(folder?.slug ?? ""), postId: String((row as Row).id ?? "") };
      })
      .filter((param) => param.slug && param.postId);
  } catch {
    return [];
  }
}

/* ── 관리자용 (비공개 포함 전부 보임) ──────────────────────── */

export async function listAllFolders(): Promise<FolderWithCount[]> {
  let { data, error } = await supabaseAdmin()
    .from("folders")
    .select("*, posts(views)")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error && isMissingViews(error)) {
    ({ data, error } = await supabaseAdmin()
      .from("folders")
      .select("*, posts(id)")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false }));
  }

  if (error) throw error;
  return (data ?? []).map((row) => withRollup(row as Row));
}

/**
 * 관리자용 설정 조회.
 * ready=false 면 settings 테이블이 아직 없다는 뜻이라, 화면에서 안내를 띄운다.
 */
export async function getSettingsForAdmin(): Promise<SiteSettings & { ready: boolean }> {
  const { data, error } = await supabaseAdmin()
    .from("settings")
    .select("index_published")
    .eq("id", 1)
    .maybeSingle();

  if (error) return { index_published: true, ready: false };
  if (!data) return { index_published: true, ready: true };
  return { index_published: (data as Row).index_published !== false, ready: true };
}

export async function getFolder(id: string): Promise<Folder | null> {
  const { data, error } = await supabaseAdmin().from("folders").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? normalizeFolder(data as Row) : null;
}

export async function listAllPosts(folderId: string): Promise<Post[]> {
  const { data, error } = await supabaseAdmin()
    .from("posts")
    .select("*")
    .eq("folder_id", folderId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => normalizePost(row as Row));
}

export async function getPost(id: string): Promise<Post | null> {
  const { data, error } = await supabaseAdmin().from("posts").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? normalizePost(data as Row) : null;
}
