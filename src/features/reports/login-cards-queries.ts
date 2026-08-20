import QRCode from "qrcode";
import { requireAuth } from "@/lib/auth/require-auth";
import { requireSchoolScope } from "@/lib/auth/school-scope";
import { createClient } from "@/lib/supabase/server";
import { getServiceRoleClient } from "@/lib/supabase/admin";

export type StudentLoginCard = {
  id: string;
  name: string;
  username: string;
  nis: string;
  nisn: string;
  className: string;
  academicYear: string;
  defaultPassword: string;
  qrCodeDataUrl: string;
};

export type SchoolCardInfo = {
  name: string;
  npsn?: string | null;
  address?: string | null;
  logoUrl?: string | null;
  principalName?: string | null;
};

export type LoginCardsPageData = {
  school: SchoolCardInfo;
  classes: Array<{ id: string; name: string }>;
  academicYears: Array<{ id: string; name: string }>;
  cards: StudentLoginCard[];
  selectedClassId?: string;
  selectedAcademicYearId?: string;
  totalStudents: number;
};

export async function getStudentLoginCardsData(params: {
  class_id?: string;
  academic_year_id?: string;
  q?: string;
}): Promise<LoginCardsPageData> {
  const user = await requireAuth();
  const scope = await requireSchoolScope();
  const supabase = await createClient();
  const dbClient = getServiceRoleClient() ?? supabase;

  const targetSchoolId = scope.schoolId ?? user.school_id;

  // 1. Fetch School Info
  let schoolInfo: SchoolCardInfo = {
    name: "SISTEM UJIAN ONLINE CBT",
    npsn: "-",
    address: "-",
    logoUrl: null,
  };

  if (targetSchoolId) {
    const { data: school } = await dbClient
      .from("schools")
      .select("name, npsn, address, logo_url")
      .eq("id", targetSchoolId)
      .maybeSingle();

    if (school) {
      schoolInfo = {
        name: school.name ?? "SEKOLAH INDONESIA",
        npsn: school.npsn ?? "-",
        address: school.address ?? "-",
        logoUrl: school.logo_url ?? null,
      };
    }
  }

  // 2. Fetch Available Classes
  let classQuery = dbClient
    .from("classes")
    .select("id, name")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (targetSchoolId) {
    classQuery = classQuery.eq("school_id", targetSchoolId);
  }

  const { data: classRows } = await classQuery;
  const classes = (classRows ?? []).map((c) => ({ id: c.id, name: c.name }));

  // 3. Fetch Available Academic Years
  let yearQuery = dbClient
    .from("academic_years")
    .select("id, name")
    .order("created_at", { ascending: false });

  if (targetSchoolId) {
    yearQuery = yearQuery.eq("school_id", targetSchoolId);
  }

  const { data: yearRows } = await yearQuery;
  const academicYears = (yearRows ?? []).map((y) => ({ id: y.id, name: y.name }));

  // 4. Fetch Student Memberships
  let memberQuery = dbClient
    .from("class_members")
    .select(
      `
      id,
      student_id,
      class_id,
      classes(id, name, school_id, academic_year_id, academic_years(name)),
      users!inner(id, email, username, status, school_id, user_profiles(full_name, nis, nisn), roles!inner(name))
    `,
    )
    .is("left_at", null)
    .eq("users.roles.name", "student");

  if (targetSchoolId) {
    memberQuery = memberQuery.eq("users.school_id", targetSchoolId);
  }

  if (params.class_id) {
    memberQuery = memberQuery.eq("class_id", params.class_id);
  }

  const { data: rawMembers } = await memberQuery;

  const cards: StudentLoginCard[] = [];

  for (const item of rawMembers ?? []) {
    const rawUser = Array.isArray(item.users) ? item.users[0] : item.users;
    if (!rawUser || rawUser.status !== "active") continue;

    const rawProfile = Array.isArray(rawUser.user_profiles)
      ? rawUser.user_profiles[0]
      : rawUser.user_profiles;

    const rawClass = Array.isArray(item.classes) ? item.classes[0] : item.classes;
    const rawYear = rawClass && Array.isArray(rawClass.academic_years)
      ? rawClass.academic_years[0]
      : (rawClass as unknown as { academic_years?: { name?: string } })?.academic_years;

    const studentName = rawProfile?.full_name || rawUser.username || "Siswa";
    const nis = rawProfile?.nis || "-";
    const nisn = rawProfile?.nisn || "-";
    const username = rawUser.username;
    const className = rawClass?.name || "Kelas -";
    const academicYearName = rawYear?.name || "-";

    // Filter by search query if provided
    if (params.q) {
      const qLower = params.q.toLowerCase();
      const match =
        studentName.toLowerCase().includes(qLower) ||
        username.toLowerCase().includes(qLower) ||
        nis.toLowerCase().includes(qLower) ||
        nisn.toLowerCase().includes(qLower);
      if (!match) continue;
    }

    // Generate QR Code data (e.g. login credentials or direct login payload)
    const qrPayload = JSON.stringify({
      u: username,
      n: studentName,
      s: targetSchoolId,
    });

    let qrCodeDataUrl = "";
    try {
      qrCodeDataUrl = await QRCode.toDataURL(qrPayload, {
        margin: 1,
        width: 120,
        color: {
          dark: "#0F172A",
          light: "#FFFFFF",
        },
      });
    } catch {
      qrCodeDataUrl = "";
    }

    // Default password hint: typically the student's NISN or NIS or "123456"
    const defaultPassword = nisn !== "-" ? nisn : nis !== "-" ? nis : "123456";

    cards.push({
      id: rawUser.id,
      name: studentName,
      username,
      nis,
      nisn,
      className,
      academicYear: academicYearName,
      defaultPassword,
      qrCodeDataUrl,
    });
  }

  // Sort alphabetically by name
  cards.sort((a, b) => a.name.localeCompare(b.name, "id"));

  return {
    school: schoolInfo,
    classes,
    academicYears,
    cards,
    selectedClassId: params.class_id,
    selectedAcademicYearId: params.academic_year_id,
    totalStudents: cards.length,
  };
}
