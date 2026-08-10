"use client";

import { useFormStatus } from "react-dom";

export default function ConfirmButton({
  children,
  message,
  className = "btn-danger",
  pendingLabel = "처리 중…",
}: {
  children: React.ReactNode;
  message: string;
  className?: string;
  pendingLabel?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className={pending ? `${className} btn-loading` : className}
      disabled={pending}
      aria-busy={pending}
      aria-label={pending ? pendingLabel : undefined}
      onClick={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
