"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

/**
 * 공개 / 비공개 스위치.
 * 눌렀을 때 바로 반응하고, 서버 저장이 실패하면 원래 상태로 되돌린다.
 */
export default function PublishSwitch({
  published,
  onChange,
  label = "공개",
}: {
  published: boolean;
  onChange: (next: boolean) => Promise<void>;
  label?: string;
}) {
  const [on, setOn] = useState(published);
  const [isPending, startTransition] = useTransition();

  function toggle() {
    if (isPending) return;
    const next = !on;
    setOn(next);

    startTransition(async () => {
      try {
        await onChange(next);
        toast.success(next ? "공개로 바꿨습니다." : "비공개로 바꿨습니다.");
      } catch {
        setOn(!next);
        toast.error("바꾸지 못했습니다. 다시 시도해 주세요.");
      }
    });
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={`${label} 여부`}
      disabled={isPending}
      onClick={toggle}
      className="switch"
    >
      <span className="switch-track" aria-hidden>
        <span className="switch-thumb" />
      </span>
      {on ? "공개" : "비공개"}
    </button>
  );
}
