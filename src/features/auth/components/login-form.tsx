"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { ArrowRight, ShieldCheck } from "lucide-react";

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
};

export function LoginForm({
  demoMode = false,
  initialDemoRole,
}: LoginFormProps) {
  const router = useRouter();
  const [state, formAction] = useActionState(loginAction, {});
  const [demoState, demoFormAction] = useActionState(demoLoginAction, {});

  useEffect(() => {
    const redirectTo = state.redirectTo ?? demoState.redirectTo;

    if (redirectTo) {
      router.replace(redirectTo);
      router.refresh();
    }
  }, [demoState.redirectTo, router, state.redirectTo]);

  return (
    <div
      className={`grid w-full gap-5 ${
        demoMode ? "max-w-5xl lg:grid-cols-[0.9fr_1.1fr]" : "max-w-md"
      }`}
    >
      <div className="rounded-xl border bg-background p-6 shadow-sm">
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

      {demoMode ? (
        <section className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="mb-5 flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-xl font-bold">Coba Demo Sagaya</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Pilih peran untuk masuk ke dashboard demo dengan session yang
                sama seperti pengguna asli.
              </p>
            </div>
          </div>

          <form action={demoFormAction}>
            {demoState.message ? (
              <div
                className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                role="alert"
              >
                {demoState.message}
              </div>
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
      className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-70"
      disabled={pending}
    >
      {pending ? "Memproses..." : "Login"}
    </button>
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
      className="group flex min-h-28 w-full flex-col justify-between rounded-lg border bg-background p-4 text-left transition hover:border-primary/40 hover:bg-accent disabled:cursor-not-allowed disabled:opacity-70"
      disabled={pending}
      name="demoRole"
      type="submit"
      value={value}
    >
      <span>
        <span className="block text-sm font-bold text-foreground">{label}</span>
        <span className="mt-2 block text-xs leading-5 text-muted-foreground">
          {description}
        </span>
      </span>
      <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-primary">
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
