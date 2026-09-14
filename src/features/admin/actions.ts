"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient as createServiceClient } from "@supabase/supabase-js";

import { logAuditEvent } from "@/lib/audit/log-audit-event";
import {
  getFriendlyErrorMessage,
  type ActionResult as StandardActionResult,
} from "@/lib/actions/action-result";
import { requirePermission } from "@/lib/auth/require-permission";
import { requireRole } from "@/lib/auth/require-role";
import {
  assertSameSchool,
  requireSchoolScope,
} from "@/lib/auth/school-scope";
import { createClient } from "@/lib/supabase/server";
import {
  adminRoleLabelSchema,
  adminUserPasswordResetSchema,
  adminUserSchema,
} from "@/lib/validations/admin";

type ActionResult = {
  ok: boolean;
  message: string;
  errors?: StandardActionResult["errors"];
};

function formString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

function redirectTo(path: string, result: ActionResult): never {
  const params = new URLSearchParams({
    status: result.ok ? "success" : "error",
    message: result.ok ? result.message : getFriendlyErrorMessage(result.message),
  });

  redirect(`${path}${path.includes("?") ? "&" : "?"}${params.toString()}`);
}

function getOperationalUserRedirectPath(formData: FormData) {
  const path = formString(formData, "redirect_path");
  const basePath = path.split("?")[0].split("#")[0];
  const allowedPaths = new Set([
    "/dashboard/master-data/users",
    "/dashboard/master-data/admins",
    "/dashboard/master-data/proctors",
    "/dashboard/master-data/teachers",
    "/dashboard/master-data/students",
    "/dashboard/super-admin/admins",
    "/dashboard/super-admin/users",
    "/dashboard/super-admin/schools",
  ]);

  if (
    allowedPaths.has(basePath) ||
    /^\/dashboard\/super-admin\/schools\/[0-9a-f-]{36}$/i.test(basePath)
  ) {
    return path;
  }

  return "/dashboard/super-admin/users";
}

function serviceRoleClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    return null;
  }

  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}

function firstRelation<T>(value: T | T[] | null | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function isGlobalUserRole(roleName: string | null | undefined) {
  return roleName === "super_admin" || roleName === "admin";
}

async function getRoleNameById(roleId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("roles")
    .select("name")
    .eq("id", roleId)
    .maybeSingle();

  return data?.name ? String(data.name) : null;
}

async function getPermissionCodeById(permissionId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("permissions")
    .select("code")
    .eq("id", permissionId)
    .maybeSingle();

  return data?.code ? String(data.code) : null;
}

async function ensureUniqueUserCredentials({
  id,
  email,
  username,
  redirectPath,
}: {
  id?: string | null;
  email: string;
  username: string;
  redirectPath: string;
}) {
  const supabase = await createClient();
  const [{ data: emailUser }, { data: usernameUser }] = await Promise.all([
    supabase.from("users").select("id").eq("email", email).maybeSingle(),
    supabase.from("users").select("id").eq("username", username).maybeSingle(),
  ]);

  if (emailUser?.id && emailUser.id !== id) {
    redirectTo(redirectPath, {
      ok: false,
      message: "Email sudah digunakan.",
    });
  }

  if (usernameUser?.id && usernameUser.id !== id) {
    redirectTo(redirectPath, {
      ok: false,
      message: "Username sudah digunakan.",
    });
  }
}

export async function saveAdminUserAction(formData: FormData) {
  const redirectPath = getOperationalUserRedirectPath(formData);
  const parsed = adminUserSchema.safeParse({
    id: formString(formData, "id"),
    auth_user_id: formString(formData, "auth_user_id"),
    email: formString(formData, "email"),
    username: formString(formData, "username"),
    password: formString(formData, "password"),
    full_name: formString(formData, "full_name"),
    role_id: formString(formData, "role_id"),
    school_id: formString(formData, "school_id"),
    status: formString(formData, "status") || "active",
  });

  if (!parsed.success) {
    redirectTo(redirectPath, {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Data user tidak valid.",
    });
  }

  const currentUser = await requirePermission(
    parsed.data.id ? "users.update" : "users.create",
  );
  const scope = await requireSchoolScope();
  const supabase = await createClient();
  const adminClient = serviceRoleClient();
  const {
    id,
    auth_user_id,
    email,
    username,
    password,
    full_name,
    role_id,
    school_id,
    status,
  } = parsed.data;
  let authUserId = auth_user_id;
  const roleName = await getRoleNameById(role_id);

  if (!roleName || roleName === "teacher" || roleName === "student") {
    redirectTo(id ? `${redirectPath}?edit=${id}` : redirectPath, {
      ok: false,
      message:
        "Guru dan siswa dikelola dari Data Sekolah. Pilih peran operasional.",
    });
  }

  if (!scope.isSuperAdmin && isGlobalUserRole(roleName)) {
    redirectTo(id ? `${redirectPath}?edit=${id}` : redirectPath, {
      ok: false,
      message:
        "Akun Admin Sekolah dan Super Admin hanya boleh dikelola oleh Super Admin.",
    });
  }

  await ensureUniqueUserCredentials({
    id,
    email,
    username,
    redirectPath: id ? `${redirectPath}?edit=${id}` : redirectPath,
  });

  if (!id) {
    if (!adminClient) {
      redirectTo(redirectPath, {
        ok: false,
        message:
          "Kunci layanan Supabase belum tersedia. Akun login tidak dapat dibuat.",
      });
    }

    const { data, error } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error || !data.user) {
      redirectTo(redirectPath, {
        ok: false,
        message: error ? getFriendlyErrorMessage(error) : "Gagal membuat auth user.",
      });
    }

    authUserId = data.user.id;
  }

  if (id && authUserId && adminClient && password) {
    const { error } = await adminClient.auth.admin.updateUserById(authUserId, {
      password,
    });

    if (error) {
      redirectTo(`${redirectPath}?edit=${id}`, {
        ok: false,
        message: getFriendlyErrorMessage(error),
      });
    }
  }

  if (id && authUserId && adminClient) {
    const { error } = await adminClient.auth.admin.updateUserById(authUserId, {
      email,
    });

    if (error) {
      redirectTo(`${redirectPath}?edit=${id}`, {
        ok: false,
        message: getFriendlyErrorMessage(error),
      });
    }
  }

  let targetSchoolId: string | null = null;

  if (id) {
    const { data: targetUser } = await supabase
      .from("users")
      .select("school_id, roles(name)")
      .eq("id", id)
      .maybeSingle();
    const targetRole = firstRelation(targetUser?.roles);

    assertSameSchool(scope, targetUser?.school_id);

    if (!scope.isSuperAdmin && isGlobalUserRole(targetRole?.name)) {
      redirectTo(`${redirectPath}?edit=${id}`, {
        ok: false,
        message:
          "Akun Admin Sekolah dan Super Admin hanya boleh dikelola oleh Super Admin.",
      });
    }

    targetSchoolId = targetUser?.school_id ?? null;
  }

  const resolvedSchoolId = roleName === "super_admin"
    ? null
    : scope.isSuperAdmin
      ? (school_id ?? targetSchoolId)
      : scope.schoolId;

  if (roleName === "admin" && !resolvedSchoolId) {
    redirectTo(id ? `${redirectPath}?edit=${id}` : redirectPath, {
      ok: false,
      message: "Admin Sekolah wajib terhubung ke sekolah.",
    });
  }

  const userPayload = {
    auth_user_id: authUserId,
    email,
    username,
    role_id,
    status,
    school_id: resolvedSchoolId,
  };

  const { data: savedUser, error: userError } = id
    ? await supabase
        .from("users")
        .update(userPayload)
        .eq("id", id)
        .select("id")
        .single()
    : await supabase.from("users").insert(userPayload).select("id").single();

  if (userError || !savedUser) {
    if (!id && authUserId && adminClient) {
      await adminClient.auth.admin.deleteUser(authUserId);
    }

    redirectTo(id ? `${redirectPath}?edit=${id}` : redirectPath, {
      ok: false,
      message: userError ? getFriendlyErrorMessage(userError) : "Gagal menyimpan user.",
    });
  }

  const { error: profileError } = await supabase.from("user_profiles").upsert(
    {
      user_id: savedUser.id,
      full_name,
    },
    { onConflict: "user_id" },
  );

  if (profileError && !id) {
    await supabase.from("users").delete().eq("id", savedUser.id);
    if (authUserId && adminClient) {
      await adminClient.auth.admin.deleteUser(authUserId);
    }
  }

  if (!profileError) {
    await logAuditEvent({
      userId: currentUser.id,
      action: id ? "users.update" : "users.create",
      entityType: "users",
      entityId: savedUser.id,
      payload: {
        email,
        username,
        role_id,
        status,
      },
    });
  }

  revalidatePath("/dashboard/super-admin/users");
  revalidatePath("/dashboard/master-data/admins");
  revalidatePath("/dashboard/master-data/proctors");
  revalidatePath("/dashboard/super-admin/schools");
  if (resolvedSchoolId) {
    revalidatePath(`/dashboard/super-admin/schools/${resolvedSchoolId}`);
  }
  redirectTo(redirectPath, {
    ok: !profileError,
    message: profileError
      ? getFriendlyErrorMessage(profileError)
      : id
        ? "Data berhasil diperbarui."
        : "Data berhasil disimpan.",
  });
}

export async function toggleAdminUserStatusAction(formData: FormData) {
  const redirectPath = getOperationalUserRedirectPath(formData);
  const currentUser = await requirePermission("users.update");
  const scope = await requireSchoolScope();
  const supabase = await createClient();
  const id = formString(formData, "id");
  const { data: targetUser } = await supabase
    .from("users")
    .select("school_id, roles(name)")
    .eq("id", id)
    .maybeSingle();
  const targetRole = firstRelation(targetUser?.roles);

  assertSameSchool(scope, targetUser?.school_id);

  if (!scope.isSuperAdmin && isGlobalUserRole(targetRole?.name)) {
    redirectTo(redirectPath, {
      ok: false,
      message:
        "Akun Admin Sekolah dan Super Admin hanya boleh dikelola oleh Super Admin.",
    });
  }

  const status = formString(formData, "status") === "active" ? "active" : "inactive";
  const { error } = await supabase.from("users").update({ status }).eq("id", id);

  if (!error) {
    await logAuditEvent({
      userId: currentUser.id,
      action: "users.status_update",
      entityType: "users",
      entityId: id,
      payload: { status },
    });
  }

  revalidatePath("/dashboard/super-admin/users");
  revalidatePath("/dashboard/master-data/users");
  revalidatePath("/dashboard/master-data/teachers");
  revalidatePath("/dashboard/master-data/students");
  revalidatePath("/dashboard/master-data/admins");
  revalidatePath("/dashboard/master-data/proctors");
  revalidatePath("/dashboard/super-admin/schools");
  if (targetUser?.school_id) {
    revalidatePath(`/dashboard/super-admin/schools/${targetUser.school_id}`);
  }
  redirectTo(redirectPath, {
    ok: !error,
    message: error ? getFriendlyErrorMessage(error) : "Data berhasil diperbarui.",
  });
}

export async function deleteAdminUserAction(formData: FormData) {
  const redirectPath = getOperationalUserRedirectPath(formData);
  const currentUser = await requirePermission("users.delete");
  const scope = await requireSchoolScope();
  const id = formString(formData, "id");

  if (!id) {
    redirectTo(redirectPath, {
      ok: false,
      message: "ID pengguna tidak valid.",
    });
  }

  if (id === currentUser.id) {
    redirectTo(redirectPath, {
      ok: false,
      message: "Anda tidak dapat menghapus akun Anda sendiri yang sedang digunakan.",
    });
  }

  const supabase = await createClient();
  const adminClient = serviceRoleClient();
  const dbClient = adminClient ?? supabase;

  const { data: targetUser } = await dbClient
    .from("users")
    .select("id, school_id, auth_user_id, email, username, role_id, roles(name)")
    .eq("id", id)
    .maybeSingle();

  if (!targetUser) {
    redirectTo(redirectPath, {
      ok: false,
      message: "Pengguna tidak ditemukan.",
    });
  }

  const targetRole = firstRelation(targetUser.roles);

  if (!scope.isSuperAdmin) {
    assertSameSchool(scope, targetUser.school_id);
    if (isGlobalUserRole(targetRole?.name)) {
      redirectTo(redirectPath, {
        ok: false,
        message: "Hanya Super Admin yang dapat menghapus akun Admin atau Super Admin.",
      });
    }
  }

  // Prevent deleting super_admin
  if (targetRole?.name === "super_admin") {
    redirectTo(redirectPath, {
      ok: false,
      message: "Akun Super Admin bersifat permanen dan tidak dapat dihapus dari sistem.",
    });
  }

  // 1. Clear homeroom teacher in classes
  await dbClient
    .from("classes")
    .update({ homeroom_teacher_id: null })
    .eq("homeroom_teacher_id", id);

  // 2. Clear teacher subjects assignments
  await dbClient.from("teacher_subjects").delete().eq("teacher_id", id);

  // 3. Clear class members
  await dbClient.from("class_members").delete().eq("student_id", id);

  // 4. Clear exam proctors (both as proctor teacher or assigned_by)
  await dbClient.from("exam_proctors").delete().eq("teacher_id", id);
  await dbClient.from("exam_proctors").update({ assigned_by: null }).eq("assigned_by", id);

  // 5. Clear exam participants & attempts & answers & events
  const { data: userAttempts } = await dbClient
    .from("exam_attempts")
    .select("id")
    .eq("student_id", id);
  const userAttemptIds = (userAttempts ?? []).map((a) => a.id);

  if (userAttemptIds.length > 0) {
    await dbClient.from("exam_answers").delete().in("exam_attempt_id", userAttemptIds);
    await dbClient.from("exam_events").delete().in("exam_attempt_id", userAttemptIds);
    await dbClient.from("exam_attempts").delete().in("id", userAttemptIds);
  }

  await dbClient.from("exam_answers").update({ graded_by: null }).eq("graded_by", id);
  await dbClient.from("exam_events").update({ student_id: null }).eq("student_id", id);
  await dbClient.from("exam_participants").delete().eq("student_id", id);

  // 6. Clear created_by in questions and exams
  await dbClient.from("questions").update({ created_by: null }).eq("created_by", id);
  await dbClient.from("question_versions").update({ created_by: null }).eq("created_by", id);
  await dbClient.from("exam_schedules").update({ created_by: null }).eq("created_by", id);
  await dbClient.from("exam_packages").update({ created_by: null }).eq("created_by", id);

  // 7. Clear audit logs & system settings & jobs
  await dbClient.from("audit_logs").update({ user_id: null }).eq("user_id", id);
  await dbClient.from("system_settings").update({ updated_by: null }).eq("updated_by", id);
  await dbClient.from("super_admin_import_jobs").update({ created_by: null }).eq("created_by", id);
  await dbClient.from("super_admin_import_jobs").update({ committed_by: null }).eq("committed_by", id);
  await dbClient.from("super_admin_backup_jobs").update({ created_by: null }).eq("created_by", id);
  await dbClient.from("super_admin_backup_jobs").update({ restored_by: null }).eq("restored_by", id);

  // 8. Delete user profile
  await dbClient.from("user_profiles").delete().eq("user_id", id);

  // 9. Delete user row
  const { error } = await dbClient.from("users").delete().eq("id", id);

  if (error) {
    redirectTo(redirectPath, {
      ok: false,
      message: getFriendlyErrorMessage(error),
    });
  }

  // 4. Delete auth user
  if (targetUser.auth_user_id && adminClient) {
    try {
      await adminClient.auth.admin.deleteUser(targetUser.auth_user_id);
    } catch {
      // Ignore if auth user is already removed
    }
  }

  await logAuditEvent({
    userId: currentUser.id,
    action: "users.delete",
    entityType: "users",
    entityId: id,
    payload: {
      email: targetUser.email,
      username: targetUser.username,
      role: targetRole?.name,
    },
  });

  revalidatePath("/dashboard/super-admin/users");
  revalidatePath("/dashboard/master-data/users");
  revalidatePath("/dashboard/master-data/teachers");
  revalidatePath("/dashboard/master-data/students");
  revalidatePath("/dashboard/master-data/admins");
  revalidatePath("/dashboard/master-data/proctors");
  revalidatePath("/dashboard/super-admin/admins");
  revalidatePath("/dashboard/super-admin/schools");
  if (targetUser.school_id) {
    revalidatePath(`/dashboard/super-admin/schools/${targetUser.school_id}`);
  }

  redirectTo(redirectPath, {
    ok: true,
    message: `Akun "${targetUser.username}" berhasil dihapus secara permanen.`,
  });
}

export async function resetAdminUserPasswordAction(formData: FormData) {
  const redirectPath = getOperationalUserRedirectPath(formData);
  const currentUser = await requirePermission("users.update");
  const scope = await requireSchoolScope();
  const parsed = adminUserPasswordResetSchema.safeParse({
    id: formString(formData, "id"),
    password: formString(formData, "password"),
  });

  if (!parsed.success) {
    redirectTo(redirectPath, {
      ok: false,
      message:
        parsed.error.issues[0]?.message ?? "Password baru tidak valid.",
    });
  }

  const supabase = await createClient();
  const { data: targetUser } = await supabase
    .from("users")
    .select("id, auth_user_id, email, school_id, roles(name)")
    .eq("id", parsed.data.id)
    .maybeSingle();
  const role = Array.isArray(targetUser?.roles)
    ? targetUser?.roles[0]
    : targetUser?.roles;

  if (!targetUser) {
    redirectTo(redirectPath, {
      ok: false,
      message: "Pengguna tidak ditemukan.",
    });
  }

  assertSameSchool(scope, targetUser.school_id);

  if (!scope.isSuperAdmin && isGlobalUserRole(role?.name)) {
    redirectTo(redirectPath, {
      ok: false,
      message:
        "Akun Admin Sekolah dan Super Admin hanya boleh dikelola oleh Super Admin.",
    });
  }

  if (
    !scope.isSuperAdmin &&
    redirectPath !== "/dashboard/master-data/users" &&
    (role?.name === "teacher" || role?.name === "student")
  ) {
    redirectTo(redirectPath, {
      ok: false,
      message: "Password guru dan siswa dikelola dari Master Data.",
    });
  }

  const adminClient = serviceRoleClient();

  if (!adminClient) {
    redirectTo(redirectPath, {
      ok: false,
      message:
        "Kunci layanan Supabase belum tersedia. Password login tidak dapat diubah.",
    });
  }

  let authUserId = targetUser.auth_user_id;

  if (!authUserId) {
    const { data: newAuth, error: authError } = await adminClient.auth.admin.createUser({
      email: targetUser.email,
      password: parsed.data.password,
      email_confirm: true,
      user_metadata: {
        username: (targetUser as any).username,
        role: role?.name,
      },
    });

    if (authError || !newAuth.user) {
      redirectTo(redirectPath, {
        ok: false,
        message: `Gagal membuat akun login auth: ${authError?.message ?? "Error tidak diketahui"}`,
      });
    }

    authUserId = newAuth.user.id;
    await supabase.from("users").update({ auth_user_id: authUserId }).eq("id", targetUser.id);
  } else {
    const { error: updateError } = await adminClient.auth.admin.updateUserById(
      authUserId,
      {
        password: parsed.data.password,
      },
    );

    if (updateError) {
      redirectTo(redirectPath, {
        ok: false,
        message: `Gagal mereset password: ${updateError.message}`,
      });
    }
  }

  await logAuditEvent({
    userId: currentUser.id,
    action: "users.password_reset",
    entityType: "users",
    entityId: targetUser.id,
    payload: {
      email: targetUser.email,
    },
  });

  revalidatePath("/dashboard/super-admin/users");
  revalidatePath("/dashboard/master-data/users");
  revalidatePath("/dashboard/master-data/teachers");
  revalidatePath("/dashboard/master-data/students");
  revalidatePath("/dashboard/master-data/admins");
  revalidatePath("/dashboard/master-data/proctors");
  revalidatePath("/dashboard/super-admin/schools");
  if (targetUser.school_id) {
    revalidatePath(`/dashboard/super-admin/schools/${targetUser.school_id}`);
  }
  redirectTo(redirectPath, {
    ok: true,
    message: "Password pengguna berhasil diperbarui.",
  });
}

export async function updateRolePermissionAction(formData: FormData) {
  await requireRole("super_admin");
  const currentUser = await requirePermission("roles.manage");
  const supabase = await createClient();
  const roleId = formString(formData, "role_id");
  const permissionId = formString(formData, "permission_id");
  const enabled = formString(formData, "enabled") === "true";
  const roleName = await getRoleNameById(roleId);
  const permissionCode = await getPermissionCodeById(permissionId);

  if (!roleName || !permissionCode) {
    redirectTo("/dashboard/super-admin/permissions", {
      ok: false,
      message: "Hak akses atau izin akses tidak ditemukan.",
    });
  }

  if (roleName === "super_admin") {
    redirectTo("/dashboard/super-admin/permissions", {
      ok: false,
      message: "Izin akses Super Admin tidak dapat diubah dari tabel ini.",
    });
  }

  const { data: existing } = await supabase
    .from("role_permissions")
    .select("role_id, permission_id")
    .eq("role_id", roleId)
    .eq("permission_id", permissionId)
    .maybeSingle();
  const { error } =
    enabled && !existing
      ? await supabase
          .from("role_permissions")
          .insert({ role_id: roleId, permission_id: permissionId })
      : !enabled
        ? await supabase
            .from("role_permissions")
            .delete()
            .eq("role_id", roleId)
            .eq("permission_id", permissionId)
        : { error: null };

  if (!error) {
    await logAuditEvent({
      userId: currentUser.id,
      action: enabled
        ? "role_permissions.grant"
        : "role_permissions.revoke",
      entityType: "role_permissions",
      entityId: roleId,
      payload: {
        role_id: roleId,
        role_name: roleName,
        permission_id: permissionId,
        permission_code: permissionCode,
        enabled,
      },
    });
  }

  revalidatePath("/dashboard/super-admin/permissions");
  redirectTo("/dashboard/super-admin/permissions", {
    ok: !error,
    message: error ? getFriendlyErrorMessage(error) : "Data berhasil diperbarui.",
  });
}

export async function updateRoleLabelAction(formData: FormData) {
  await requireRole("super_admin");
  const currentUser = await requirePermission("roles.manage");
  const parsed = adminRoleLabelSchema.safeParse({
    id: formString(formData, "id"),
    label: formString(formData, "label"),
  });

  if (!parsed.success) {
    redirectTo("/dashboard/super-admin/roles", {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Label hak akses tidak valid.",
    });
  }

  const supabase = await createClient();
  const { data: roleBefore } = await supabase
    .from("roles")
    .select("id, name, label")
    .eq("id", parsed.data.id)
    .maybeSingle();

  if (!roleBefore) {
    redirectTo("/dashboard/super-admin/roles", {
      ok: false,
      message: "Peran tidak ditemukan.",
    });
  }

  const { error } = await supabase
    .from("roles")
    .update({ label: parsed.data.label })
    .eq("id", parsed.data.id);

  if (!error) {
    await logAuditEvent({
      userId: currentUser.id,
      action: "roles.label_update",
      entityType: "roles",
      entityId: parsed.data.id,
      payload: {
        name: roleBefore.name,
        old_label: roleBefore.label,
        new_label: parsed.data.label,
      },
    });
  }

  revalidatePath("/dashboard/super-admin/roles");
  redirectTo("/dashboard/super-admin/roles", {
    ok: !error,
    message: error ? getFriendlyErrorMessage(error) : "Data berhasil diperbarui.",
  });
}

