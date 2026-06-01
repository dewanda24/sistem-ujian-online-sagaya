import { createClient as createServiceClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

import { logAuditEvent } from "@/lib/audit/log-audit-event";
import type { CurrentUser } from "@/types/auth";
import {
  operationalResetScopes,
  operationalResetRetainedTables,
  type OperationalResetScope,
  type ResetTableSummary,
  type OperationalResetSummary,
} from "@/features/operational-reset/reset-plan";

type ServiceClient = SupabaseClient;

const DELETE_ALL_ORDER = [
  "exam_events",
  "exam_answers",
  "exam_attempts",
  "exam_participants",
  "exam_schedule_classes",
  "exam_schedules",
  "exam_package_questions",
  "exam_packages",
  "question_attachments",
  "question_versions",
  "question_options",
  "questions",
  "question_stimuli",
  "question_categories",
  "teacher_subjects",
  "student_classes",
  "class_members",
  "classes",
  "semesters",
  "academic_years",
  "subjects",
  "schools",
  "audit_logs",
];

const USER_REFERENCE_COLUMNS = [
  { table: "question_categories", column: "created_by" },
  { table: "questions", column: "created_by" },
  { table: "question_stimuli", column: "created_by" },
  { table: "question_attachments", column: "created_by" },
  { table: "question_versions", column: "created_by" },
  { table: "classes", column: "homeroom_teacher_id" },
];

export async function resetOperationalData(
  currentUser: CurrentUser,
  requestedScopes: OperationalResetScope[],
) {
  const supabase = serviceRoleClient();
  const tableSummaries: ResetTableSummary[] = [];
  const scopes = expandScopes(requestedScopes);
  const tablesToDelete = getTablesForScopes(scopes);

  if (scopes.length === 0) {
    throw new Error("Pilih minimal satu kategori data untuk reset.");
  }

  for (const table of DELETE_ALL_ORDER.filter((table) =>
    tablesToDelete.has(table),
  )) {
    tableSummaries.push(await deleteAllRows(supabase, table));
  }

  const shouldDeleteUsers = scopes.includes("operational_users");
  const shouldDeleteStudents = scopes.includes("students");
  const operationalUsers = shouldDeleteUsers
    ? await getNonSuperAdminUsers(supabase)
    : shouldDeleteStudents
      ? await getUsersByRoleNames(supabase, ["student"])
    : [];
  const operationalUserIds = operationalUsers.map((user) => user.id);
  const authUserIds = operationalUsers
    .map((user) => user.auth_user_id)
    .filter((id): id is string => Boolean(id));

  if (shouldDeleteUsers && operationalUserIds.length > 0) {
    await nullifyUserReferences(supabase, operationalUserIds);
    await deleteStudentOwnedData(supabase, operationalUserIds, tableSummaries);

    const profileSummary = await deleteByIn(
      supabase,
      "user_profiles",
      "user_id",
      operationalUserIds,
      "akun non-Super Admin",
    );
    tableSummaries.push(profileSummary);

    const userSummary = await deleteByIn(
      supabase,
      "users",
      "id",
      operationalUserIds,
      "akun non-Super Admin",
    );
    tableSummaries.push(userSummary);
  } else if (shouldDeleteUsers) {
    tableSummaries.push({
      table: "user_profiles",
      deleted: 0,
      note: "Tidak ada akun non-Super Admin.",
    });
    tableSummaries.push({
      table: "users",
      deleted: 0,
      note: "Tidak ada akun non-Super Admin untuk dihapus.",
    });
  } else if (shouldDeleteStudents && operationalUserIds.length > 0) {
    await deleteStudentOwnedData(supabase, operationalUserIds, tableSummaries);

    const profileSummary = await deleteByIn(
      supabase,
      "user_profiles",
      "user_id",
      operationalUserIds,
      "akun siswa",
    );
    tableSummaries.push(profileSummary);

    const userSummary = await deleteByIn(
      supabase,
      "users",
      "id",
      operationalUserIds,
      "akun siswa",
    );
    tableSummaries.push(userSummary);
  } else if (shouldDeleteStudents) {
    tableSummaries.push({
      table: "user_profiles",
      deleted: 0,
      note: "Tidak ada akun siswa.",
    });
    tableSummaries.push({
      table: "users",
      deleted: 0,
      note: "Tidak ada akun siswa untuk dihapus.",
    });
  }

  let authUsersDeleted = 0;
  for (const authUserId of authUserIds) {
    const { error } = await supabase.auth.admin.deleteUser(authUserId);

    if (error) {
      throw new Error(`Gagal menghapus auth user ${authUserId}: ${error.message}`);
    }

    authUsersDeleted += 1;
  }

  if (!scopes.includes("audit_logs")) {
    await logAuditEvent({
      userId: currentUser.id,
      action: "selected_data.reset",
      entityType: "system",
      payload: {
        scopes,
        tables: tableSummaries,
        operational_users_deleted: operationalUsers.length,
        auth_users_deleted: authUsersDeleted,
        retained: operationalResetRetainedTables,
      },
    });
  }

  return {
    scopes,
    tables: tableSummaries,
    operationalUsersDeleted: operationalUsers.length,
    authUsersDeleted,
    retained: [...operationalResetRetainedTables],
  } satisfies OperationalResetSummary;
}

function expandScopes(requestedScopes: OperationalResetScope[]) {
  const allowedScopes = new Set(operationalResetScopes.map((scope) => scope.id));
  const scopes = new Set(
    requestedScopes.filter((scope) => allowedScopes.has(scope)),
  );

  if (scopes.has("master_data")) {
    scopes.add("exams");
    scopes.add("assignments");
    scopes.add("question_bank");
  }

  if (scopes.has("question_bank")) {
    scopes.add("exams");
  }

  if (scopes.has("operational_users")) {
    scopes.add("exams");
    scopes.add("assignments");
  }

  return [...scopes];
}

function getTablesForScopes(scopes: OperationalResetScope[]) {
  const scopeSet = new Set(scopes);
  const tables = new Set<string>();

  for (const scope of operationalResetScopes) {
    if (!scopeSet.has(scope.id)) continue;

    for (const table of scope.tables) {
      if (!table.includes("(") && !table.includes(".")) {
        tables.add(table);
      }
    }
  }

  return tables;
}

function serviceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY wajib tersedia untuk reset data operasional.",
    );
  }

  return createServiceClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

async function deleteAllRows(supabase: ServiceClient, table: string) {
  const before = await countRows(supabase, table);

  if (before.missing) {
    return {
      table,
      deleted: 0,
      skipped: true,
      note: "Tabel belum ada di database ini.",
    };
  }

  const { error } = await supabase.from(table).delete().not("id", "is", null);

  if (isMissingTableError(error)) {
    return {
      table,
      deleted: 0,
      skipped: true,
      note: "Tabel belum ada di database ini.",
    };
  }

  if (error) {
    throw new Error(`Gagal mengosongkan ${table}: ${error.message}`);
  }

  return { table, deleted: before.count };
}

async function deleteByIn(
  supabase: ServiceClient,
  table: string,
  column: string,
  values: string[],
  note?: string,
) {
  if (values.length === 0) {
    return { table, deleted: 0, note };
  }

  let deleted = 0;
  for (const chunk of chunkValues(values)) {
    const { error } = await supabase.from(table).delete().in(column, chunk);

    if (isMissingTableError(error)) {
      return {
        table,
        deleted: 0,
        skipped: true,
        note: "Tabel belum ada di database ini.",
      };
    }

    if (error) {
      throw new Error(`Gagal menghapus ${table}: ${error.message}`);
    }

    deleted += chunk.length;
  }

  return { table, deleted, note };
}

async function countRows(supabase: ServiceClient, table: string) {
  const { count, error } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true });

  if (isMissingTableError(error)) {
    return { count: 0, missing: true };
  }

  if (error) {
    throw new Error(`Gagal membaca jumlah ${table}: ${error.message}`);
  }

  return { count: count ?? 0, missing: false };
}

async function getNonSuperAdminUsers(supabase: ServiceClient) {
  const { data, error } = await supabase
    .from("users")
    .select("id, auth_user_id, roles!inner(name)")
    .neq("roles.name", "super_admin");

  if (error) {
    throw new Error(`Gagal membaca akun non-Super Admin: ${error.message}`);
  }

  return (data ?? [])
    .map((user) => ({
      id: String(user.id),
      auth_user_id:
        typeof user.auth_user_id === "string" ? user.auth_user_id : null,
    }))
    .filter((user) => Boolean(user.id));
}

async function getUsersByRoleNames(supabase: ServiceClient, roleNames: string[]) {
  const { data, error } = await supabase
    .from("users")
    .select("id, auth_user_id, roles!inner(name)")
    .in("roles.name", roleNames);

  if (error) {
    throw new Error(`Gagal membaca akun ${roleNames.join(", ")}: ${error.message}`);
  }

  return (data ?? [])
    .map((user) => ({
      id: String(user.id),
      auth_user_id:
        typeof user.auth_user_id === "string" ? user.auth_user_id : null,
    }))
    .filter((user) => Boolean(user.id));
}

async function deleteStudentOwnedData(
  supabase: ServiceClient,
  studentIds: string[],
  tableSummaries: ResetTableSummary[],
) {
  const attemptIds = await getIdsByIn(
    supabase,
    "exam_attempts",
    "student_id",
    studentIds,
  );

  if (attemptIds.length > 0) {
    tableSummaries.push(
      await deleteByIn(
        supabase,
        "exam_answers",
        "exam_attempt_id",
        attemptIds,
        "jawaban milik siswa",
      ),
    );
  } else {
    tableSummaries.push({
      table: "exam_answers",
      deleted: 0,
      note: "Tidak ada jawaban milik siswa.",
    });
  }

  tableSummaries.push(
    await deleteByIn(
      supabase,
      "exam_events",
      "student_id",
      studentIds,
      "event ujian milik siswa",
    ),
  );
  tableSummaries.push(
    await deleteByIn(
      supabase,
      "exam_attempts",
      "student_id",
      studentIds,
      "attempt ujian milik siswa",
    ),
  );
  tableSummaries.push(
    await deleteByIn(
      supabase,
      "exam_participants",
      "student_id",
      studentIds,
      "peserta ujian milik siswa",
    ),
  );
  tableSummaries.push(
    await deleteByIn(
      supabase,
      "student_classes",
      "student_id",
      studentIds,
      "assignment kelas siswa",
    ),
  );
  tableSummaries.push(
    await deleteByIn(
      supabase,
      "class_members",
      "student_id",
      studentIds,
      "riwayat kelas siswa",
    ),
  );
}

async function getIdsByIn(
  supabase: ServiceClient,
  table: string,
  column: string,
  values: string[],
) {
  const ids: string[] = [];

  for (const chunk of chunkValues(values)) {
    const { data, error } = await supabase
      .from(table)
      .select("id")
      .in(column, chunk);

    if (isMissingTableError(error)) {
      return [];
    }

    if (error) {
      throw new Error(`Gagal membaca ${table}: ${error.message}`);
    }

    ids.push(...((data ?? []).map((row) => String(row.id))));
  }

  return ids;
}

async function nullifyUserReferences(
  supabase: ServiceClient,
  userIds: string[],
) {
  for (const { table, column } of USER_REFERENCE_COLUMNS) {
    for (const chunk of chunkValues(userIds)) {
      const { error } = await supabase
        .from(table)
        .update({ [column]: null })
        .in(column, chunk);

      if (isMissingTableError(error) || isMissingColumnError(error)) {
        break;
      }

      if (error) {
        throw new Error(
          `Gagal melepas referensi ${table}.${column}: ${error.message}`,
        );
      }
    }
  }
}

function chunkValues(values: string[], size = 100) {
  const chunks: string[][] = [];

  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }

  return chunks;
}

function isMissingTableError(error: { code?: string } | null) {
  return error?.code === "42P01" || error?.code === "PGRST205";
}

function isMissingColumnError(error: { code?: string } | null) {
  return error?.code === "42703" || error?.code === "PGRST204";
}
