"use client";

import { Share } from "lucide-react";
import { toast } from "sonner";

export default function ShareButton({ title, text, url }: { title: string; text?: string; url?: string }) {
  async function handleShare() {
    const shareData = {
      title,
      text,
      url: url || window.location.href,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          fallbackShare();
        }
      }
    } else {
      fallbackShare();
    }
  }

  function fallbackShare() {
    navigator.clipboard.writeText(url || window.location.href);
    toast.success("링크가 클립보드에 복사되었습니다.");
  }

  return (
    <button
      onClick={handleShare}
      className="btn-ghost btn-sm text-ink-3 hover:text-ink shrink-0 transition-colors"
      title="공유하기"
    >
      <Share className="h-4 w-4" />
      <span className="sr-only">공유하기</span>
    </button>
  );
}
