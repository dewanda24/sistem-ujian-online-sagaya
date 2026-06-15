"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Eye,
  EyeOff,
  GraduationCap,
  Loader2,
  LockKeyhole,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import {
  demoLoginAction,
  loginAction,
} from "@/features/auth/actions/login-action";

const demoRoles = [
  {
    value: "admin",
    label: "Admin Sekolah",
    description: "Data master, jadwal, pengguna, dan laporan sekolah.",
  },
  {
    value: "teacher",
    label: "Guru",
    description: "Bank soal, paket ujian, monitoring, dan koreksi.",
  },
  {
    value: "student",
    label: "Siswa",
    description: "Jadwal, ujian aktif, riwayat, dan hasil ujian.",
  },
  {
    value: "proctor",
    label: "Pengawas",
    description: "Token, peserta aktif, dan bantuan pelaksanaan ujian.",
  },
  {
    value: "principal",
    label: "Kepala Sekolah",
    description: "Ringkasan performa dan laporan sekolah.",
  },
] as const;

type DemoRoleValue = (typeof demoRoles)[number]["value"];

type LoginFormProps = {
  demoMode?: boolean;
  initialDemoRole?: DemoRoleValue;
  sessionMessage?: string;
};

export function LoginForm({
  demoMode = false,
  initialDemoRole,
  sessionMessage,
}: LoginFormProps) {
  const router = useRouter();
  const [state, formAction] = useActionState(loginAction, {});
  const [demoState, demoFormAction] = useActionState(demoLoginAction, {});
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const redirectTo = state.redirectTo ?? demoState.redirectTo;

    if (redirectTo) {
      router.replace(redirectTo);
      router.refresh();
    }
  }, [demoState.redirectTo, router, state.redirectTo]);

  return (
    <div
      className={`mx-auto grid min-h-[calc(100vh-4rem)] w-full items-center gap-6 ${
        demoMode ? "max-w-6xl lg:grid-cols-[0.95fr_1.05fr]" : "max-w-5xl lg:grid-cols-[1fr_0.9fr]"
      }`}
    >
      <section className="hidden lg:block">
        <div className="max-w-xl">
          <div className="mb-8 inline-flex items-center gap-3 rounded-full border border-[#DBEAFE] bg-white px-4 py-2 text-sm font-semibold text-[#1D4ED8] shadow-sm">
            <ShieldCheck className="size-4" />
            Sagaya CBT
          </div>
          <h2 className="text-4xl font-semibold tracking-normal text-[#0F172A]">
            Sistem ujian sekolah yang tertata, aman, dan mudah digunakan.
          </h2>
          <p className="mt-4 max-w-lg text-base leading-7 text-[#64748B]">
            Masuk menggunakan akun dari sekolah untuk mengakses jadwal,
            pengerjaan ujian, pengawasan, dan laporan sesuai peran Anda.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {["Akun Sekolah", "Ujian CBT", "Data Tersimpan"].map((item) => (
              <div
                key={item}
                className="rounded-xl border border-[#E2E8F0] bg-white px-4 py-3 text-sm font-semibold shadow-sm"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm sm:p-7">
        <div className="mb-7">
          <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-[#2563EB] text-white">
            <GraduationCap className="size-6" />
          </div>
          <h1 className="text-2xl font-semibold tracking-normal">
            Masuk ke Sagaya CBT
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#64748B]">
            Gunakan akun yang diberikan oleh sekolah untuk mengakses sistem ujian.
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

        <div className="mt-5 text-center">
          <button
            type="button"
            className="text-sm font-semibold text-[#2563EB] hover:text-[#1D4ED8]"
            onClick={() => {
              window.alert(
                "Silakan hubungi operator sekolah untuk mengatur ulang kata sandi.",
              );
            }}
          >
            Lupa Kata Sandi?
          </button>
        </div>
      </div>

      {demoMode ? (
        <section className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-5 flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#2563EB]">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-xl font-semibold">Coba Demo Sagaya</h2>
              <p className="mt-1 text-sm leading-6 text-[#64748B]">
                Pilih peran untuk melihat contoh tampilan sesuai kebutuhan sekolah.
              </p>
            </div>
          </div>

          <form action={demoFormAction}>
            {demoState.message ? (
              <FriendlyAlert>{demoState.message}</FriendlyAlert>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2">
              {getOrderedDemoRoles(initialDemoRole).map((role) => (
                <DemoRoleButton
                  description={role.description}
                  key={role.value}
                  label={role.label}
                  value={role.value}
                />
              ))}
            </div>
          </form>
        </section>
      ) : null}
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-70"
      disabled={pending}
    >
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          Memeriksa akun...
        </>
      ) : (
        "Masuk"
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
        <label className="mb-1.5 block text-sm font-semibold">
          Username / Email
        </label>
        <div className="relative">
          <UserRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#94A3B8]" />
          <input
            name="identifier"
            type="text"
            autoComplete="username"
            autoFocus
            className="h-11 w-full rounded-xl border border-[#CBD5E1] bg-white pl-10 pr-3 text-sm outline-none transition focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100 disabled:bg-[#F8FAFC]"
            placeholder="username atau email sekolah"
            required
            disabled={pending}
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-semibold">Kata Sandi</label>
        <div className="relative">
          <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#94A3B8]" />
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            className="h-11 w-full rounded-xl border border-[#CBD5E1] bg-white pl-10 pr-11 text-sm outline-none transition focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100 disabled:bg-[#F8FAFC]"
            placeholder="Masukkan kata sandi"
            required
            disabled={pending}
          />
          <button
            type="button"
            className="absolute right-2 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A]"
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

      <SubmitButton />
    </>
  );
}

function FriendlyAlert({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm leading-6 text-amber-900"
      role="alert"
    >
      {children}
    </div>
  );
}

function DemoRoleButton({
  description,
  label,
  value,
}: {
  description: string;
  label: string;
  value: DemoRoleValue;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      className="group flex min-h-28 w-full flex-col justify-between rounded-xl border border-[#E2E8F0] bg-white p-4 text-left transition hover:border-[#2563EB]/40 hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-70"
      disabled={pending}
      name="demoRole"
      type="submit"
      value={value}
    >
      <span>
        <span className="block text-sm font-semibold text-[#0F172A]">{label}</span>
        <span className="mt-2 block text-xs leading-5 text-[#64748B]">
          {description}
        </span>
      </span>
      <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#2563EB]">
        {pending ? "Memproses..." : "Masuk demo"}
        <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
      </span>
    </button>
  );
}

function getOrderedDemoRoles(initialDemoRole?: DemoRoleValue) {
  if (!initialDemoRole) {
    return demoRoles;
  }

  const selected = demoRoles.find((role) => role.value === initialDemoRole);

  if (!selected) {
    return demoRoles;
  }

  return [
    selected,
    ...demoRoles.filter((role) => role.value !== initialDemoRole),
  ];
}
