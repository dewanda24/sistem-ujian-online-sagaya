import { redirect } from "next/navigation";

import { LoginForm } from "@/features/auth/components/login-form";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getDashboardPath } from "@/lib/auth/role-redirect";

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user?.roles?.name) {
    redirect(getDashboardPath(user.roles.name));
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted px-4">
      <LoginForm />
    </main>
  );
}
