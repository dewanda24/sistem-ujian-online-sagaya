import { requirePermission } from "@/lib/auth/require-permission";
import { createClient } from "@/lib/supabase/server";

type AuditPayload = Record<string, unknown>;

type AuditRow = {
  id: string | number;
  action: string | null;
  user_id: string | null;
  payload: AuditPayload | null;
  created_at: string | null;
};

export type ImportHistoryRow = {
  id: string;
  date: string;
  module: string;
  user: string;
  total: number;
  success: number;
  failed: number;
  status: "Berhasil" | "Berhasil Sebagian" | "Gagal";
  payload: AuditPayload;
};

export type ExportHistoryRow = {
  id: string;
  date: string;
  module: string;
  user: string;
  rowCount: number;
  format: string;
  status: "Berhasil" | "Gagal";
  payload: AuditPayload;
};

const importActions = [
  "students.import_csv",
  "teachers.import_csv",
  "subjects.import_csv",
  "classes.import_csv",
  "class_members.import_csv",
  "teacher_subjects.import_csv",
  "questions.import_excel",
  "questions.import_word",
  "questions.import_csv",
] as const;

const exportActions = [
  "data_export.teachers",
  "data_export.students",
  "data_export.classes",
  "data_export.teacher-assignments",
  "questions.export_csv",
  "reports.export",
  "monitoring.export",
] as const;

const moduleLabels: Record<string, string> = {
  "students.import_csv": "Siswa",
  "teachers.import_csv": "Guru",
  "subjects.import_csv": "Mata Pelajaran",
  "classes.import_csv": "Kelas",
  "class_members.import_csv": "Penugasan Siswa-Kelas",
  "teacher_subjects.import_csv": "Penugasan Guru-Mata Pelajaran-Kelas",
  "questions.import_excel": "Bank Soal Excel/CSV",
  "questions.import_word": "Bank Soal Word",
  "questions.import_csv": "Bank Soal CSV",
  "data_export.teachers": "Guru",
  "data_export.students": "Siswa",
  "data_export.classes": "Kelas",
  "data_export.teacher-assignments": "Penugasan Guru",
  "questions.export_csv": "Bank Soal",
  "reports.export": "Nilai",
  "monitoring.export": "Pengawasan",
};

export async function getImportExportHistories() {
  await requirePermission("import_export.view");
  const supabase = await createClient();
  const actions = [...importActions, ...exportActions];
  const { data, error } = await supabase
    .from("audit_logs")
    .select("id, action, user_id, payload, created_at")
    .in("action", actions)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error || !data) {
    return {
      imports: [] as ImportHistoryRow[],
      exports: [] as ExportHistoryRow[],
      unavailable: true,
    };
  }

  const rows = data as AuditRow[];
  const userNames = await getUserNames(rows.map((row) => row.user_id));

  return {
    imports: rows
      .filter(
        (row) =>
          row.action && (importActions as readonly string[]).includes(row.action),
      )
      .map((row) => toImportHistoryRow(row, userNames)),
    exports: rows
      .filter(
        (row) =>
          row.action && (exportActions as readonly string[]).includes(row.action),
      )
      .map((row) => toExportHistoryRow(row, userNames)),
    unavailable: false,
  };
}

async function getUserNames(userIds: Array<string | null>) {
  const ids = [...new Set(userIds.filter(Boolean))] as string[];

  if (ids.length === 0) {
    return new Map<string, string>();
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("users")
    .select("id, username, email, user_profiles(full_name)")
    .in("id", ids);

  return new Map(
    (data ?? []).map((user) => {
      const profile = Array.isArray(user.user_profiles)
        ? user.user_profiles[0]
        : user.user_profiles;

      return [
        user.id as string,
        profile?.full_name || user.username || user.email || "Unknown",
      ];
    }),
  );
}

function toImportHistoryRow(
  row: AuditRow,
  userNames: Map<string, string>,
): ImportHistoryRow {
  const payload = row.payload ?? {};
  const total = numberPayload(payload, "total_rows");
  const failed = numberPayload(payload, "failed_count", "error_count");
  const success = numberPayload(
    payload,
    "success_count",
    "created_count",
    "valid_count",
  );
  const status =
    failed > 0 && success > 0
      ? "Berhasil Sebagian"
      : failed > 0
        ? "Gagal"
        : "Berhasil";

  return {
    id: String(row.id),
    date: row.created_at ?? "",
    module: moduleLabels[row.action ?? ""] ?? row.action ?? "-",
    user: row.user_id ? userNames.get(row.user_id) ?? row.user_id : "Sistem",
    total,
    success,
    failed,
    status,
    payload,
  };
}

function toExportHistoryRow(
  row: AuditRow,
  userNames: Map<string, string>,
): ExportHistoryRow {
  const payload = row.payload ?? {};

  return {
    id: String(row.id),
    date: row.created_at ?? "",
    module: moduleLabels[row.action ?? ""] ?? row.action ?? "-",
    user: row.user_id ? userNames.get(row.user_id) ?? row.user_id : "Sistem",
    rowCount: numberPayload(payload, "row_count", "count"),
    format: String(payload.format ?? "CSV").toUpperCase(),
    status: "Berhasil",
    payload,
  };
}

function numberPayload(payload: AuditPayload, ...keys: string[]) {
  for (const key of keys) {
    const value = Number(payload[key] ?? 0);

    if (Number.isFinite(value) && value > 0) {
      return value;
    }
  }

  return 0;
}
