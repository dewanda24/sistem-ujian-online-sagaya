"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDashboardPath } from "@/lib/auth/role-redirect";
import {
  type DemoEmailEnvKey,
  getDemoEmailByEnvKey,
  isDemoModeEnabled,
} from "@/lib/auth/demo-mode";
import { formatJakartaDateTime } from "@/lib/date-time";
import { loginSchema } from "@/validations/auth";

const demoRoles = [
  "admin",
  "teacher",
  "student",
  "proctor",
  "principal",
] as const;

type DemoRole = (typeof demoRoles)[number];

const demoAccountEnvByRole: Record<DemoRole, DemoEmailEnvKey> = {
  admin: "DEMO_ADMIN_EMAIL",
  teacher: "DEMO_TEACHER_EMAIL",
  student: "DEMO_STUDENT_EMAIL",
  proctor: "DEMO_PROCTOR_EMAIL",
  principal: "DEMO_PRINCIPAL_EMAIL",
};

export type UserSessionInfo = {
  name: string;
  username: string;
  email: string;
  role: string;
  roleLabel: string;
  className?: string;
  schoolName?: string;
  lastLoginFormatted: string;
  status: string;
};

export type LoginActionState = {
  error?:
    | "invalid"
    | "inactive"
    | "no-user"
    | "no-role"
    | "validation"
    | "wrong-password"
    | "user-not-found"
    | "network";
  message?: string;
  redirectTo?: string;
  userSession?: UserSessionInfo;
};

export async function resolveUserIdentifierAction(identifier: string): Promise<{
  exists: boolean;
  email: string | null;
}> {
  return resolveLoginEmailWithUserCheck(identifier);
}

export async function fetchUserSessionDataAction(authUserId: string): Promise<{
  ok: boolean;
  error?: "no-user" | "inactive" | "no-role" | "network";
  message?: string;
  userSession?: UserSessionInfo;
  redirectTo?: string;
}> {
  try {
    let supabase;
    try {
      supabase = createAdminClient();
    } catch {
      supabase = await createClient();
    }

    const { data: appUser, error: appUserError } = await supabase
      .from("users")
      .select(
        `
        id,
        username,
        email,
        role_id,
        school_id,
        status,
        schools (
          name
        ),
        user_profiles (
          full_name,
          avatar_url
        )
      `,
      )
      .eq("auth_user_id", authUserId)
      .single();

    if (appUserError || !appUser) {
      return {
        ok: false,
        error: "no-user",
        message: "Akun belum siap digunakan. Silakan hubungi operator sekolah.",
      };
    }

    if (appUser.status !== "active") {
      return {
        ok: false,
        error: "inactive",
        message: "Akun Anda sedang tidak aktif. Silakan hubungi operator sekolah.",
      };
    }

    if (!appUser.role_id) {
      return {
        ok: false,
        error: "no-role",
        message: "Akun belum memiliki akses. Silakan hubungi operator sekolah.",
      };
    }

    const { data: roleData, error: roleError } = await supabase
      .from("roles")
      .select("name, label")
      .eq("id", appUser.role_id)
      .single();

    if (roleError || !roleData?.name) {
      return {
        ok: false,
        error: "no-role",
        message: "Akun belum memiliki akses. Silakan hubungi operator sekolah.",
      };
    }

    // Attempt to fetch student class if role is student
    let className: string | undefined = undefined;
    if (roleData.name === "student") {
      const { data: memberData } = await supabase
        .from("class_members")
        .select("classes(name)")
        .eq("student_id", appUser.id)
        .is("left_at", null)
        .maybeSingle();

      const classRel = Array.isArray(memberData?.classes)
        ? memberData?.classes[0]
        : memberData?.classes;
      className = classRel?.name ?? undefined;
    }

    const profile = Array.isArray(appUser.user_profiles)
      ? appUser.user_profiles[0]
      : appUser.user_profiles;

    const school = Array.isArray(appUser.schools)
      ? appUser.schools[0]
      : appUser.schools;

    const nowFormatted = formatJakartaDateTime(new Date().toISOString());

    const roleLabelMap: Record<string, string> = {
      super_admin: "Super Admin",
      admin: "Administrator",
      teacher: "Guru / Pendidik",
      student: "Siswa",
      proctor: "Proktor CBT",
      principal: "Kepala Sekolah",
    };

    const userSession: UserSessionInfo = {
      name: profile?.full_name || appUser.username || appUser.email || "Pengguna",
      username: appUser.username || appUser.email.split("@")[0],
      email: appUser.email,
      role: roleData.name,
      roleLabel: roleData.label || roleLabelMap[roleData.name] || roleData.name,
      className: className || (roleData.name === "student" ? "Kelas Terdaftar" : undefined),
      schoolName: school?.name || "SMP 1 Sagaya",
      lastLoginFormatted: nowFormatted,
      status: appUser.status === "active" ? "Aktif" : "Non-Aktif",
    };

    return {
      ok: true,
      userSession,
      redirectTo: getDashboardPath(roleData.name),
    };
  } catch (error) {
    console.error("fetchUserSessionDataAction error:", error);
    return {
      ok: false,
      error: "network",
      message: "Terjadi kesalahan koneksi saat memuat data akun.",
    };
  }
}

export async function loginAction(
  _previousState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const parsed = loginSchema.safeParse({
    identifier: formData.get("identifier"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      error: "validation",
      message: parsed.error.issues[0]?.message ?? "Data login tidak valid.",
    };
  }

  const { identifier, password } = parsed.data;

  return signInAndResolveDashboard(identifier, password);
}

export async function demoLoginAction(
  _previousState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  if (!isDemoModeEnabled()) {
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

  const email = getDemoEmailByEnvKey(demoAccountEnvByRole[demoRole]);
  const password = process.env.DEMO_PASSWORD?.trim();

  if (!password) {
    return {
      error: "validation",
      message: "Akun demo untuk peran ini belum dikonfigurasi.",
    };
  }

  return signInAndResolveDashboard(email, password);
}

async function signInAndResolveDashboard(
  identifier: string,
  password: string,
): Promise<LoginActionState> {
  try {
    const supabase = await createClient();
    const resolved = await resolveLoginEmailWithUserCheck(identifier);

    if (!resolved.exists || !resolved.email) {
      return {
        error: "user-not-found",
        message: "Akun tidak ditemukan. Periksa kembali username/email Anda.",
      };
    }

    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email: resolved.email,
        password,
      });

    if (authError || !authData.user) {
      return {
        error: "wrong-password",
        message: "Kata sandi yang Anda masukkan salah.",
      };
    }

    const sessionRes = await fetchUserSessionDataAction(authData.user.id);

    if (!sessionRes.ok || !sessionRes.userSession) {
      await supabase.auth.signOut();
      return {
        error: sessionRes.error || "no-role",
        message: sessionRes.message || "Akun belum memiliki akses.",
      };
    }

    return {
      redirectTo: sessionRes.redirectTo,
      userSession: sessionRes.userSession,
    };
  } catch (error) {
    console.error("Login action network/system error:", error);
    return {
      error: "network",
      message: "Koneksi bermasalah. Periksa koneksi internet Anda lalu coba lagi.",
    };
  }
}

async function resolveLoginEmailWithUserCheck(
  identifier: string,
): Promise<{ exists: boolean; email: string | null }> {
  try {
    const value = identifier.trim();
    let supabase;
    try {
      supabase = createAdminClient();
    } catch {
      supabase = await createClient();
    }

    if (value.includes("@")) {
      const { data } = await supabase
        .from("users")
        .select("email")
        .eq("email", value)
        .maybeSingle();

      if (data?.email) {
        return { exists: true, email: data.email };
      }
      // If not found in custom users table, still return email to attempt supabase auth directly
      return { exists: true, email: value };
    }

    const { data } = await supabase
      .from("users")
      .select("email")
      .eq("username", value)
      .maybeSingle();

    if (data?.email) {
      return { exists: true, email: data.email };
    }

    return { exists: false, email: null };
  } catch (error) {
    console.error("resolveLoginEmailWithUserCheck error:", error);
    // If identifier looks like an email, let them proceed to password auth
    if (identifier.includes("@")) {
      return { exists: true, email: identifier.trim() };
    }
    return { exists: false, email: null };
  }
}

function isDemoRole(value: FormDataEntryValue | null): value is DemoRole {
  return typeof value === "string" && demoRoles.includes(value as DemoRole);
}
