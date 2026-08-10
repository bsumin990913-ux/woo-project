"use client";

import { useEffect } from "react";

/**
 * 화면이 뜨면 조회수를 1 올린다. 화면에 아무것도 그리지 않는다.
 * 같은 브라우저 세션에서 새로고침해도 다시 세지 않는다.
 */
export default function ViewCounter({ kind, id }: { kind: "folder" | "post"; id: string }) {
  useEffect(() => {
    const key = `viewed:${kind}:${id}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // 시크릿 모드 등에서 sessionStorage 가 막혀 있으면 그냥 매번 센다
    }

    const payload = JSON.stringify({ kind, id });
    fetch("/api/view", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => undefined);
  }, [kind, id]);

  return null;
}
