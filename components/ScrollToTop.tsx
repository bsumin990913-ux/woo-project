"use client";

import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setVisible(window.scrollY > 300);
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      // rise 는 globals.css 에 있는 진입 애니메이션.
      // 예전엔 animate-in / zoom-in 을 썼는데 그 플러그인이 없어 아무 효과가 없었다.
      className="bg-brand text-on-brand shadow-float rise fixed right-5 bottom-[max(1.25rem,env(safe-area-inset-bottom))] z-40 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full transition-transform hover:scale-105 active:scale-95"
      aria-label="맨 위로 이동"
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
}
