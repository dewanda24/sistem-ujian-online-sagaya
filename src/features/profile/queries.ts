import { requireAuth } from "@/lib/auth/require-auth";
import { createClient } from "@/lib/supabase/server";
import { getServiceRoleClient } from "@/lib/supabase/admin";

type Relation<T> = T | T[] | null | undefined;

function firstRelation<T>(value: Relation<T>): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export type TeacherSubjectAssignment = {
  id: string;
  subjectName: string;
  subjectCode: string;
  className?: string;
};

export async function getProfileSettings() {
  const user = await requireAuth();
  const supabase = await createClient();
  const dbClient = getServiceRoleClient() ?? supabase;

  const { data, error } = await dbClient
    .from("users")
    .select(
      `
      id,
      username,
      email,
      status,
      school_id,
      roles(name, label),
      user_profiles(full_name, avatar_url, nip, nis, nisn, phone),
      schools(name, npsn, address)
    `,
    )
    .eq("id", user.id)
    .single();

  const roleName = firstRelation(data?.roles)?.name ?? user.roles?.name;

  let teacherSubjects: TeacherSubjectAssignment[] = [];
  let teacherStats = {
    totalQuestions: 0,
    totalPackages: 0,
    totalClasses: 0,
  };

  if (roleName === "teacher") {
    // 1. Fetch teacher subjects / class assignments
    const { data: assignments } = await dbClient
      .from("teacher_subjects")
      .select("id, subject_id, subjects(id, name, code)")
      .eq("teacher_id", user.id);

    if (assignments) {
      teacherSubjects = assignments.map((item) => {
        const sub = firstRelation(item.subjects);
        return {
          id: item.id,
          subjectName: sub?.name || "Mata Pelajaran",
          subjectCode: sub?.code || "-",
        };
      });
    }

    // 2. Fetch Question Count & Package Count
    const [qRes, pRes] = await Promise.all([
      dbClient
        .from("questions")
        .select("id", { count: "exact", head: true })
        .eq("created_by", user.id)
        .is("deleted_at", null),
      dbClient
        .from("exam_packages")
        .select("id", { count: "exact", head: true })
        .eq("created_by", user.id)
        .is("deleted_at", null),
    ]);

    teacherStats = {
      totalQuestions: qRes.count ?? 0,
      totalPackages: pRes.count ?? 0,
      totalClasses: teacherSubjects.length,
    };
  }

  const rawSchool = firstRelation(data?.schools);

  return {
    user: {
      ...user,
      username: data?.username ?? user.username,
      email: data?.email ?? user.email,
      status: data?.status ?? user.status,
      roles: firstRelation(data?.roles) ?? user.roles,
      schoolName: rawSchool?.name || user.school_name || "Sekolah Terdaftar",
      schoolNpsn: rawSchool?.npsn || "-",
      schoolAddress: rawSchool?.address || "-",
    },
    profile: firstRelation(data?.user_profiles) ?? {
      full_name: user.user_profiles?.full_name ?? "",
      avatar_url: user.user_profiles?.avatar_url ?? "",
      nip: "",
      nis: "",
      nisn: "",
      phone: "",
    },
    teacherSubjects,
    teacherStats,
  };
}
