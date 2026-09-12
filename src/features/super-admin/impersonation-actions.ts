"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth/require-role";
import { IMPERSONATION_COOKIE_NAME } from "@/lib/auth/school-scope";
import { logAuditEvent } from "@/lib/audit/log-audit-event";
import { createClient } from "@/lib/supabase/server";

export async function switchSchoolImpersonationAction(formData: FormData) {
  const currentUser = await requireRole("super_admin");
  const schoolId = String(formData.get("school_id") || "").trim();
  const redirectTo = String(formData.get("redirect_to") || "/dashboard/admin").trim();

  if (!schoolId) {
    redirect("/dashboard/super-admin/schools?status=error&message=ID+sekolah+tidak+valid");
  }

  const supabase = await createClient();
  const { data: school } = await supabase
    .from("schools")
    .select("id, name")
    .eq("id", schoolId)
    .maybeSingle();

  if (!school) {
    redirect("/dashboard/super-admin/schools?status=error&message=Sekolah+tidak+ditemukan");
  }

  const cookieStore = await cookies();
  cookieStore.set(IMPERSONATION_COOKIE_NAME, school.id, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 12, // 12 hours
  });

  await logAuditEvent({
    userId: currentUser.id,
    action: "schools.impersonate_start",
    entityType: "schools",
    entityId: school.id,
    payload: {
      school_id: school.id,
      school_name: school.name,
      admin_user: currentUser.username,
    },
  });

  revalidatePath("/dashboard", "layout");
  redirect(redirectTo);
}

export async function exitSchoolImpersonationAction(formData?: FormData) {
  const currentUser = await requireRole("super_admin");
  const redirectTo = String(formData?.get("redirect_to") || "/dashboard/super-admin/schools").trim();

  const cookieStore = await cookies();
  const previousSchoolId = cookieStore.get(IMPERSONATION_COOKIE_NAME)?.value;

  cookieStore.delete(IMPERSONATION_COOKIE_NAME);

  if (previousSchoolId) {
    await logAuditEvent({
      userId: currentUser.id,
      action: "schools.impersonate_end",
      entityType: "schools",
      entityId: previousSchoolId,
      payload: {
        school_id: previousSchoolId,
        admin_user: currentUser.username,
      },
    });
  }

  revalidatePath("/dashboard", "layout");
  redirect(redirectTo);
}

