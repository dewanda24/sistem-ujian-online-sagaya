"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient as createServiceClient } from "@supabase/supabase-js";

import { requirePermission } from "@/lib/auth/require-permission";
import { getRoleId } from "@/lib/master-data/queries";
import { createClient } from "@/lib/supabase/server";
import {
  academicYearSchema,
  classMemberSchema,
  classSchema,
  schoolSchema,
  semesterSchema,
  studentSchema,
  subjectSchema,
  teacherAssignmentSchema,
  teacherSchema,
} from "@/lib/validations/master-data";

type ActionResult = {
  ok: boolean;
  message: string;
};

function formString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

function formBoolean(formData: FormData, key: string) {
  return formData.get(key) === "on" || formData.get(key) === "true";
}

function nullableDate(value: string) {
  return value ? value : null;
}

function parseCsvLine(line: string) {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current.trim());

  return values;
}

function parseCsv(text: string) {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);

  if (lines.length < 2) {
    return [];
  }

  const headers = parseCsvLine(lines[0]).map((header) => header.trim());

  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);

    return headers.reduce<Record<string, string>>((row, header, index) => {
      row[header] = values[index] ?? "";
      return row;
    }, {});
  });
}

function redirectTo(path: string, result: ActionResult): never {
  const params = new URLSearchParams({
    status: result.ok ? "success" : "error",
    message: result.message,
  });

  redirect(`${path}?${params.toString()}`);
}

function serviceRoleClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    return null;
  }

  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
  );
}

export async function saveSchoolAction(formData: FormData) {
  await requirePermission("schools.manage");
  const parsed = schoolSchema.safeParse({
    id: formString(formData, "id"),
    name: formString(formData, "name"),
    npsn: formString(formData, "npsn"),
    address: formString(formData, "address"),
    phone: formString(formData, "phone"),
    email: formString(formData, "email"),
    is_active: formBoolean(formData, "is_active"),
  });

  if (!parsed.success) {
    redirectTo("/dashboard/master-data/schools", {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Data sekolah tidak valid.",
    });
  }

  const supabase = await createClient();
  const { id, ...payload } = parsed.data;
  const { error } = id
    ? await supabase.from("schools").update(payload).eq("id", id)
    : await supabase.from("schools").insert(payload);

  revalidatePath("/dashboard/master-data/schools");
  redirectTo("/dashboard/master-data/schools", {
    ok: !error,
    message: error ? error.message : "Data sekolah berhasil disimpan.",
  });
}

export async function toggleSchoolAction(formData: FormData) {
  await requirePermission("schools.manage");
  const supabase = await createClient();
  const id = formString(formData, "id");
  const isActive = formBoolean(formData, "is_active");
  const { error } = await supabase
    .from("schools")
    .update({ is_active: isActive })
    .eq("id", id);

  revalidatePath("/dashboard/master-data/schools");
  redirectTo("/dashboard/master-data/schools", {
    ok: !error,
    message: error ? error.message : "Status sekolah berhasil diperbarui.",
  });
}

export async function saveAcademicYearAction(formData: FormData) {
  await requirePermission("academic_years.manage");
  const parsed = academicYearSchema.safeParse({
    id: formString(formData, "id"),
    school_id: formString(formData, "school_id"),
    name: formString(formData, "name"),
    starts_at: formString(formData, "starts_at"),
    ends_at: formString(formData, "ends_at"),
    is_active: formBoolean(formData, "is_active"),
  });

  if (!parsed.success) {
    redirectTo("/dashboard/master-data/academic-years", {
      ok: false,
      message:
        parsed.error.issues[0]?.message ?? "Data tahun ajaran tidak valid.",
    });
  }

  const supabase = await createClient();
  const { id, is_active, starts_at, ends_at, ...rest } = parsed.data;

  if (is_active) {
    await supabase
      .from("academic_years")
      .update({ is_active: false })
      .eq("school_id", rest.school_id);
  }

  const payload = {
    ...rest,
    starts_at: nullableDate(starts_at),
    ends_at: nullableDate(ends_at),
    is_active,
  };

  const { error } = id
    ? await supabase.from("academic_years").update(payload).eq("id", id)
    : await supabase.from("academic_years").insert(payload);

  revalidatePath("/dashboard/master-data/academic-years");
  redirectTo("/dashboard/master-data/academic-years", {
    ok: !error,
    message: error ? error.message : "Tahun ajaran berhasil disimpan.",
  });
}

export async function toggleAcademicYearAction(formData: FormData) {
  await requirePermission("academic_years.manage");
  const supabase = await createClient();
  const id = formString(formData, "id");
  const schoolId = formString(formData, "school_id");
  const isActive = formBoolean(formData, "is_active");

  if (isActive) {
    await supabase
      .from("academic_years")
      .update({ is_active: false })
      .eq("school_id", schoolId);
  }

  const { error } = await supabase
    .from("academic_years")
    .update({ is_active: isActive })
    .eq("id", id);

  revalidatePath("/dashboard/master-data/academic-years");
  redirectTo("/dashboard/master-data/academic-years", {
    ok: !error,
    message: error ? error.message : "Status tahun ajaran diperbarui.",
  });
}

export async function saveSemesterAction(formData: FormData) {
  await requirePermission("semesters.manage");
  const parsed = semesterSchema.safeParse({
    id: formString(formData, "id"),
    academic_year_id: formString(formData, "academic_year_id"),
    name: formString(formData, "name"),
    starts_at: formString(formData, "starts_at"),
    ends_at: formString(formData, "ends_at"),
    is_active: formBoolean(formData, "is_active"),
  });

  if (!parsed.success) {
    redirectTo("/dashboard/master-data/semesters", {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Data semester tidak valid.",
    });
  }

  const supabase = await createClient();
  const { id, is_active, starts_at, ends_at, ...rest } = parsed.data;

  if (is_active) {
    await supabase
      .from("semesters")
      .update({ is_active: false })
      .eq("academic_year_id", rest.academic_year_id);
  }

  const payload = {
    ...rest,
    starts_at: nullableDate(starts_at),
    ends_at: nullableDate(ends_at),
    is_active,
  };

  const { error } = id
    ? await supabase.from("semesters").update(payload).eq("id", id)
    : await supabase.from("semesters").insert(payload);

  revalidatePath("/dashboard/master-data/semesters");
  redirectTo("/dashboard/master-data/semesters", {
    ok: !error,
    message: error ? error.message : "Semester berhasil disimpan.",
  });
}

export async function toggleSemesterAction(formData: FormData) {
  await requirePermission("semesters.manage");
  const supabase = await createClient();
  const id = formString(formData, "id");
  const academicYearId = formString(formData, "academic_year_id");
  const isActive = formBoolean(formData, "is_active");

  if (isActive) {
    await supabase
      .from("semesters")
      .update({ is_active: false })
      .eq("academic_year_id", academicYearId);
  }

  const { error } = await supabase
    .from("semesters")
    .update({ is_active: isActive })
    .eq("id", id);

  revalidatePath("/dashboard/master-data/semesters");
  redirectTo("/dashboard/master-data/semesters", {
    ok: !error,
    message: error ? error.message : "Status semester diperbarui.",
  });
}

export async function saveClassAction(formData: FormData) {
  await requirePermission("classes.manage");
  const parsed = classSchema.safeParse({
    id: formString(formData, "id"),
    school_id: formString(formData, "school_id"),
    academic_year_id: formString(formData, "academic_year_id"),
    name: formString(formData, "name"),
    grade_level: formString(formData, "grade_level"),
    homeroom_teacher_id: formString(formData, "homeroom_teacher_id"),
    is_active: formBoolean(formData, "is_active"),
  });

  if (!parsed.success) {
    redirectTo("/dashboard/master-data/classes", {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Data kelas tidak valid.",
    });
  }

  const supabase = await createClient();
  const { id, ...payload } = parsed.data;
  const { error } = id
    ? await supabase.from("classes").update(payload).eq("id", id)
    : await supabase.from("classes").insert(payload);

  revalidatePath("/dashboard/master-data/classes");
  redirectTo("/dashboard/master-data/classes", {
    ok: !error,
    message: error ? error.message : "Kelas berhasil disimpan.",
  });
}

export async function toggleClassAction(formData: FormData) {
  await requirePermission("classes.manage");
  const supabase = await createClient();
  const { error } = await supabase
    .from("classes")
    .update({ is_active: formBoolean(formData, "is_active") })
    .eq("id", formString(formData, "id"));

  revalidatePath("/dashboard/master-data/classes");
  redirectTo("/dashboard/master-data/classes", {
    ok: !error,
    message: error ? error.message : "Status kelas diperbarui.",
  });
}

export async function saveSubjectAction(formData: FormData) {
  await requirePermission("subjects.manage");
  const parsed = subjectSchema.safeParse({
    id: formString(formData, "id"),
    school_id: formString(formData, "school_id"),
    code: formString(formData, "code"),
    name: formString(formData, "name"),
    is_active: formBoolean(formData, "is_active"),
  });

  if (!parsed.success) {
    redirectTo("/dashboard/master-data/subjects", {
      ok: false,
      message:
        parsed.error.issues[0]?.message ?? "Data mata pelajaran tidak valid.",
    });
  }

  const supabase = await createClient();
  const { id, ...payload } = parsed.data;
  const { error } = id
    ? await supabase.from("subjects").update(payload).eq("id", id)
    : await supabase.from("subjects").insert(payload);

  revalidatePath("/dashboard/master-data/subjects");
  redirectTo("/dashboard/master-data/subjects", {
    ok: !error,
    message: error ? error.message : "Mata pelajaran berhasil disimpan.",
  });
}

export async function toggleSubjectAction(formData: FormData) {
  await requirePermission("subjects.manage");
  const supabase = await createClient();
  const { error } = await supabase
    .from("subjects")
    .update({ is_active: formBoolean(formData, "is_active") })
    .eq("id", formString(formData, "id"));

  revalidatePath("/dashboard/master-data/subjects");
  redirectTo("/dashboard/master-data/subjects", {
    ok: !error,
    message: error ? error.message : "Status mata pelajaran diperbarui.",
  });
}

async function createAuthUser(email: string, password?: string) {
  const adminClient = serviceRoleClient();

  if (!adminClient) {
    return {
      userId: null,
      error:
        "SUPABASE_SERVICE_ROLE_KEY belum tersedia. Pembuatan auth user disiapkan, tetapi belum dapat dijalankan.",
    };
  }

  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  return {
    userId: data.user?.id ?? null,
    error: error?.message ?? null,
  };
}

async function importRoleUsers({
  formData,
  roleName,
  permission,
  redirectPath,
}: {
  formData: FormData;
  roleName: "teacher" | "student";
  permission: "teachers.manage" | "students.manage";
  redirectPath: string;
}) {
  await requirePermission(permission);
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    redirectTo(redirectPath, {
      ok: false,
      message: "File CSV wajib diunggah.",
    });
  }

  const rows = parseCsv(await file.text());

  if (rows.length === 0) {
    redirectTo(redirectPath, {
      ok: false,
      message: "CSV kosong atau header tidak valid.",
    });
  }

  const supabase = await createClient();
  const adminClient = serviceRoleClient();
  const roleId = await getRoleId(roleName);

  if (!roleId) {
    redirectTo(redirectPath, {
      ok: false,
      message: `Role ${roleName} tidak ditemukan.`,
    });
  }

  if (!adminClient) {
    redirectTo(redirectPath, {
      ok: false,
      message:
        "SUPABASE_SERVICE_ROLE_KEY belum tersedia. Import auth user tidak dapat dijalankan.",
    });
  }

  let success = 0;
  const errors: string[] = [];

  for (const [index, row] of rows.entries()) {
    const rowNumber = index + 2;
    const status = row.status === "inactive" ? "inactive" : "active";
    const parsed =
      roleName === "teacher"
        ? teacherSchema.safeParse({
            email: row.email,
            username: row.username,
            password: row.password || undefined,
            full_name: row.full_name,
            nip: row.nip ?? "",
            phone: row.phone ?? "",
            status,
          })
        : studentSchema.safeParse({
            email: row.email,
            username: row.username,
            password: row.password || undefined,
            full_name: row.full_name,
            nis: row.nis ?? "",
            nisn: row.nisn ?? "",
            phone: row.phone ?? "",
            status,
          });

    if (!row.password) {
      errors.push(`Baris ${rowNumber}: password wajib diisi`);
      continue;
    }

    if (!parsed.success) {
      errors.push(
        `Baris ${rowNumber}: ${
          parsed.error.issues[0]?.message ?? "data tidak valid"
        }`,
      );
      continue;
    }

    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .or(`email.eq.${row.email},username.eq.${row.username}`)
      .maybeSingle();

    if (existingUser) {
      errors.push(`Baris ${rowNumber}: email atau username sudah terdaftar`);
      continue;
    }

    const createdAuthUser = await adminClient.auth.admin.createUser({
      email: row.email,
      password: row.password,
      email_confirm: true,
    });

    if (createdAuthUser.error || !createdAuthUser.data.user) {
      errors.push(
        `Baris ${rowNumber}: ${
          createdAuthUser.error?.message ?? "gagal membuat auth user"
        }`,
      );
      continue;
    }

    const { data: savedUser, error: userError } = await supabase
      .from("users")
      .insert({
        auth_user_id: createdAuthUser.data.user.id,
        email: row.email,
        username: row.username,
        role_id: roleId,
        status,
      })
      .select("id")
      .single();

    if (userError || !savedUser) {
      await adminClient.auth.admin.deleteUser(createdAuthUser.data.user.id);
      errors.push(
        `Baris ${rowNumber}: ${userError?.message ?? "gagal menyimpan user"}`,
      );
      continue;
    }

    const profilePayload: Record<string, string> =
      roleName === "teacher"
        ? {
            user_id: savedUser.id,
            full_name: row.full_name,
            nip: row.nip ?? "",
            phone: row.phone ?? "",
          }
        : {
            user_id: savedUser.id,
            full_name: row.full_name,
            nis: row.nis ?? "",
            nisn: row.nisn ?? "",
            phone: row.phone ?? "",
          };
    const { error: profileError } = await supabase
      .from("user_profiles")
      .upsert(profilePayload, { onConflict: "user_id" });

    if (profileError) {
      errors.push(`Baris ${rowNumber}: ${profileError.message}`);
      continue;
    }

    success += 1;
  }

  revalidatePath(redirectPath);
  redirectTo(redirectPath, {
    ok: errors.length === 0,
    message:
      errors.length > 0
        ? `Import selesai: ${success} berhasil, ${errors.length} gagal. ${errors
            .slice(0, 3)
            .join("; ")}`
        : `Import berhasil: ${success} ${roleName === "teacher" ? "guru" : "siswa"} ditambahkan.`,
  });
}

export async function importTeachersCsvAction(formData: FormData) {
  await importRoleUsers({
    formData,
    roleName: "teacher",
    permission: "teachers.manage",
    redirectPath: "/dashboard/master-data/teachers",
  });
}

export async function importStudentsCsvAction(formData: FormData) {
  await importRoleUsers({
    formData,
    roleName: "student",
    permission: "students.manage",
    redirectPath: "/dashboard/master-data/students",
  });
}

export async function saveTeacherAction(formData: FormData) {
  await requirePermission("teachers.manage");
  const parsed = teacherSchema.safeParse({
    id: formString(formData, "id"),
    email: formString(formData, "email"),
    username: formString(formData, "username"),
    password: formString(formData, "password") || undefined,
    full_name: formString(formData, "full_name"),
    nip: formString(formData, "nip"),
    phone: formString(formData, "phone"),
    status: formString(formData, "status") || "active",
  });

  if (!parsed.success) {
    redirectTo("/dashboard/master-data/teachers", {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Data guru tidak valid.",
    });
  }

  const supabase = await createClient();
  const roleId = await getRoleId("teacher");

  if (!roleId) {
    redirectTo("/dashboard/master-data/teachers", {
      ok: false,
      message: "Role teacher tidak ditemukan.",
    });
  }

  const { id, full_name, nip, phone, password, ...userPayload } = parsed.data;
  let authUserId: string | null = null;

  if (!id) {
    const createdAuthUser = await createAuthUser(userPayload.email, password);

    if (!createdAuthUser.userId) {
      redirectTo("/dashboard/master-data/teachers", {
        ok: false,
        message: createdAuthUser.error ?? "Gagal membuat auth user guru.",
      });
    }

    authUserId = createdAuthUser.userId;
  }

  const { data: savedUser, error: userError } = id
    ? await supabase
        .from("users")
        .update({ ...userPayload, role_id: roleId })
        .eq("id", id)
        .select("id")
        .single()
    : await supabase
        .from("users")
        .insert({ ...userPayload, role_id: roleId, auth_user_id: authUserId })
        .select("id")
        .single();

  if (userError || !savedUser) {
    redirectTo("/dashboard/master-data/teachers", {
      ok: false,
      message: userError?.message ?? "Gagal menyimpan user guru.",
    });
  }

  const { error: profileError } = await supabase.from("user_profiles").upsert(
    {
      user_id: savedUser.id,
      full_name,
      nip,
      phone,
    },
    { onConflict: "user_id" },
  );

  revalidatePath("/dashboard/master-data/teachers");
  redirectTo("/dashboard/master-data/teachers", {
    ok: !profileError,
    message: profileError ? profileError.message : "Data guru berhasil disimpan.",
  });
}

export async function saveTeacherAssignmentAction(formData: FormData) {
  await requirePermission("teachers.manage");
  const parsed = teacherAssignmentSchema.safeParse({
    teacher_id: formString(formData, "teacher_id"),
    subject_id: formString(formData, "subject_id"),
    class_id: formString(formData, "class_id"),
    academic_year_id: formString(formData, "academic_year_id"),
  });

  if (!parsed.success) {
    redirectTo("/dashboard/master-data/teachers", {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Assignment guru tidak valid.",
    });
  }

  const supabase = await createClient();
  const { error } = await supabase.from("teacher_subjects").insert(parsed.data);

  revalidatePath("/dashboard/master-data/teachers");
  redirectTo("/dashboard/master-data/teachers", {
    ok: !error,
    message: error ? error.message : "Assignment guru berhasil ditambahkan.",
  });
}

export async function toggleUserStatusAction(formData: FormData) {
  const target = formString(formData, "target") as "teachers" | "students";
  await requirePermission(target === "teachers" ? "teachers.manage" : "students.manage");
  const supabase = await createClient();
  const status = formString(formData, "status") === "active" ? "active" : "inactive";
  const { error } = await supabase
    .from("users")
    .update({ status })
    .eq("id", formString(formData, "id"));

  revalidatePath(`/dashboard/master-data/${target}`);
  redirectTo(`/dashboard/master-data/${target}`, {
    ok: !error,
    message: error ? error.message : "Status pengguna diperbarui.",
  });
}

export async function saveStudentAction(formData: FormData) {
  await requirePermission("students.manage");
  const parsed = studentSchema.safeParse({
    id: formString(formData, "id"),
    email: formString(formData, "email"),
    username: formString(formData, "username"),
    password: formString(formData, "password") || undefined,
    full_name: formString(formData, "full_name"),
    nis: formString(formData, "nis"),
    nisn: formString(formData, "nisn"),
    phone: formString(formData, "phone"),
    status: formString(formData, "status") || "active",
  });

  if (!parsed.success) {
    redirectTo("/dashboard/master-data/students", {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Data siswa tidak valid.",
    });
  }

  const supabase = await createClient();
  const roleId = await getRoleId("student");

  if (!roleId) {
    redirectTo("/dashboard/master-data/students", {
      ok: false,
      message: "Role student tidak ditemukan.",
    });
  }

  const { id, full_name, nis, nisn, phone, password, ...userPayload } =
    parsed.data;
  let authUserId: string | null = null;

  if (!id) {
    const createdAuthUser = await createAuthUser(userPayload.email, password);

    if (!createdAuthUser.userId) {
      redirectTo("/dashboard/master-data/students", {
        ok: false,
        message: createdAuthUser.error ?? "Gagal membuat auth user siswa.",
      });
    }

    authUserId = createdAuthUser.userId;
  }

  const { data: savedUser, error: userError } = id
    ? await supabase
        .from("users")
        .update({ ...userPayload, role_id: roleId })
        .eq("id", id)
        .select("id")
        .single()
    : await supabase
        .from("users")
        .insert({ ...userPayload, role_id: roleId, auth_user_id: authUserId })
        .select("id")
        .single();

  if (userError || !savedUser) {
    redirectTo("/dashboard/master-data/students", {
      ok: false,
      message: userError?.message ?? "Gagal menyimpan user siswa.",
    });
  }

  const { error: profileError } = await supabase.from("user_profiles").upsert(
    {
      user_id: savedUser.id,
      full_name,
      nis,
      nisn,
      phone,
    },
    { onConflict: "user_id" },
  );

  revalidatePath("/dashboard/master-data/students");
  redirectTo("/dashboard/master-data/students", {
    ok: !profileError,
    message: profileError ? profileError.message : "Data siswa berhasil disimpan.",
  });
}

export async function saveClassMemberAction(formData: FormData) {
  await requirePermission("students.manage");
  const parsed = classMemberSchema.safeParse({
    student_id: formString(formData, "student_id"),
    class_id: formString(formData, "class_id"),
    joined_at: formString(formData, "joined_at"),
  });

  if (!parsed.success) {
    redirectTo("/dashboard/master-data/students", {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Data anggota kelas invalid.",
    });
  }

  const supabase = await createClient();
  const { student_id, class_id, joined_at } = parsed.data;
  const { data: activeMembership } = await supabase
    .from("class_members")
    .select("id")
    .eq("student_id", student_id)
    .is("left_at", null)
    .maybeSingle();

  if (activeMembership) {
    await supabase
      .from("class_members")
      .update({ left_at: new Date().toISOString().slice(0, 10) })
      .eq("id", activeMembership.id);
  }

  const { error } = await supabase.from("class_members").insert({
    student_id,
    class_id,
    joined_at: joined_at || new Date().toISOString().slice(0, 10),
    left_at: null,
  });

  revalidatePath("/dashboard/master-data/students");
  redirectTo("/dashboard/master-data/students", {
    ok: !error,
    message: error ? error.message : "Riwayat kelas siswa berhasil ditambahkan.",
  });
}
