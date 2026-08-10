"use client";

import { useFormStatus } from "react-dom";

/**
 * TDS 규칙: 로딩 중에도 버튼 폭을 유지한다.
 * 그래서 라벨을 갈아끼우지 않고 글자를 감춘 뒤 스피너만 얹는다.
 */
export default function SubmitButton({
  children,
  pendingLabel = "저장 중…",
  className = "btn-primary",
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className={pending ? `${className} btn-loading` : className}
      disabled={pending}
      aria-busy={pending}
      aria-label={pending ? pendingLabel : undefined}
    >
      {children}
    </button>
  );
}
