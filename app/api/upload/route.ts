import { NextResponse } from "next/server";

import { isAuthenticated } from "@/lib/auth";
import { MEDIA_BUCKET, supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

const MAX_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];

function extensionOf(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]{2,5}$/.test(fromName)) return fromName;
  return file.type.split("/")[1] ?? "jpg";
}

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "업로드 데이터를 읽지 못했습니다." }, { status: 400 });
  }

  const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) {
    return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 });
  }

  for (const file of files) {
    if (!ALLOWED.includes(file.type)) {
      return NextResponse.json({ error: `${file.name}: 지원하지 않는 형식입니다 (jpg/png/webp/gif/avif).` }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: `${file.name}: 파일이 너무 큽니다 (최대 10MB).` }, { status: 400 });
    }
  }

  const storage = supabaseAdmin().storage.from(MEDIA_BUCKET);
  const urls: string[] = [];

  for (const file of files) {
    const path = `uploads/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extensionOf(file)}`;
    const { error } = await storage.upload(path, file, { contentType: file.type, upsert: false });
    if (error) {
      const hint = /bucket/i.test(error.message)
        ? " (Supabase 에 'media' 버킷이 있는지 확인해 주세요 — supabase/schema.sql 실행)"
        : "";
      return NextResponse.json({ error: `업로드 실패: ${error.message}${hint}` }, { status: 500 });
    }
    urls.push(storage.getPublicUrl(path).data.publicUrl);
  }

  return NextResponse.json({ urls });
}
