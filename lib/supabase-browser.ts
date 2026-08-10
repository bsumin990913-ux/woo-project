"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/** lib/supabase.ts 의 MEDIA_BUCKET 과 같은 값. 서버 전용 코드를 클라이언트 번들로
 *  끌고 오지 않으려고 여기서 따로 선언한다. */
export const MEDIA_BUCKET = "media";

let cached: SupabaseClient | null = null;

/**
 * 브라우저에서 Storage 로 파일을 직접 올리기 위한 클라이언트.
 * 공개 키만 쓰고, 실제 업로드 권한은 서버가 발급한 서명 토큰이 갖는다.
 */
export function supabaseBrowser(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error("Supabase 환경변수(NEXT_PUBLIC_SUPABASE_URL / ANON_KEY)가 없습니다.");
  }

  cached = createClient(url, key, { auth: { persistSession: false } });
  return cached;
}
