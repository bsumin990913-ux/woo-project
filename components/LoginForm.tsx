"use client";

import { useActionState } from "react";

import SubmitButton from "@/components/SubmitButton";
import { loginAction, type FormState } from "@/lib/actions";

export default function LoginForm() {
  const [state, formAction] = useActionState<FormState, FormData>(loginAction, {});

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="label" htmlFor="password">
          비밀번호
        </label>
        <input
          id="password"
          name="password"
          type="password"
          className="input"
          placeholder="••••••••"
          autoComplete="current-password"
          autoFocus
          required
        />
      </div>

      {state.error && (
        <p className="rounded-tds-lg bg-danger-weak px-4 py-3.5 text-sm font-medium text-danger">{state.error}</p>
      )}

      <SubmitButton className="btn-primary btn-lg btn-block" pendingLabel="확인 중…">
        로그인
      </SubmitButton>
    </form>
  );
}
