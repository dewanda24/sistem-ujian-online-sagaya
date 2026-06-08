"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/common/dialogs/confirm-dialog";
import { commitStudentClassAssignmentImportAction } from "@/features/import-export/actions";
import { LoadingButton } from "@/components/common/loading-button";
import { ImportResultSummary } from "@/components/common/import-result-summary";
import Link from "next/link";
import { getMissingCsvHeaders, parseCsvText } from "@/lib/import/csv";

interface ValidationResult {
  row_number: number;
  student_email: string;
  class_name: string;
  academic_year: string;
  joined_at: string;
  errors: string[];
  isValid: boolean;
}

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

function parseCsv(text: string) {
  const parsed = parseCsvText(text);

  if (parsed.rows.length === 0) {
    return [];
  }

  const headers = parsed.headers.map((header) =>
    header.toLowerCase().trim(),
  );
  const expectedHeaders = [
    "student_email",
    "class_name",
    "academic_year",
    "joined_at",
  ];

  // Check if headers are valid
  const missingHeaders = getMissingCsvHeaders(headers, expectedHeaders);

  if (missingHeaders.length > 0) {
    throw new Error(
      `Header tidak lengkap. Belum ada: ${missingHeaders.join(", ")}`,
    );
  }

  return parsed.rows.map((sourceRow) => {
    const row: Record<string, string> = {};

    for (const [key, value] of Object.entries(sourceRow)) {
      row[key.toLowerCase().trim()] = value;
    }

    return row;
  });
}

export function StudentAssignmentImportForm() {
  const [file, setFile] = useState<File | null>(null);
  const [previewRows, setPreviewRows] = useState<ValidationResult[]>([]);
  const [parseError, setParseError] = useState<string>("");
  const [pendingFormData, setPendingFormData] = useState<FormData | null>(null);

  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    (_previousState, formData) =>
      commitStudentClassAssignmentImportAction(formData),
    {
      ok: false,
      message: "",
    },
  );

  useEffect(() => {
    if (!state.message) return;
    if (state.ok) {
      toast.success(state.message);
      return;
    }
    toast.error(state.message);
  }, [state]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];

    if (!selectedFile) {
      setFile(null);
      setPreviewRows([]);
      setParseError("");
      return;
    }

    if (!selectedFile.name.toLowerCase().endsWith(".csv")) {
      setParseError("File harus berformat CSV");
      setFile(null);
      setPreviewRows([]);
      return;
    }

    setFile(selectedFile);
    setParseError("");

    try {
      const text = await selectedFile.text();
      const rows = parseCsv(text);

      const validated: ValidationResult[] = rows.map((row, index) => {
        const errors: string[] = [];

        if (!row.student_email?.trim()) {
          errors.push("student_email tidak boleh kosong");
        }
        if (!row.class_name?.trim()) {
          errors.push("class_name tidak boleh kosong");
        }
        if (!row.academic_year?.trim()) {
          errors.push("academic_year tidak boleh kosong");
        }

        // Optional validation for joined_at
        if (
          row.joined_at &&
          !/^\d{4}-\d{2}-\d{2}$/.test(row.joined_at.trim())
        ) {
          errors.push("joined_at harus format YYYY-MM-DD (contoh: 2026-07-15)");
        }

        return {
          row_number: index + 2,
          student_email: row.student_email ?? "",
          class_name: row.class_name ?? "",
          academic_year: row.academic_year ?? "",
          joined_at: row.joined_at ?? "",
          errors,
          isValid: errors.length === 0,
        };
      });

      setPreviewRows(validated);
    } catch (error) {
      setParseError(
        error instanceof Error ? error.message : "Gagal membaca file CSV",
      );
      setPreviewRows([]);
    }
  };

  const validCount = previewRows.filter((r) => r.isValid).length;
  const invalidCount = previewRows.filter((r) => !r.isValid).length;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!file) {
      setParseError("Pilih file terlebih dahulu");
      return;
    }

    if (invalidCount > 0) {
      setParseError("Terdapat baris dengan error. Perbaiki sebelum import.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setPendingFormData(formData);
  };

  return (
    <div className="space-y-6 rounded-lg border bg-card p-6">
      <div>
        <h3 className="text-lg font-semibold">Import Penugasan Siswa-Kelas</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload file CSV dengan kolom: student_email, class_name,
          academic_year, joined_at (opsional)
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* File Input */}
        <div className="space-y-2">
          <label htmlFor="file" className="text-sm font-medium">
            File CSV
          </label>
          <div className="flex gap-2">
            <input
              id="file"
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileChange}
              disabled={isPending}
              className="flex-1 rounded-md border px-3 py-2 text-sm file:mr-4 file:rounded file:border-0 file:bg-primary file:px-4 file:py-2 file:text-xs file:font-medium file:text-primary-foreground hover:file:bg-primary/90 disabled:opacity-50"
            />
            <Link
              href="/api/templates/student-class-assignments"
              className="inline-flex items-center rounded-md border px-4 py-2 text-sm hover:bg-muted transition"
            >
              Unduh Template
            </Link>
          </div>
        </div>

        {/* Error Message */}
        {parseError && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {parseError}
          </div>
        )}

        {/* Preview Section */}
        {previewRows.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">
                Pratinjau ({previewRows.length} baris)
              </h4>
              <div className="flex gap-4 text-xs">
                <div>
                  <span className="text-muted-foreground">Valid: </span>
                  <span className="font-medium text-emerald-600">
                    {validCount}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Error: </span>
                  <span className="font-medium text-destructive">
                    {invalidCount}
                  </span>
                </div>
              </div>
            </div>

            <div className="hidden max-h-96 overflow-auto rounded-md border md:block">
              <table className="w-full text-sm">
                <thead className="sticky top-0 border-b bg-muted/60">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium">
                      Baris
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium">
                      Email
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium">
                      Kelas
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium">
                      Tahun
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {previewRows.map((row) => (
                    <tr
                      key={row.row_number}
                      className={row.isValid ? "" : "bg-destructive/5"}
                    >
                      <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                        {row.row_number}
                      </td>
                      <td className="px-3 py-2 text-xs">{row.student_email}</td>
                      <td className="px-3 py-2 text-xs">{row.class_name}</td>
                      <td className="px-3 py-2 text-xs">{row.academic_year}</td>
                      <td className="px-3 py-2">
                        {row.isValid ? (
                          <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">
                            Valid
                          </span>
                        ) : (
                          <div className="text-xs text-destructive space-y-0.5">
                            {row.errors.map((err, i) => (
                              <div key={i}>• {err}</div>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid max-h-96 gap-2 overflow-y-auto md:hidden">
              {previewRows.map((row) => (
                <article
                  key={row.row_number}
                  className={`rounded-xl border p-3 text-sm ${
                    row.isValid ? "bg-background" : "bg-destructive/5"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="line-clamp-1 font-medium">
                        {row.student_email}
                      </div>
                      <div className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                        {row.class_name} - {row.academic_year}
                      </div>
                    </div>
                    <span className="shrink-0 rounded-md border px-1.5 py-0.5 text-xs">
                      #{row.row_number}
                    </span>
                  </div>
                  <div className="mt-2 text-xs">
                    {row.isValid ? (
                      <span className="inline-flex rounded-full bg-emerald-100 px-2 py-1 font-medium text-emerald-700">
                        Valid
                      </span>
                    ) : (
                      <div className="space-y-0.5 text-destructive">
                        {row.errors.slice(0, 2).map((err, i) => (
                          <div key={i}>{err}</div>
                        ))}
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {/* Result Summary */}
        {state.summary && (
          <ImportResultSummary
            totalRows={state.summary.total}
            successCount={state.summary.valid}
            errorCount={state.summary.invalid}
            failedRows={state.summary.errors}
          />
        )}

        {/* Success/Error Message */}
        {state.message && (
          <div
            className={`rounded-md p-3 text-sm ${
              state.ok
                ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border border-destructive/30 bg-destructive/10 text-destructive"
            }`}
          >
            {state.message}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              setFile(null);
              setPreviewRows([]);
              setParseError("");
            }}
            disabled={isPending}
            className="rounded-md border px-4 py-2 text-sm font-medium transition hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Batal
          </button>
          <LoadingButton
            type="submit"
            disabled={previewRows.length === 0 || invalidCount > 0}
            isLoading={isPending}
            loadingText="Sedang import..."
          >
            Import {validCount > 0 ? `(${validCount} baris)` : ""}
          </LoadingButton>
        </div>
      </form>
      <ConfirmDialog
        isOpen={Boolean(pendingFormData)}
        title="Konfirmasi Import"
        description={`Import ${validCount} penugasan siswa-kelas yang valid?`}
        confirmLabel="Import"
        isLoading={isPending}
        onCancel={() => setPendingFormData(null)}
        onConfirm={() => {
          if (!pendingFormData || isPending) return;
          formAction(pendingFormData);
          setPendingFormData(null);
          toast.info("Import penugasan siswa-kelas sedang diproses.");
        }}
      />
    </div>
  );
}
