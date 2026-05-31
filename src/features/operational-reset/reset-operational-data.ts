import { createClient as createServiceClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

import { logAuditEvent } from "@/lib/audit/log-audit-event";
import type { CurrentUser } from "@/types/auth";
import {
  operationalResetRetainedTables,
  type ResetTableSummary,
  type OperationalResetSummary,
} from "@/features/operational-reset/reset-plan";

type ServiceClient = SupabaseClient;

const USER_ROLES_TO_DELETE = [
  "admin",
  "principal",
  "teacher",
  "student",
  "proctor",
];

const DELETE_ALL_ORDER = [
  "exam_events",
  "exam_answers",
  "exam_attempts",
  "exam_participants",
  "exam_schedule_classes",
  "exam_schedules",
  "exam_package_questions",
  "exam_packages",
  "teacher_subjects",
  "student_classes",
  "class_members",
  "classes",
  "semesters",
  "academic_years",
];

const QUESTION_BANK_USER_REFERENCE_COLUMNS = [
  { table: "question_categories", column: "created_by" },
  { table: "questions", column: "created_by" },
  { table: "question_stimuli", column: "created_by" },
  { table: "question_attachments", column: "created_by" },
  { table: "question_versions", column: "created_by" },
];

export async function resetOperationalData(currentUser: CurrentUser) {
  const supabase = serviceRoleClient();
  const tableSummaries: ResetTableSummary[] = [];

  for (const table of DELETE_ALL_ORDER) {
    tableSummaries.push(await deleteAllRows(supabase, table));
  }

  const operationalUsers = await getOperationalUsers(supabase);
  const operationalUserIds = operationalUsers.map((user) => user.id);
  const authUserIds = operationalUsers
    .map((user) => user.auth_user_id)
    .filter((id): id is string => Boolean(id));

  if (operationalUserIds.length > 0) {
    await nullifyQuestionBankUserReferences(supabase, operationalUserIds);

    const profileSummary = await deleteByIn(
      supabase,
      "user_profiles",
      "user_id",
      operationalUserIds,
      "akun operasional",
    );
    tableSummaries.push(profileSummary);

    const userSummary = await deleteByIn(
      supabase,
      "users",
      "id",
      operationalUserIds,
      "role admin, principal, teacher, student, proctor",
    );
    tableSummaries.push(userSummary);
  } else {
    tableSummaries.push({
      table: "user_profiles",
      deleted: 0,
      note: "Tidak ada akun operasional.",
    });
    tableSummaries.push({
      table: "users",
      deleted: 0,
      note: "Tidak ada role operasional untuk dihapus.",
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

  await logAuditEvent({
    userId: currentUser.id,
    action: "operational_data.reset",
    entityType: "system",
    payload: {
      tables: tableSummaries,
      operational_users_deleted: operationalUsers.length,
      auth_users_deleted: authUsersDeleted,
      retained: operationalResetRetainedTables,
    },
  });

  return {
    tables: tableSummaries,
    operationalUsersDeleted: operationalUsers.length,
    authUsersDeleted,
    retained: [...operationalResetRetainedTables],
  } satisfies OperationalResetSummary;
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

async function getOperationalUsers(supabase: ServiceClient) {
  const { data, error } = await supabase
    .from("users")
    .select("id, auth_user_id, roles!inner(name)")
    .in("roles.name", USER_ROLES_TO_DELETE);

  if (error) {
    throw new Error(`Gagal membaca akun operasional: ${error.message}`);
  }

  return (data ?? [])
    .map((user) => ({
      id: String(user.id),
      auth_user_id:
        typeof user.auth_user_id === "string" ? user.auth_user_id : null,
    }))
    .filter((user) => Boolean(user.id));
}

async function nullifyQuestionBankUserReferences(
  supabase: ServiceClient,
  userIds: string[],
) {
  for (const { table, column } of QUESTION_BANK_USER_REFERENCE_COLUMNS) {
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
