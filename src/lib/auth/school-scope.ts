import { redirect } from "next/navigation";

import type { CurrentUser } from "@/types/auth";
import { requireAuth } from "@/lib/auth/require-auth";

export type SchoolScope = {
  user: CurrentUser;
  isSuperAdmin: boolean;
  schoolId: string | null;
  schoolName: string | null;
};

export async function requireSchoolScope(): Promise<SchoolScope> {
  const user = await requireAuth();
  const role = user.roles?.name;
  const isSuperAdmin = role === "super_admin";

  if (isSuperAdmin) {
    return {
      user,
      isSuperAdmin: true,
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
    schoolId: user.school_id,
    schoolName: user.school_name,
  };
}

export function assertSameSchool(
  scope: SchoolScope,
  targetSchoolId: string | null | undefined,
) {
  if (scope.isSuperAdmin) {
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
    return null;
  }

  if (!scope.schoolId) {
    redirect("/dashboard/forbidden?reason=missing-school-scope");
  }

  return scope.schoolId;
}
