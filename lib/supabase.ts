import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export class SupabaseNotConfiguredError extends Error {
  constructor(missing: string[]) {
    super(`Supabase 환경변수가 없습니다: ${missing.join(", ")}`);
    this.name = "SupabaseNotConfiguredError";
  }
}

/**
 * Supabase 가 키 이름을 바꿨다(anon → publishable, service_role → secret).
 * 어느 쪽 이름으로 넣어도 동작하도록 둘 다 받아준다.
 */
function publicKey(): string | undefined {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
}

function secretKey(): string | undefined {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && publicKey());
}

/** 방문자용(읽기 전용). RLS 가 걸려 있어 공개된 행만 보인다. */
export function supabasePublic(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = publicKey();
  const missing: string[] = [];
  if (!url) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!key) missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  if (missing.length) throw new SupabaseNotConfiguredError(missing);

  return createClient(url!, key!, { auth: { persistSession: false } });
}

/**
 * 관리자용(읽기·쓰기). service_role 키를 쓰므로 RLS 를 우회한다.
 * 반드시 서버(서버 컴포넌트 / 서버 액션 / 라우트 핸들러)에서만 호출할 것.
 */
export function supabaseAdmin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = secretKey();
  const missing: string[] = [];
  if (!url) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!key) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  if (missing.length) throw new SupabaseNotConfiguredError(missing);

  return createClient(url!, key!, { auth: { persistSession: false } });
}

export const MEDIA_BUCKET = "media";
