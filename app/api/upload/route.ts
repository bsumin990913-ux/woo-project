import { NextResponse } from "next/server";

import { isAuthenticated } from "@/lib/auth";
import { MEDIA_BUCKET, supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

const MAX_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];

type Requested = { name?: unknown; type?: unknown; size?: unknown };

/**
 * 사진 바이트는 이 서버를 거치지 않는다.
 * 여기서는 파일 1개당 "서명된 업로드 URL" 만 만들어 주고,
 * 브라우저가 Supabase Storage 로 직접 올린다.
 *
 * 이렇게 하면 Vercel 함수의 요청 본문 제한(4.5MB)에 걸리지 않고,
 * 파일이 서버를 한 번 더 거치지 않으니 업로드도 더 빠르다.
 */
export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "로그인이 필요합니다. 다시 로그인해 주세요." }, { status: 401 });
  }

  let body: { files?: Requested[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "요청을 읽지 못했습니다." }, { status: 400 });
  }

  const requested = Array.isArray(body.files) ? body.files : [];
  if (requested.length === 0) return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 });
  if (requested.length > 20) return NextResponse.json({ error: "한 번에 최대 20장까지 올릴 수 있어요." }, { status: 400 });

  const storage = supabaseAdmin().storage.from(MEDIA_BUCKET);
  const items: { path: string; token: string; publicUrl: string }[] = [];

  for (const file of requested) {
    const name = typeof file.name === "string" ? file.name : "image";
    const type = typeof file.type === "string" ? file.type : "";
    const size = Number(file.size ?? 0);

    if (!ALLOWED.includes(type)) {
      return NextResponse.json(
        { error: `${name}: 지원하지 않는 형식입니다 (jpg/png/webp/gif/avif).` },
        { status: 400 },
      );
    }
    if (size > MAX_BYTES) {
      return NextResponse.json({ error: `${name}: 파일이 너무 큽니다 (최대 10MB).` }, { status: 400 });
    }

    const path = `uploads/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extensionOf(name, type)}`;
    const { data, error } = await storage.createSignedUploadUrl(path);

    if (error || !data) {
      const message = error?.message ?? "업로드 준비에 실패했습니다.";
      const hint = /bucket|not found/i.test(message)
        ? " (Supabase 에 'media' 버킷이 있는지 확인해 주세요 — supabase/schema.sql 실행)"
        : "";
      return NextResponse.json({ error: `업로드 준비 실패: ${message}${hint}` }, { status: 500 });
    }

    items.push({ path: data.path, token: data.token, publicUrl: storage.getPublicUrl(path).data.publicUrl });
  }

  return NextResponse.json({ items });
}

function extensionOf(name: string, type: string): string {
  const fromName = name.split(".").pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]{2,5}$/.test(fromName)) return fromName;
  return type.split("/")[1] ?? "jpg";
}
