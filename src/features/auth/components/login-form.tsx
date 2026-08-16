"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  GraduationCap,
  Loader2,
  LockKeyhole,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { loginAction } from "@/features/auth/actions/login-action";

type LoginFormProps = {
  sessionMessage?: string;
};

export function LoginForm({ sessionMessage }: LoginFormProps) {
  const router = useRouter();
  const [state, formAction] = useActionState(loginAction, {});
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (state.redirectTo) {
      router.replace(state.redirectTo);
      router.refresh();
    }
  }, [router, state.redirectTo]);

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl items-center justify-center py-6">
      <div className="grid w-full items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Left hero banner */}
        <section className="hidden lg:block">
          <div className="max-w-lg space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/70 px-4 py-1.5 text-xs font-bold text-blue-700 shadow-xs">
              <ShieldCheck className="size-4" />
              <span>Sagaya CBT • Sistem Ujian Online</span>
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-[#0F172A] sm:text-4xl leading-tight">
              Platform Ujian Sekolah Digital yang Tertata, Cepat, dan Aman.
            </h1>

            <p className="text-sm leading-relaxed text-[#64748B]">
              Masuk menggunakan akun yang diberikan oleh pihak sekolah untuk mengakses jadwal ujian, pengerjaan soal CBT, pengawasan ruang ujian, dan laporan nilai.
            </p>

            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="rounded-xl border border-[#E2E8F0] bg-white p-3.5 shadow-xs">
                <p className="text-xs font-semibold text-[#64748B]">Keamanan</p>
                <p className="text-sm font-bold text-[#0F172A] mt-0.5">Anti-Cheat</p>
              </div>
              <div className="rounded-xl border border-[#E2E8F0] bg-white p-3.5 shadow-xs">
                <p className="text-xs font-semibold text-[#64748B]">Penyimpanan</p>
                <p className="text-sm font-bold text-[#0F172A] mt-0.5">Auto-Save</p>
              </div>
              <div className="rounded-xl border border-[#E2E8F0] bg-white p-3.5 shadow-xs">
                <p className="text-xs font-semibold text-[#64748B]">Akses</p>
                <p className="text-sm font-bold text-[#0F172A] mt-0.5">Multi-Role</p>
              </div>
            </div>
          </div>
        </section>

        {/* Right login form card */}
        <div className="w-full rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6">
            <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white shadow-xs">
              <GraduationCap className="size-6" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-[#0F172A]">
              Masuk ke Akun
            </h2>
            <p className="mt-1 text-xs text-[#64748B]">
              Gunakan Username atau Email dan kata sandi Anda.
            </p>
          </div>

          <form action={formAction} className="space-y-4">
            {sessionMessage ? (
              <FriendlyAlert>{sessionMessage}</FriendlyAlert>
            ) : null}

            {state.message ? (
              <FriendlyAlert>{state.message}</FriendlyAlert>
            ) : null}

            <LoginFields
              showPassword={showPassword}
              onTogglePassword={() => setShowPassword((value) => !value)}
            />
          </form>

          <div className="mt-6 border-t border-[#E2E8F0] pt-4 text-center">
            <button
              type="button"
              className="text-xs font-semibold text-[#2563EB] hover:text-blue-700"
              onClick={() => {
                window.alert(
                  "Silakan hubungi operator / admin sekolah Anda untuk mengatur ulang kata sandi.",
                );
              }}
            >
              Lupa Kata Sandi? Hubungi Operator Sekolah
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-4 text-sm font-bold text-white shadow-xs transition-all duration-150 active:scale-[0.98] hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
      disabled={pending}
    >
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          <span>Memeriksa akun...</span>
        </>
      ) : (
        "Masuk ke Sistem"
      )}
    </button>
  );
}

function LoginFields({
  showPassword,
  onTogglePassword,
}: {
  showPassword: boolean;
  onTogglePassword: () => void;
}) {
  const { pending } = useFormStatus();

  return (
    <>
      <div>
        <label className="mb-1.5 block text-xs font-bold text-[#0F172A]">
          Username atau Email
        </label>
        <div className="relative">
          <UserRound className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#94A3B8]" />
          <input
            name="identifier"
            type="text"
            autoComplete="username"
            autoFocus
            className="h-11 w-full rounded-xl border border-[#CBD5E1] bg-white pl-10 pr-3 text-sm outline-none transition focus:border-[#2563EB] focus:ring-3 focus:ring-blue-100 disabled:bg-[#F8FAFC]"
            placeholder="username / email Anda"
            required
            disabled={pending}
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-bold text-[#0F172A]">
          Kata Sandi
        </label>
        <div className="relative">
          <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#94A3B8]" />
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            className="h-11 w-full rounded-xl border border-[#CBD5E1] bg-white pl-10 pr-11 text-sm outline-none transition focus:border-[#2563EB] focus:ring-3 focus:ring-blue-100 disabled:bg-[#F8FAFC]"
            placeholder="Masukkan kata sandi"
            required
            disabled={pending}
          />
          <button
            type="button"
            className="absolute right-2.5 top-1/2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-lg text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A]"
            onClick={onTogglePassword}
            aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
            disabled={pending}
          >
            {showPassword ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </button>
        </div>
      </div>

      <div className="pt-2">
        <SubmitButton />
      </div>
    </>
  );
}

function FriendlyAlert({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs leading-5 text-amber-900"
      role="alert"
    >
      {children}
    </div>
  );
}
