import "server-only";

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

export async function getPublicFolderBySlug(slug: string): Promise<Folder | null> {
  const { data, error } = await supabasePublic()
    .from("folders")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();

  if (error) throw error;
  return data ? normalizeFolder(data as Row) : null;
}

export async function listPublicPosts(folderId: string): Promise<Post[]> {
  const { data, error } = await supabasePublic()
    .from("posts")
    .select("*")
    .eq("folder_id", folderId)
    .eq("published", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => normalizePost(row as Row));
}

export async function getPublicPost(folderId: string, postId: string): Promise<Post | null> {
  const { data, error } = await supabasePublic()
    .from("posts")
    .select("*")
    .eq("id", postId)
    .eq("folder_id", folderId)
    .eq("published", true)
    .maybeSingle();

  if (error) throw error;
  return data ? normalizePost(data as Row) : null;
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
