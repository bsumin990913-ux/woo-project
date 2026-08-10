"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { imageSize } from "@/lib/image";

export default function Gallery({ images, alt }: { images: string[]; alt: string }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  // 라이트박스를 닫을 때 원래 눌렀던 썸네일로 포커스를 돌려준다
  const lastTrigger = useRef<HTMLButtonElement | null>(null);
  const touchStartX = useRef<number | null>(null);

  const close = useCallback(() => setOpenIndex(null), []);
  const step = useCallback(
    (delta: number) => setOpenIndex((prev) => (prev === null ? null : (prev + delta + images.length) % images.length)),
    [images.length],
  );

  useEffect(() => {
    if (openIndex === null) return;

    const overlay = overlayRef.current;
    overlay?.focus();

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") close();
      if (event.key === "ArrowRight") step(1);
      if (event.key === "ArrowLeft") step(-1);
      // 포커스가 라이트박스 밖으로 새 나가지 않게 가둔다
      if (event.key === "Tab" && overlay) {
        const focusables = overlay.querySelectorAll<HTMLElement>("button");
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      lastTrigger.current?.focus();
    };
  }, [openIndex, close, step]);

  if (images.length === 0) return null;

  const single = images.length === 1;

  return (
    <>
      <div className={single ? "border-line overflow-hidden rounded-[20px] border" : "grid grid-cols-2 gap-2.5 sm:grid-cols-3"}>
        {images.map((src, index) => {
          const size = imageSize(src);
          return (
            <button
              key={`${src}-${index}`}
              type="button"
              onClick={(event) => {
                lastTrigger.current = event.currentTarget;
                setOpenIndex(index);
              }}
              aria-label={`${alt} 이미지 ${index + 1} 크게 보기`}
              className={`bg-surface-2 group cursor-zoom-in overflow-hidden ${
                single ? "block w-full" : "border-line rounded-tds-lg aspect-square border"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={`${alt} 이미지 ${index + 1}`}
                loading="lazy"
                decoding="async"
                // 크기를 알면 미리 자리를 잡아 글이 아래로 밀리지 않는다
                width={single ? size?.width : undefined}
                height={single ? size?.height : undefined}
                className={`w-full transition-transform duration-300 group-hover:scale-[1.03] ${
                  single ? "h-auto" : "h-full object-cover"
                }`}
              />
            </button>
          );
        })}
      </div>

      {openIndex !== null && (
        <div
          ref={overlayRef}
          tabIndex={-1}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 outline-none backdrop-blur-sm"
          onClick={close}
          onTouchStart={(e) => {
            touchStartX.current = e.touches[0]?.clientX ?? null;
          }}
          onTouchEnd={(e) => {
            const start = touchStartX.current;
            touchStartX.current = null;
            if (start === null || images.length < 2) return;
            const delta = (e.changedTouches[0]?.clientX ?? start) - start;
            // 손가락으로 넘기기
            if (Math.abs(delta) > 50) step(delta < 0 ? 1 : -1);
          }}
          role="dialog"
          aria-modal="true"
          aria-label={`${alt} 이미지 ${openIndex + 1} / ${images.length}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[openIndex]}
            alt={`${alt} 이미지 ${openIndex + 1}`}
            className="max-h-full max-w-full rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          <button
            type="button"
            onClick={close}
            aria-label="닫기"
            className="absolute top-4 right-4 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/25"
          >
            <X className="h-5 w-5" />
          </button>

          {images.length > 1 && (
            <>
              <NavButton side="left" onClick={() => step(-1)} />
              <NavButton side="right" onClick={() => step(1)} />
              <span className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white">
                {openIndex + 1} / {images.length}
              </span>
            </>
          )}
        </div>
      )}
    </>
  );
}

function NavButton({ side, onClick }: { side: "left" | "right"; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={side === "left" ? "이전 이미지" : "다음 이미지"}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`absolute top-1/2 flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/25 ${
        side === "left" ? "left-3" : "right-3"
      }`}
    >
      {side === "left" ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
    </button>
  );
}
