import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import type { CurrentUser } from "@/types/auth";
import { requireAuth } from "@/lib/auth/require-auth";
import { createClient } from "@/lib/supabase/server";

export const IMPERSONATION_COOKIE_NAME = "sagaya_impersonated_school_id";

export type SchoolScope = {
  user: CurrentUser;
  isSuperAdmin: boolean;
  isImpersonating?: boolean;
  schoolId: string | null;
  schoolName: string | null;
};

export async function requireSchoolScope(): Promise<SchoolScope> {
  const user = await requireAuth();
  const role = user.roles?.name;
  const isSuperAdmin = role === "super_admin";

  if (isSuperAdmin) {
    const cookieStore = await cookies();
    const impersonatedSchoolId = cookieStore.get(IMPERSONATION_COOKIE_NAME)?.value;

    if (impersonatedSchoolId) {
      const supabase = await createClient();
      const { data: school } = await supabase
        .from("schools")
        .select("id, name")
        .eq("id", impersonatedSchoolId)
        .maybeSingle();

      if (school) {
        return {
          user,
          isSuperAdmin: true,
          isImpersonating: true,
          schoolId: school.id,
          schoolName: school.name,
        };
      }
    }

    return {
      user,
      isSuperAdmin: true,
      isImpersonating: false,
      schoolId: null,
      schoolName: null,
    };
  }

  if (role === "admin" && !user.school_id) {
    redirect("/dashboard/forbidden?reason=missing-school-scope");
  }

  return {
    user,
    isSuperAdmin: false,
    isImpersonating: false,
    schoolId: user.school_id,
    schoolName: user.school_name,
  };
}

export function assertSameSchool(
  scope: SchoolScope,
  targetSchoolId: string | null | undefined,
) {
  if (scope.isSuperAdmin && !scope.isImpersonating) {
    return;
  }

  if (!scope.schoolId) {
    redirect("/dashboard/forbidden?reason=missing-school-scope");
  }

  if (!targetSchoolId || targetSchoolId !== scope.schoolId) {
    redirect("/dashboard/forbidden?reason=school-scope-mismatch");
  }
}

export function requireScopedSchoolId(scope: SchoolScope) {
  if (scope.isSuperAdmin) {
    // If super admin is currently impersonating a school, return the impersonated schoolId!
    if (scope.isImpersonating && scope.schoolId) {
      return scope.schoolId;
    }
    // Global platform mode
    return null;
  }

  if (!scope.schoolId) {
    redirect("/dashboard/forbidden?reason=missing-school-scope");
  }

  return scope.schoolId;
}

export async function getSuperAdminImpersonationContext() {
  const cookieStore = await cookies();
  const impersonatedSchoolId = cookieStore.get(IMPERSONATION_COOKIE_NAME)?.value;
  if (!impersonatedSchoolId) {
    return null;
  }

  const supabase = await createClient();
  const { data: school } = await supabase
    .from("schools")
    .select("id, name, npsn, education_level, is_active")
    .eq("id", impersonatedSchoolId)
    .maybeSingle();

  if (!school) {
    return null;
  }

  return school;
}

