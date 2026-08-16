import { redirect } from "next/navigation";

import { LoginForm } from "@/features/auth/components/login-form";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getDashboardPath } from "@/lib/auth/role-redirect";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string | string[];
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const [user, params] = await Promise.all([getCurrentUser(), searchParams]);

  if (user?.roles?.name) {
    redirect(getDashboardPath(user.roles.name));
  }

  const errorParam = Array.isArray(params.error) ? params.error[0] : params.error;

  return (
    <main className="min-h-screen bg-[#F8FAFC] px-4 py-8 text-[#0F172A]">
      <LoginForm sessionMessage={getLoginMessage(errorParam)} />
    </main>
  );
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
