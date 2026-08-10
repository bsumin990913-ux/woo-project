"use client";

import { useCallback, useEffect, useState } from "react";

export default function Gallery({ images, alt }: { images: string[]; alt: string }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const close = useCallback(() => setOpenIndex(null), []);
  const step = useCallback(
    (delta: number) => setOpenIndex((prev) => (prev === null ? null : (prev + delta + images.length) % images.length)),
    [images.length],
  );

  useEffect(() => {
    if (openIndex === null) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") close();
      if (event.key === "ArrowRight") step(1);
      if (event.key === "ArrowLeft") step(-1);
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [openIndex, close, step]);

  if (images.length === 0) return null;

  return (
    <>
      <div
        className={
          images.length === 1
            ? "overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800"
            : "grid grid-cols-2 gap-2.5 sm:grid-cols-3"
        }
      >
        {images.map((src, index) => (
          <button
            key={`${src}-${index}`}
            type="button"
            onClick={() => setOpenIndex(index)}
            className={`group cursor-zoom-in overflow-hidden bg-zinc-100 dark:bg-zinc-800 ${
              images.length === 1 ? "block w-full" : "aspect-square rounded-xl border border-zinc-200 dark:border-zinc-800"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={`${alt} 이미지 ${index + 1}`}
              loading="lazy"
              className={`w-full transition-transform duration-300 group-hover:scale-[1.03] ${
                images.length === 1 ? "h-auto" : "h-full object-cover"
              }`}
            />
          </button>
        ))}
      </div>

      {openIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          onClick={close}
          role="dialog"
          aria-modal="true"
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
            className="absolute top-4 right-4 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/10 text-xl text-white transition-colors hover:bg-white/25"
          >
            ✕
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
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d={side === "left" ? "m14 5-7 7 7 7" : "m10 5 7 7-7 7"} />
      </svg>
    </button>
  );
}
