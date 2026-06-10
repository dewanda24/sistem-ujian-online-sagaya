"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient as createServiceClient } from "@supabase/supabase-js";

import { getFriendlyErrorMessage } from "@/lib/actions/action-result";
import { logAuditEvent } from "@/lib/audit/log-audit-event";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { getMissingCsvHeaders, parseCsvText } from "@/lib/import/csv";

type ActionResult = {
  ok: boolean;
  message: string;
};

const schoolHeaders = [
  "name",
  "npsn",
  "education_level",
  "address",
  "city",
  "province",
  "email",
  "phone",
  "is_active",
];

const adminHeaders = [
  "school_npsn",
  "full_name",
  "email",
  "username",
  "password",
  "status",
];

function formString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function redirectTo(path: string, result: ActionResult): never {
  const params = new URLSearchParams({
    status: result.ok ? "success" : "error",
    message: result.ok ? result.message : getFriendlyErrorMessage(result.message),
  });

  redirect(`${path}${path.includes("?") ? "&" : "?"}${params.toString()}`);
}

function serviceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createServiceClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function asBoolean(value: string, fallback = true) {
  if (!value) {
    return fallback;
  }

  return ["true", "1", "ya", "yes", "active", "aktif"].includes(
    value.toLowerCase(),
  );
}

function asPositiveInteger(value: string, fallback: number) {
  const numberValue = Number(value);

  return Number.isFinite(numberValue) && numberValue > 0
    ? Math.round(numberValue)
    : fallback;
}

async function getAdminRoleId() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("roles")
    .select("id")
    .eq("name", "admin")
    .maybeSingle();

  return data?.id ? String(data.id) : null;
}

export async function saveSystemSettingsAction(formData: FormData) {
  const currentUser = await requireRole("super_admin");
  const supabase = await createClient();
  const platform = {
    app_name: formString(formData, "app_name") || "Sistem Ujian Online Sagaya",
    logo_url: formString(formData, "logo_url"),
    theme: formString(formData, "theme") || "default",
    maintenance_mode: formString(formData, "maintenance_mode") === "true",
  };
  const cbt = {
    autosave_interval_seconds: asPositiveInteger(
      formString(formData, "autosave_interval_seconds"),
      30,
    ),
    default_token_required:
      formString(formData, "default_token_required") === "true",
    shuffle_questions: formString(formData, "shuffle_questions") === "true",
    shuffle_options: formString(formData, "shuffle_options") === "true",
    fullscreen_violation_limit: asPositiveInteger(
      formString(formData, "fullscreen_violation_limit"),
      3,
    ),
  };
  const rows = [
    {
      key: "platform",
      value: platform,
      description: "Identitas dan mode platform global.",
      updated_by: currentUser.id,
      updated_at: new Date().toISOString(),
    },
    {
      key: "cbt_defaults",
      value: cbt,
      description: "Konfigurasi CBT default lintas sekolah.",
      updated_by: currentUser.id,
      updated_at: new Date().toISOString(),
    },
  ];
  const { error } = await supabase
    .from("system_settings")
    .upsert(rows, { onConflict: "key" });

  if (!error) {
    await logAuditEvent({
      userId: currentUser.id,
      action: "system_settings.update",
      entityType: "system_settings",
      payload: { platform, cbt },
    });
  }

  revalidatePath("/dashboard/super-admin/settings");
  redirectTo("/dashboard/super-admin/settings", {
    ok: !error,
    message: error ? getFriendlyErrorMessage(error) : "Pengaturan sistem berhasil disimpan.",
  });
}

export async function previewGlobalImportAction(formData: FormData) {
  const currentUser = await requireRole("super_admin");
  const type = formString(formData, "type") === "school_admins" ? "school_admins" : "schools";
  const redirectPath = `/dashboard/super-admin/import-export?tab=import&type=${type}`;
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    redirectTo(redirectPath, {
      ok: false,
      message: "File CSV wajib diunggah.",
    });
  }

  const text = await file.text();
  const parsed = parseCsvText(text);
  const requiredHeaders = type === "schools" ? schoolHeaders : adminHeaders;
  const missingHeaders = getMissingCsvHeaders(parsed.headers, requiredHeaders);

  if (missingHeaders.length > 0) {
    redirectTo(redirectPath, {
      ok: false,
      message: `Header wajib belum lengkap: ${missingHeaders.join(", ")}.`,
    });
  }

  const validation = type === "schools"
    ? await validateSchoolRows(parsed.rows)
    : await validateAdminRows(parsed.rows);
  const supabase = await createClient();
  const { data: job, error } = await supabase
    .from("super_admin_import_jobs")
    .insert({
      type,
      status: "previewed",
      filename: file.name,
      total_rows: parsed.rows.length,
      valid_rows: validation.validRows.length,
      invalid_rows: validation.errors.length,
      errors: validation.errors,
      preview_rows: validation.previewRows,
      created_by: currentUser.id,
    })
    .select("id")
    .single();

  if (!error && job?.id) {
    await logAuditEvent({
      userId: currentUser.id,
      action: `global_import.${type}.preview`,
      entityType: "super_admin_import_jobs",
      entityId: String(job.id),
      payload: {
        filename: file.name,
        total_rows: parsed.rows.length,
        valid_rows: validation.validRows.length,
        invalid_rows: validation.errors.length,
      },
    });
  }

  revalidatePath("/dashboard/super-admin/import-export");
  redirectTo(
    job?.id
      ? `/dashboard/super-admin/import-export?tab=import&type=${type}&job_id=${job.id}`
      : redirectPath,
    {
      ok: !error,
      message: error ? getFriendlyErrorMessage(error) : "Preview import berhasil dibuat.",
    },
  );
}

export async function commitGlobalImportAction(formData: FormData) {
  const currentUser = await requireRole("super_admin");
  const jobId = formString(formData, "job_id");
  const supabase = await createClient();
  const { data: job, error: jobError } = await supabase
    .from("super_admin_import_jobs")
    .select("id, type, status, preview_rows, invalid_rows")
    .eq("id", jobId)
    .maybeSingle();

  if (jobError || !job) {
    redirectTo("/dashboard/super-admin/import-export?tab=import", {
      ok: false,
      message: "Job import tidak ditemukan.",
    });
  }

  if (job.status !== "previewed" || Number(job.invalid_rows ?? 0) > 0) {
    redirectTo(`/dashboard/super-admin/import-export?tab=import&job_id=${jobId}`, {
      ok: false,
      message: "Job import belum valid atau sudah diproses.",
    });
  }

  const rows = Array.isArray(job.preview_rows)
    ? (job.preview_rows as Array<Record<string, string>>)
    : [];
  const result =
    job.type === "schools"
      ? await commitSchoolRows(rows)
      : await commitAdminRows(rows);
  const { error } = await supabase
    .from("super_admin_import_jobs")
    .update({
      status: result.ok ? "committed" : "failed",
      result,
      committed_by: currentUser.id,
      committed_at: new Date().toISOString(),
    })
    .eq("id", jobId);

  await logAuditEvent({
    userId: currentUser.id,
    action: `global_import.${job.type}.commit`,
    entityType: "super_admin_import_jobs",
    entityId: jobId,
    payload: result,
  });

  revalidatePath("/dashboard/super-admin/import-export");
  revalidatePath("/dashboard/super-admin/schools");
  revalidatePath("/dashboard/super-admin/admins");
  redirectTo(`/dashboard/super-admin/import-export?tab=import&job_id=${jobId}`, {
    ok: result.ok && !error,
    message: error
      ? getFriendlyErrorMessage(error)
      : result.ok
        ? "Import global berhasil diproses."
        : "Import global selesai dengan error.",
  });
}

export async function createBackupAction(formData: FormData) {
  const currentUser = await requireRole("super_admin");
  const scope = formString(formData, "scope") === "school" ? "school" : "global";
  const schoolId = scope === "school" ? formString(formData, "school_id") : "";
  const supabase = await createClient();
  const snapshot = await buildBackupSnapshot(scope, schoolId || null);
  const { data: job, error } = await supabase
    .from("super_admin_backup_jobs")
    .insert({
      scope,
      school_id: scope === "school" ? schoolId || null : null,
      status: snapshot.ok ? "completed" : "failed",
      kind: "manual",
      snapshot: snapshot.data,
      row_counts: snapshot.rowCounts,
      error_message: snapshot.ok ? null : snapshot.message,
      created_by: currentUser.id,
    })
    .select("id")
    .single();

  if (!error) {
    await logAuditEvent({
      userId: currentUser.id,
      action: `backup.${scope}.create`,
      entityType: "super_admin_backup_jobs",
      entityId: job?.id ? String(job.id) : null,
      payload: {
        scope,
        school_id: scope === "school" ? schoolId || null : null,
        row_counts: snapshot.rowCounts,
        status: snapshot.ok ? "completed" : "failed",
      },
    });
  }

  revalidatePath("/dashboard/super-admin/backup-recovery");
  redirectTo("/dashboard/super-admin/backup-recovery", {
    ok: snapshot.ok && !error,
    message: error
      ? getFriendlyErrorMessage(error)
      : snapshot.ok
        ? "Backup berhasil dibuat."
        : snapshot.message,
  });
}

export async function restoreBackupAction(formData: FormData) {
  const currentUser = await requireRole("super_admin");
  const backupId = formString(formData, "backup_id");
  const supabase = await createClient();
  const { data: backup, error: backupError } = await supabase
    .from("super_admin_backup_jobs")
    .select("id, scope, school_id, snapshot")
    .eq("id", backupId)
    .eq("status", "completed")
    .maybeSingle();

  if (backupError || !backup) {
    redirectTo("/dashboard/super-admin/backup-recovery", {
      ok: false,
      message: "Backup tidak ditemukan atau tidak siap dipulihkan.",
    });
  }

  const snapshot = backup.snapshot as Record<string, unknown>;
  const restoreResult = await restoreLimitedSnapshot({
    scope: String(backup.scope),
    schoolId: backup.school_id ? String(backup.school_id) : null,
    snapshot,
    userId: currentUser.id,
  });

  await supabase
    .from("super_admin_backup_jobs")
    .update({
      status: restoreResult.ok ? "restored" : "failed",
      restored_by: currentUser.id,
      restored_at: new Date().toISOString(),
      error_message: restoreResult.ok ? null : restoreResult.message,
    })
    .eq("id", backupId);

  await logAuditEvent({
    userId: currentUser.id,
    action: "backup.restore_limited",
    entityType: "super_admin_backup_jobs",
    entityId: backupId,
    payload: restoreResult,
  });

  revalidatePath("/dashboard/super-admin/backup-recovery");
  revalidatePath("/dashboard/super-admin/settings");
  revalidatePath("/dashboard/super-admin/schools");
  redirectTo("/dashboard/super-admin/backup-recovery", restoreResult);
}

async function validateSchoolRows(rows: Array<Record<string, string>>) {
  const supabase = await createClient();
  const npsns = rows.map((row) => row.npsn).filter(Boolean);
  const { data: existingSchools } = npsns.length
    ? await supabase.from("schools").select("npsn").in("npsn", npsns)
    : { data: [] };
  const existingNpsn = new Set((existingSchools ?? []).map((row) => row.npsn));
  const errors: Array<{ row_number: number; errors: string[] }> = [];
  const validRows: Array<Record<string, string>> = [];

  rows.forEach((row, index) => {
    const rowErrors: string[] = [];

    if (!row.name) rowErrors.push("name wajib diisi");
    if (!row.npsn) rowErrors.push("npsn wajib diisi");
    if (row.npsn && existingNpsn.has(row.npsn)) rowErrors.push("npsn sudah terdaftar");
    if (row.email && !row.email.includes("@")) rowErrors.push("email tidak valid");

    if (rowErrors.length > 0) {
      errors.push({ row_number: index + 2, errors: rowErrors });
    } else {
      validRows.push(row);
    }
  });

  return {
    errors,
    validRows,
    previewRows: rows.slice(0, 100),
  };
}

async function validateAdminRows(rows: Array<Record<string, string>>) {
  const supabase = await createClient();
  const schoolNpsns = rows.map((row) => row.school_npsn).filter(Boolean);
  const emails = rows.map((row) => row.email).filter(Boolean);
  const usernames = rows.map((row) => row.username).filter(Boolean);
  const [{ data: schools }, { data: emailUsers }, { data: usernameUsers }] =
    await Promise.all([
      schoolNpsns.length
        ? supabase.from("schools").select("npsn").in("npsn", schoolNpsns)
        : Promise.resolve({ data: [] }),
      emails.length
        ? supabase.from("users").select("email").in("email", emails)
        : Promise.resolve({ data: [] }),
      usernames.length
        ? supabase.from("users").select("username").in("username", usernames)
        : Promise.resolve({ data: [] }),
    ]);
  const schoolSet = new Set((schools ?? []).map((row) => row.npsn));
  const emailSet = new Set((emailUsers ?? []).map((row) => row.email));
  const usernameSet = new Set((usernameUsers ?? []).map((row) => row.username));
  const errors: Array<{ row_number: number; errors: string[] }> = [];
  const validRows: Array<Record<string, string>> = [];

  rows.forEach((row, index) => {
    const rowErrors: string[] = [];

    if (!row.school_npsn) rowErrors.push("school_npsn wajib diisi");
    if (row.school_npsn && !schoolSet.has(row.school_npsn)) rowErrors.push("sekolah tidak ditemukan");
    if (!row.full_name) rowErrors.push("full_name wajib diisi");
    if (!row.email || !row.email.includes("@")) rowErrors.push("email tidak valid");
    if (row.email && emailSet.has(row.email)) rowErrors.push("email sudah digunakan");
    if (!row.username) rowErrors.push("username wajib diisi");
    if (row.username && usernameSet.has(row.username)) rowErrors.push("username sudah digunakan");
    if (!row.password || row.password.length < 6) rowErrors.push("password minimal 6 karakter");

    if (rowErrors.length > 0) {
      errors.push({ row_number: index + 2, errors: rowErrors });
    } else {
      validRows.push(row);
    }
  });

  return {
    errors,
    validRows,
    previewRows: rows.slice(0, 100),
  };
}

async function commitSchoolRows(rows: Array<Record<string, string>>) {
  const supabase = await createClient();
  let success = 0;
  const errors: Array<{ row_number: number; errors: string[] }> = [];

  for (const [index, row] of rows.entries()) {
    const { error } = await supabase.from("schools").insert({
      name: row.name,
      npsn: row.npsn,
      education_level: row.education_level || null,
      address: row.address || null,
      city: row.city || null,
      province: row.province || null,
      email: row.email || null,
      phone: row.phone || null,
      is_active: asBoolean(row.is_active, true),
    });

    if (error) {
      errors.push({ row_number: index + 2, errors: [getFriendlyErrorMessage(error)] });
    } else {
      success += 1;
    }
  }

  return {
    ok: errors.length === 0,
    total_rows: rows.length,
    success_count: success,
    error_count: errors.length,
    errors,
  };
}

async function commitAdminRows(rows: Array<Record<string, string>>) {
  const supabase = await createClient();
  const adminClient = serviceRoleClient();
  const adminRoleId = await getAdminRoleId();

  if (!adminClient) {
    return {
      ok: false,
      total_rows: rows.length,
      success_count: 0,
      error_count: rows.length,
      errors: [{ row_number: 0, errors: ["SUPABASE_SERVICE_ROLE_KEY belum tersedia"] }],
    };
  }

  if (!adminRoleId) {
    return {
      ok: false,
      total_rows: rows.length,
      success_count: 0,
      error_count: rows.length,
      errors: [{ row_number: 0, errors: ["Role admin tidak ditemukan"] }],
    };
  }

  const { data: schools } = await supabase
    .from("schools")
    .select("id, npsn")
    .in("npsn", rows.map((row) => row.school_npsn));
  const schoolByNpsn = new Map((schools ?? []).map((school) => [school.npsn, school.id]));
  let success = 0;
  const errors: Array<{ row_number: number; errors: string[] }> = [];

  for (const [index, row] of rows.entries()) {
    const schoolId = schoolByNpsn.get(row.school_npsn);

    if (!schoolId) {
      errors.push({ row_number: index + 2, errors: ["Sekolah tidak ditemukan"] });
      continue;
    }

    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: row.email,
      password: row.password,
      email_confirm: true,
    });

    if (authError || !authData.user) {
      errors.push({
        row_number: index + 2,
        errors: [authError ? getFriendlyErrorMessage(authError) : "Gagal membuat auth user"],
      });
      continue;
    }

    const { data: user, error: userError } = await supabase
      .from("users")
      .insert({
        auth_user_id: authData.user.id,
        email: row.email,
        username: row.username,
        role_id: adminRoleId,
        school_id: schoolId,
        status: row.status === "inactive" ? "inactive" : "active",
      })
      .select("id")
      .single();

    if (userError || !user) {
      await adminClient.auth.admin.deleteUser(authData.user.id);
      errors.push({
        row_number: index + 2,
        errors: [userError ? getFriendlyErrorMessage(userError) : "Gagal membuat user"],
      });
      continue;
    }

    const { error: profileError } = await supabase.from("user_profiles").upsert(
      {
        user_id: user.id,
        full_name: row.full_name,
      },
      { onConflict: "user_id" },
    );

    if (profileError) {
      errors.push({ row_number: index + 2, errors: [getFriendlyErrorMessage(profileError)] });
    } else {
      success += 1;
    }
  }

  return {
    ok: errors.length === 0,
    total_rows: rows.length,
    success_count: success,
    error_count: errors.length,
    errors,
  };
}

async function buildBackupSnapshot(scope: "global" | "school", schoolId: string | null) {
  const supabase = await createClient();

  if (scope === "school" && !schoolId) {
    return {
      ok: false,
      message: "Sekolah wajib dipilih untuk backup per sekolah.",
      data: {},
      rowCounts: {},
    };
  }

  const [
    { data: settings },
    { data: schools },
    { data: users },
    { data: schedules },
    { data: attempts },
  ] = await Promise.all([
    supabase.from("system_settings").select("key, value, description"),
    scope === "school"
      ? supabase.from("schools").select("*").eq("id", schoolId).limit(1)
      : supabase.from("schools").select("*"),
    scope === "school"
      ? supabase.from("users").select("id, email, username, status, role_id, school_id").eq("school_id", schoolId)
      : supabase.from("users").select("id, email, username, status, role_id, school_id"),
    scope === "school"
      ? supabase.from("exam_schedules").select("id, title, status, school_id").eq("school_id", schoolId)
      : supabase.from("exam_schedules").select("id, title, status, school_id"),
    supabase.from("exam_attempts").select("id, status"),
  ]);

  return {
    ok: true,
    message: "Backup berhasil dibuat.",
    data: {
      scope,
      school_id: schoolId,
      generated_at: new Date().toISOString(),
      settings: settings ?? [],
      schools: schools ?? [],
      users: users ?? [],
      exam_schedules: schedules ?? [],
    },
    rowCounts: {
      settings: settings?.length ?? 0,
      schools: schools?.length ?? 0,
      users: users?.length ?? 0,
      exam_schedules: schedules?.length ?? 0,
      exam_attempts: attempts?.length ?? 0,
    },
  };
}

async function restoreLimitedSnapshot({
  scope,
  schoolId,
  snapshot,
  userId,
}: {
  scope: string;
  schoolId: string | null;
  snapshot: Record<string, unknown>;
  userId: string;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const settings = Array.isArray(snapshot.settings)
    ? (snapshot.settings as Array<{ key?: string; value?: unknown; description?: string }>)
    : [];
  const schools = Array.isArray(snapshot.schools)
    ? (snapshot.schools as Array<Record<string, unknown>>)
    : [];

  if (settings.length > 0) {
    const { error } = await supabase.from("system_settings").upsert(
      settings
        .filter((setting) => setting.key)
        .map((setting) => ({
          key: setting.key,
          value: setting.value ?? {},
          description: setting.description ?? null,
          updated_by: userId,
          updated_at: new Date().toISOString(),
        })),
      { onConflict: "key" },
    );

    if (error) {
      return { ok: false, message: getFriendlyErrorMessage(error) };
    }
  }

  if (scope === "school" && schoolId && schools[0]) {
    const school = schools[0];
    const { error } = await supabase
      .from("schools")
      .update({
        name: school.name,
        npsn: school.npsn,
        education_level: school.education_level,
        address: school.address,
        city: school.city,
        province: school.province,
        email: school.email,
        phone: school.phone,
        is_active: school.is_active,
      })
      .eq("id", schoolId);

    if (error) {
      return { ok: false, message: getFriendlyErrorMessage(error) };
    }
  }

  return {
    ok: true,
    message:
      scope === "school"
        ? "Restore terbatas berhasil: pengaturan dan metadata sekolah dipulihkan."
        : "Restore terbatas berhasil: pengaturan global dipulihkan.",
  };
}
