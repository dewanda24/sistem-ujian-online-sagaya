"use server";

import { createClient } from "@/lib/supabase/server";
import { getDashboardPath } from "@/lib/auth/role-redirect";
import { loginSchema } from "@/validations/auth";

const demoRoles = [
  "admin",
  "teacher",
  "student",
  "proctor",
  "principal",
] as const;

type DemoRole = (typeof demoRoles)[number];

const demoAccountEnvByRole: Record<DemoRole, string> = {
  admin: "DEMO_ADMIN_EMAIL",
  teacher: "DEMO_TEACHER_EMAIL",
  student: "DEMO_STUDENT_EMAIL",
  proctor: "DEMO_PROCTOR_EMAIL",
  principal: "DEMO_PRINCIPAL_EMAIL",
};

export type LoginActionState = {
  error?: "invalid" | "inactive" | "no-user" | "no-role" | "validation";
  message?: string;
  redirectTo?: string;
};

export async function loginAction(
  _previousState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      error: "validation",
      message: parsed.error.issues[0]?.message ?? "Data login tidak valid.",
    };
  }

  const { email, password } = parsed.data;

  return signInAndResolveDashboard(email, password);
}

export async function demoLoginAction(
  _previousState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  if (process.env.DEMO_ENABLED !== "true") {
    return {
      error: "inactive",
      message: "Mode demo belum diaktifkan di konfigurasi server.",
    };
  }

  const demoRole = formData.get("demoRole");

  if (!isDemoRole(demoRole)) {
    return {
      error: "validation",
      message: "Pilihan demo tidak valid.",
    };
  }

  const email = process.env[demoAccountEnvByRole[demoRole]];
  const password = process.env.DEMO_PASSWORD;

  if (!email || !password) {
    return {
      error: "validation",
      message: "Akun demo untuk peran ini belum dikonfigurasi.",
    };
  }

  return signInAndResolveDashboard(email, password);
}

async function signInAndResolveDashboard(
  email: string,
  password: string,
): Promise<LoginActionState> {
  const supabase = await createClient();

  const { data: authData, error: authError } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    });

  if (authError || !authData.user) {
    return {
      error: "invalid",
      message: "Email atau password tidak valid.",
    };
  }

  const { data: appUser, error: appUserError } = await supabase
    .from("users")
    .select("id, role_id, status")
    .eq("auth_user_id", authData.user.id)
    .single();

  if (appUserError || !appUser) {
    await supabase.auth.signOut();

    return {
      error: "no-user",
      message: "Akun auth belum terhubung dengan data pengguna aplikasi.",
    };
  }

  if (appUser.status !== "active") {
    await supabase.auth.signOut();

    return {
      error: "inactive",
      message: "Akun pengguna tidak aktif.",
    };
  }

  if (!appUser.role_id) {
    await supabase.auth.signOut();

    return {
      error: "no-role",
      message: "Akun pengguna belum memiliki peran.",
    };
  }

  const { data: roleData, error: roleError } = await supabase
    .from("roles")
    .select("name")
    .eq("id", appUser.role_id)
    .single();

  if (roleError || !roleData?.name) {
    await supabase.auth.signOut();

    return {
      error: "no-role",
      message: "Peran pengguna tidak ditemukan.",
    };
  }

  return {
    redirectTo: getDashboardPath(roleData.name),
  };
}

function isDemoRole(value: FormDataEntryValue | null): value is DemoRole {
  return typeof value === "string" && demoRoles.includes(value as DemoRole);
}
