import { redirect } from "next/navigation";

import { LoginForm } from "@/features/auth/components/login-form";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getDashboardPath } from "@/lib/auth/role-redirect";

type LoginPageProps = {
  searchParams: Promise<{
    demo?: string | string[];
    error?: string | string[];
  }>;
};

const demoRoleValues = [
  "admin",
  "teacher",
  "student",
  "proctor",
  "principal",
] as const;

type DemoRoleValue = (typeof demoRoleValues)[number];

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const [user, params] = await Promise.all([getCurrentUser(), searchParams]);

  if (user?.roles?.name) {
    redirect(getDashboardPath(user.roles.name));
  }

  const demoParam = Array.isArray(params.demo) ? params.demo[0] : params.demo;
  const errorParam = Array.isArray(params.error) ? params.error[0] : params.error;
  const initialDemoRole = isDemoRoleValue(demoParam)
    ? demoParam
    : undefined;

  return (
    <main className="min-h-screen bg-[#F8FAFC] px-4 py-8 text-[#0F172A]">
      <LoginForm
        demoMode={Boolean(demoParam)}
        sessionMessage={getLoginMessage(errorParam)}
        initialDemoRole={initialDemoRole}
      />
    </main>
  );
}

function isDemoRoleValue(value?: string): value is DemoRoleValue {
  return demoRoleValues.includes(value as DemoRoleValue);
}

function getLoginMessage(error?: string) {
  if (error === "session-expired") {
    return "Sesi Anda telah berakhir. Silakan masuk kembali untuk melanjutkan.";
  }

  if (error === "inactive") {
    return "Akun Anda sedang tidak aktif. Silakan hubungi operator sekolah.";
  }

  if (error === "no-role") {
    return "Akun belum memiliki akses. Silakan hubungi operator sekolah.";
  }

  if (error === "signed-out") {
    return "Anda sudah keluar dari Sagaya CBT.";
  }

  if (error === "session-error") {
    return "Sesi Anda tidak lagi aktif. Silakan masuk kembali.";
  }

  return undefined;
}
