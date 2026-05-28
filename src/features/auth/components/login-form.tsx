"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";

import { loginAction } from "@/features/auth/actions/login-action";

export function LoginForm() {
  const router = useRouter();
  const [state, formAction] = useActionState(loginAction, {});

  useEffect(() => {
    if (state.redirectTo) {
      router.replace(state.redirectTo);
      router.refresh();
    }
  }, [router, state.redirectTo]);

  return (
    <div className="w-full max-w-md rounded-xl border bg-background p-6 shadow-sm">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold">Sistem Ujian Online SMP</h1>
        <p className="text-sm text-muted-foreground">Masuk untuk melanjutkan</p>
      </div>

      <form action={formAction} className="space-y-4">
        {state.message ? (
          <div
            className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            role="alert"
          >
            {state.message}
          </div>
        ) : null}

        <div>
          <label className="mb-1 block text-sm font-medium">Email</label>
          <input
            name="email"
            type="email"
            className="w-full rounded-md border px-3 py-2 text-sm outline-none"
            placeholder="admin@sekolah.sch.id"
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Password</label>
          <input
            name="password"
            type="password"
            className="w-full rounded-md border px-3 py-2 text-sm outline-none"
            placeholder="********"
            required
          />
        </div>

        <SubmitButton />
      </form>
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-70"
      disabled={pending}
    >
      {pending ? "Memproses..." : "Login"}
    </button>
  );
}
