import { createClient as createServiceClient } from "@supabase/supabase-js";

import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";

type Relation<T> = T | T[] | null | undefined;

type SystemSettingRow = {
  key: string;
  value: Record<string, unknown>;
  description: string | null;
  updated_at: string | null;
};

type BackupJobRow = {
  id: string;
  scope: "global" | "school";
  school_id: string | null;
  status: "running" | "completed" | "failed" | "restored";
  kind: string;
  row_counts: Record<string, unknown>;
  error_message: string | null;
  created_at: string | null;
  restored_at: string | null;
  schools?: Relation<{ name?: string | null }>;
};

type ImportJobRow = {
  id: string;
  type: "schools" | "school_admins";
  status: "previewed" | "committed" | "failed";
  filename: string | null;
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
  errors: Array<{ row_number: number; errors: string[] }>;
  result: Record<string, unknown>;
  created_at: string | null;
  committed_at: string | null;
};

type LiveScheduleRow = {
  id: string;
  title: string | null;
  status: string | null;
  start_at: string | null;
  end_at: string | null;
  school_id: string | null;
  schools?: Relation<{ name?: string | null }>;
  exam_attempts?: Array<{
    id: string;
    status: string | null;
    last_activity_at?: string | null;
    locked_at?: string | null;
  }> | null;
  exam_events?: Array<{
    id: string;
    type?: string | null;
    event_type?: string | null;
    created_at?: string | null;
  }> | null;
};

export type PlatformSettings = {
  app_name: string;
  logo_url: string;
  theme: string;
  maintenance_mode: boolean;
};

export type CbtDefaultSettings = {
  autosave_interval_seconds: number;
  default_token_required: boolean;
  shuffle_questions: boolean;
  shuffle_options: boolean;
  fullscreen_violation_limit: number;
};

function firstRelation<T>(value: Relation<T>): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
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

function platformDefaults(): PlatformSettings {
  return {
    app_name: process.env.NEXT_PUBLIC_APP_NAME || "Sistem Ujian Online Sagaya",
    logo_url: "",
    theme: "default",
    maintenance_mode: process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true",
  };
}

function cbtDefaults(): CbtDefaultSettings {
  return {
    autosave_interval_seconds: 30,
    default_token_required: true,
    shuffle_questions: true,
    shuffle_options: true,
    fullscreen_violation_limit: 3,
  };
}

export async function getSystemSettings() {
  await requireRole("super_admin");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("system_settings")
    .select("key, value, description, updated_at")
    .in("key", ["platform", "cbt_defaults"]);

  if (error || !data) {
    return {
      platform: platformDefaults(),
      cbt: cbtDefaults(),
      unavailable: true,
      updatedAt: null as string | null,
    };
  }

  const rows = data as SystemSettingRow[];
  const platform = rows.find((row) => row.key === "platform")?.value ?? {};
  const cbt = rows.find((row) => row.key === "cbt_defaults")?.value ?? {};

  return {
    platform: {
      ...platformDefaults(),
      ...platform,
    } as PlatformSettings,
    cbt: {
      ...cbtDefaults(),
      ...cbt,
    } as CbtDefaultSettings,
    unavailable: false,
    updatedAt: rows
      .map((row) => row.updated_at)
      .filter(Boolean)
      .sort()
      .at(-1) ?? null,
  };
}

export async function getBackupJobs() {
  await requireRole("super_admin");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("super_admin_backup_jobs")
    .select(
      "id, scope, school_id, status, kind, row_counts, error_message, created_at, restored_at, schools(name)",
    )
    .order("created_at", { ascending: false })
    .limit(50);

  if (error || !data) {
    return { rows: [] as BackupJobRow[], unavailable: true };
  }

  return {
    rows: (data as BackupJobRow[]).map((row) => ({
      ...row,
      schools: firstRelation(row.schools),
    })),
    unavailable: false,
  };
}

export async function getGlobalImportJobs() {
  await requireRole("super_admin");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("super_admin_import_jobs")
    .select("id, type, status, filename, total_rows, valid_rows, invalid_rows, errors, result, created_at, committed_at")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error || !data) {
    return { rows: [] as ImportJobRow[], unavailable: true };
  }

  return { rows: data as ImportJobRow[], unavailable: false };
}

export async function getSchoolOptionsForSuperAdmin() {
  await requireRole("super_admin");
  const supabase = await createClient();
  const { data } = await supabase
    .from("schools")
    .select("id, name")
    .order("name");

  return (data ?? []).map((school) => ({
    value: String(school.id),
    label: String(school.name),
  }));
}

export async function getLiveSuperAdminMonitoringData() {
  await requireRole("super_admin");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("exam_schedules")
    .select(
      "id, title, status, start_at, end_at, school_id, schools(name), exam_attempts(id, status, last_activity_at, locked_at), exam_events(id, type, event_type, created_at)",
    )
    .in("status", ["active", "in_progress", "scheduled"])
    .is("deleted_at", null)
    .order("start_at", { ascending: false })
    .limit(50);

  if (error || !data) {
    return {
      rows: [],
      summary: {
        runningExams: 0,
        onlineParticipants: 0,
        problematicParticipants: 0,
        failedSubmits: 0,
        systemErrors: 0,
      },
      unavailable: true,
    };
  }

  const now = Date.now();
  const rows = (data as LiveScheduleRow[]).map((schedule) => {
    const attempts = schedule.exam_attempts ?? [];
    const events = schedule.exam_events ?? [];
    const onlineParticipants = attempts.filter((attempt) => {
      if (!attempt.last_activity_at) {
        return attempt.status === "in_progress";
      }

      return now - new Date(attempt.last_activity_at).getTime() <= 5 * 60 * 1000;
    }).length;
    const problematicParticipants = attempts.filter(
      (attempt) => attempt.locked_at || attempt.status === "expired",
    ).length;
    const failedSubmits = attempts.filter(
      (attempt) => attempt.status === "expired" || attempt.status === "cancelled",
    ).length;
    const systemErrors = events.filter((event) => {
      const type = event.type ?? event.event_type ?? "";
      return type.includes("error") || type.includes("failed");
    }).length;

    return {
      id: schedule.id,
      title: schedule.title ?? "-",
      status: schedule.status ?? "-",
      start_at: schedule.start_at,
      end_at: schedule.end_at,
      schoolName: firstRelation(schedule.schools)?.name ?? "-",
      participantCount: attempts.length,
      onlineParticipants,
      problematicParticipants,
      failedSubmits,
      systemErrors,
      eventCount: events.length,
    };
  });

  return {
    rows,
    summary: {
      runningExams: rows.filter((row) => row.status === "active" || row.status === "in_progress").length,
      onlineParticipants: rows.reduce((total, row) => total + row.onlineParticipants, 0),
      problematicParticipants: rows.reduce((total, row) => total + row.problematicParticipants, 0),
      failedSubmits: rows.reduce((total, row) => total + row.failedSubmits, 0),
      systemErrors: rows.reduce((total, row) => total + row.systemErrors, 0),
    },
    unavailable: false,
  };
}

export async function getBackupServiceClient() {
  await requireRole("super_admin");
  return serviceRoleClient() ?? (await createClient());
}
