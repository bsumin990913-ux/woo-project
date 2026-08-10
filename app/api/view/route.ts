import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * 조회수 +1.
 * 페이지가 정적으로 캐시되기 때문에 서버 렌더링 시점에는 셀 수 없어서,
 * 화면이 뜬 뒤 브라우저가 이 엔드포인트를 한 번 호출한다.
 * 같은 방문자가 새로고침해도 중복으로 세지 않도록 거르는 건 클라이언트가 담당한다.
 */
export async function POST(request: Request) {
  let body: { kind?: unknown; id?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const kind = body.kind === "folder" || body.kind === "post" ? body.kind : null;
  const id = typeof body.id === "string" && UUID.test(body.id) ? body.id : null;
  if (!kind || !id) return NextResponse.json({ ok: false }, { status: 400 });

  // 조회수는 부가 정보라, 실패해도 화면을 막지 않는다(항상 200).
  // 다만 왜 안 세는지 알 수 있게 이유는 남긴다.
  try {
    const { error } = await supabaseAdmin().rpc("increment_view", { p_kind: kind, p_id: id });
    if (error) {
      const needsSchema = /increment_view|schema cache/i.test(error.message);
      return NextResponse.json({
        ok: false,
        reason: needsSchema ? "supabase/schema.sql 을 다시 실행해 주세요." : error.message,
      });
    }
  } catch {
    return NextResponse.json({ ok: false, reason: "unavailable" });
  }

  return NextResponse.json({ ok: true });
}
