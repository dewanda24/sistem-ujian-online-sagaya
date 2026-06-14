import { redirect } from "next/navigation";

import { LoginForm } from "@/features/auth/components/login-form";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getDashboardPath } from "@/lib/auth/role-redirect";

type LoginPageProps = {
  searchParams: Promise<{
    demo?: string | string[];
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
  const initialDemoRole = isDemoRoleValue(demoParam)
    ? demoParam
    : undefined;

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted px-4">
      <LoginForm
        demoMode={Boolean(demoParam)}
        initialDemoRole={initialDemoRole}
      />
    </main>
  );
}

function isDemoRoleValue(value?: string): value is DemoRoleValue {
  return demoRoleValues.includes(value as DemoRoleValue);
}
