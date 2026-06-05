"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { ImportResultSummary } from "@/components/common/import-result-summary";
import { ConfirmSubmitButton } from "@/components/dashboard/confirm-submit-button";
import { commitStudentClassAssignmentImportAction } from "@/features/import-export/actions";
import { commitTeacherSubjectAssignmentImportAction } from "@/features/import-export/actions-teacher-assignment";
import {
  importTemplates,
  type TemplateType,
} from "@/features/import-export/templates";
import {
  importClassesCsvAction,
  importStudentsCsvAction,
  importTeachersCsvAction,
} from "@/lib/actions/master-data-actions";
import {
  getMissingCsvHeaders,
  parseCsvText,
} from "@/lib/import/csv";

type PreviewRow = Record<string, string>;

const templateTypes: TemplateType[] = [
  "students",
  "teachers",
  "classes",
  "student-class-assignments",
  "teacher-subject-assignments",
  "questions",
];

type ActionState = {
  ok: boolean;
  message: string;
  summary?: {
    total: number;
    valid: number;
    invalid: number;
    errors: Array<{ row_number: number; errors: string[] }>;
  };
};

const initialActionState: ActionState = {
  ok: false,
  message: "",
};

export function ImportPreviewForm() {
  const [templateType, setTemplateType] = useState<TemplateType>("students");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<PreviewRow[]>([]);
  const [error, setError] = useState("");
  const [studentAssignmentState, studentAssignmentAction] = useActionState<
    ActionState,
    FormData
  >(
    (_previousState, formData) =>
      commitStudentClassAssignmentImportAction(formData),
    initialActionState,
  );
  const [teacherAssignmentState, teacherAssignmentAction] = useActionState<
    ActionState,
    FormData
  >(
    (_previousState, formData) =>
      commitTeacherSubjectAssignmentImportAction(formData),
    initialActionState,
  );
  const template = importTemplates[templateType];
  const importAction =
    templateType === "students"
      ? importStudentsCsvAction
      : templateType === "teachers"
        ? importTeachersCsvAction
        : templateType === "classes"
          ? importClassesCsvAction
          : templateType === "student-class-assignments"
            ? studentAssignmentAction
            : templateType === "teacher-subject-assignments"
              ? teacherAssignmentAction
              : null;
  const actionState =
    templateType === "student-class-assignments"
      ? studentAssignmentState
      : templateType === "teacher-subject-assignments"
        ? teacherAssignmentState
        : null;
  const requiredHeaders = useMemo(
    () => {
      const optionalHeaders =
        templateType === "student-class-assignments" ? ["joined_at"] : [];

      return template.columns
        .map((column) => column.key)
        .filter((header) => !optionalHeaders.includes(header));
    },
    [template, templateType],
  );
  const missingHeaders = getMissingCsvHeaders(headers, requiredHeaders);
  const rowErrors = rows.flatMap((row, index) =>
    requiredHeaders
      .filter((header) => !row[header])
      .map((header) => `Baris ${index + 2}: ${header} kosong`),
  );
  const formatErrors =
    templateType === "student-class-assignments"
      ? rows.flatMap((row, index) => {
          const joinedAt = row.joined_at?.trim();

          if (!joinedAt || /^\d{4}-\d{2}-\d{2}$/.test(joinedAt)) {
            return [];
          }

          return [
            `Baris ${index + 2}: joined_at harus format YYYY-MM-DD (contoh: 2026-07-15)`,
          ];
        })
      : [];
  const validationErrors = [...rowErrors, ...formatErrors];
  const isValid =
    headers.length > 0 &&
    missingHeaders.length === 0 &&
    validationErrors.length === 0;

  useEffect(() => {
    if (!actionState?.message) return;
    if (actionState.ok) {
      toast.success(actionState.message);
      return;
    }
    toast.error(actionState.message);
  }, [actionState]);

  async function handleFile(file?: File) {
    setError("");
    setHeaders([]);
    setRows([]);
    setSelectedFile(file ?? null);

    if (!file) {
      return;
    }

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("File harus berformat CSV.");
      return;
    }

    const parsed = parseCsvText(await file.text());
    setHeaders(parsed.headers);
    setRows(parsed.rows as PreviewRow[]);
  }

  return (
    <section className="rounded-lg border bg-card p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-base font-semibold">Import Staging Preview</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Validasi struktur CSV sebelum import. Untuk template siswa dan guru,
          tombol import akan muncul setelah preview valid.
        </p>
      </div>

      <form action={importAction ?? undefined} className="space-y-4">
        <div className="grid gap-3 md:grid-cols-[220px_1fr]">
        <select
          value={templateType}
          onChange={(event) => {
            setTemplateType(event.target.value as TemplateType);
            setSelectedFile(null);
            setHeaders([]);
            setRows([]);
            setError("");
          }}
          className="rounded-md border bg-background px-3 py-2 text-sm"
        >
          {templateTypes.map((type) => (
            <option key={type} value={type}>
              {importTemplates[type].title}
            </option>
          ))}
        </select>
        <input
          key={templateType}
          name="file"
          type="file"
          accept=".csv,text/csv"
          onChange={(event) => handleFile(event.target.files?.[0])}
          className="rounded-md border bg-background px-3 py-2 text-sm"
        />
        </div>

        {importAction ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3">
            <p className="text-sm text-muted-foreground">
              Preview valid akan membuat tombol import aktif. Import siswa/guru
              juga membuat akun auth sesuai kolom email dan password.
            </p>
            <ConfirmSubmitButton
              confirmMessage={`Import ${rows.length} baris ${template.title} sekarang? Pastikan data sudah benar.`}
              confirmTitle="Konfirmasi Import"
              loadingText="Mengimport..."
              variant="default"
              disabled={!selectedFile || !isValid}
            >
              Import Sekarang
            </ConfirmSubmitButton>
          </div>
        ) : (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            Template ini hanya divalidasi di staging preview. Gunakan form import
            khusus di bawah untuk menyimpan data.
          </div>
        )}
      </form>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-md border p-3 text-sm">
          <div className="text-xs text-muted-foreground">Template</div>
          <div className="font-medium">{template.title}</div>
        </div>
        <div className="rounded-md border p-3 text-sm">
          <div className="text-xs text-muted-foreground">Rows</div>
          <div className="font-medium">{rows.length}</div>
        </div>
        <div className="rounded-md border p-3 text-sm">
          <div className="text-xs text-muted-foreground">Status</div>
          <div className={isValid ? "font-medium text-emerald-700" : "font-medium text-amber-700"}>
            {isValid ? "Valid preview" : "Perlu validasi"}
          </div>
        </div>
      </div>

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      {missingHeaders.length ? (
        <p className="mt-3 text-sm text-red-600">
          Header belum lengkap: {missingHeaders.join(", ")}
        </p>
      ) : null}
      {validationErrors.length ? (
        <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          {validationErrors.slice(0, 8).map((item) => (
            <div key={item}>{item}</div>
          ))}
          {validationErrors.length > 8 ? (
            <div>+{validationErrors.length - 8} error lain.</div>
          ) : null}
        </div>
      ) : null}

      {actionState?.summary ? (
        <div className="mt-4">
          <ImportResultSummary
            totalRows={actionState.summary.total}
            successCount={actionState.summary.valid}
            errorCount={actionState.summary.invalid}
            failedRows={actionState.summary.errors}
          />
        </div>
      ) : null}

      {actionState?.message ? (
        <div
          className={`mt-4 rounded-md p-3 text-sm ${
            actionState.ok
              ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border border-destructive/30 bg-destructive/10 text-destructive"
          }`}
        >
          {actionState.message}
        </div>
      ) : null}

      {rows.length ? (
        <div className="mt-4 overflow-hidden rounded-lg border">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b bg-muted/60 text-xs uppercase text-muted-foreground">
                <tr>
                  {headers.map((header) => (
                    <th key={header} className="px-3 py-2 font-medium">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.slice(0, 20).map((row, index) => (
                  <tr key={index}>
                    {headers.map((header) => (
                      <td key={header} className="px-3 py-2">
                        {row[header] || "-"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </section>
  );
}
