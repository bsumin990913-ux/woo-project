import "server-only";

import { cache } from "react";

import { supabasePublic, supabaseAdmin } from "@/lib/supabase";
import { normalizeFolder, normalizePost, type Folder, type FolderWithCount, type Post } from "@/lib/types";

type Row = Record<string, unknown>;

function countOf(row: Row): number {
  const embedded = row.posts;
  if (Array.isArray(embedded) && embedded.length > 0) {
    const first = embedded[0] as Record<string, unknown>;
    return Number(first?.count ?? 0);
  }
  return 0;
}

/* ── 방문자용 (published 만 보임 · RLS 적용) ───────────────── */

export async function listPublicFolders(): Promise<FolderWithCount[]> {
  const { data, error } = await supabasePublic()
    .from("folders")
    .select("*, posts(count)")
    .eq("published", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => ({ ...normalizeFolder(row as Row), post_count: countOf(row as Row) }));
}

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
  const { data, error } = await supabaseAdmin()
    .from("folders")
    .select("*, posts(count)")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => ({ ...normalizeFolder(row as Row), post_count: countOf(row as Row) }));
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
