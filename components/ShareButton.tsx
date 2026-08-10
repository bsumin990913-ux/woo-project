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
      type="button"
      onClick={handleShare}
      className="icon-btn icon-btn-sm tap shrink-0"
      title="공유하기"
      aria-label="공유하기"
    >
      <Share className="h-[18px] w-[18px]" />
    </button>
  );
}
