"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";

import { ConfirmSubmitButton } from "@/components/dashboard/confirm-submit-button";
import { DataTable } from "@/components/master-data/data-table";
import {
  previewExcelImportAction,
  saveExcelImportAction,
  type ExcelImportPreviewState,
} from "@/features/question-bank/excel-import-actions";
import {
  type ExcelImportRow,
} from "@/features/question-bank/excel-import";

type ExcelImportFormProps = {
  notice?: string;
  message?: string;
  hideTemplateLink?: boolean;
};

const initialState: ExcelImportPreviewState = {
  ok: false,
  message: "",
  rows: [],
};

export function ExcelImportForm({
  notice,
  message,
  hideTemplateLink = false,
}: ExcelImportFormProps) {
  const [previewState, previewAction, isPreviewPending] = useActionState(
    previewExcelImportAction,
    initialState,
  );
  const [rows, setRows] = useState<ExcelImportRow[]>([]);
  const validatedRows = rows;
  const validCount = validatedRows.filter((row) => row.errors.length === 0).length;
  const warningCount = validatedRows.filter(
    (row) => row.errors.length === 0 && row.warnings.length > 0,
  ).length;
  const errorCount = validatedRows.length - validCount;
  const validRows = validatedRows.filter((row) => row.errors.length === 0);

  useEffect(() => {
    if (previewState.rows.length > 0) {
      const timer = window.setTimeout(() => setRows(previewState.rows), 0);

      return () => window.clearTimeout(timer);
    }
  }, [previewState.rows]);

  return (
    <div className="space-y-6">
      {notice && message ? (
        <div
          className={
            notice === "success"
              ? "rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"
              : "rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
          }
        >
          {message}
        </div>
      ) : null}

      <section className="rounded-lg border bg-card p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="text-base font-semibold">Upload File</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Preview dulu sebelum simpan. Hanya baris valid yang akan diimport
            sebagai draft.
          </p>
        </div>
        <form action={previewAction} className="grid gap-4">
          <input
            name="file"
            type="file"
            accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="rounded-md border px-3 py-2 text-sm"
            required
          />
          <div className="flex flex-wrap gap-3">
            {hideTemplateLink ? null : (
              <Link
                href="/api/templates/questions-excel"
                className="rounded-md border px-4 py-2 text-sm hover:bg-muted"
              >
                Download Template Excel
              </Link>
            )}
            <button
              disabled={isPreviewPending}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPreviewPending ? "Memproses..." : "Preview Import"}
            </button>
          </div>
        </form>
        {previewState.message ? (
          <div
            className={
              previewState.ok
                ? "mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"
                : "mt-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
            }
          >
            {previewState.message}
          </div>
        ) : null}
      </section>

      {validatedRows.length > 0 ? (
        <section className="rounded-lg border bg-card p-5 shadow-sm">
          <div className="mb-4 grid gap-3 md:grid-cols-4">
            <Metric label="Total" value={validatedRows.length} />
            <Metric label="Valid" value={validCount} tone="success" />
            <Metric label="Warning" value={warningCount} tone="warning" />
            <Metric label="Error" value={errorCount} tone="danger" />
          </div>
          <div className="mb-4 flex flex-wrap gap-2">
            <DownloadJsonButton
              filename="bank-soal-excel-error-log.json"
              label="Download Error Log"
              payload={validatedRows
                .filter((row) => row.errors.length > 0)
                .map((row) => ({
                  row_number: row.row_number,
                  errors: row.errors,
                }))}
              disabled={errorCount === 0}
            />
            <DownloadJsonButton
              filename="bank-soal-excel-preview-result.json"
              label="Download Result"
              payload={{
                total_rows: validatedRows.length,
                valid_rows: validCount,
                error_rows: errorCount,
                rows: validatedRows,
              }}
            />
          </div>
          <DataTable
            columns={[
              "Baris",
              "Status",
              "Mapel",
              "Kategori",
              "Tipe",
              "Soal",
              "Opsi",
              "Jawaban",
              "Stimulus",
            ]}
            searchPlaceholder="Cari soal, mapel, kategori..."
            stickyActionColumn={false}
          >
            {validatedRows.map((row) => (
              <tr key={row.local_id} className="align-top">
                <td className="px-4 py-3">{row.row_number}</td>
                <td className="px-4 py-3">
                        <div
                          className={
                            row.errors.length
                              ? "font-medium text-destructive"
                              : row.warnings.length
                                ? "font-medium text-amber-700"
                                : "font-medium text-emerald-700"
                          }
                        >
                          {row.errors.length
                            ? "Error"
                            : row.warnings.length
                              ? "Warning"
                              : "Valid"}
                        </div>
                        {[...row.errors, ...row.warnings].map((item) => (
                          <div key={item} className="mt-1 text-xs text-muted-foreground">
                            {item}
                          </div>
                        ))}
                </td>
                <td className="px-4 py-3">{row.subject_code || "-"}</td>
                <td className="px-4 py-3">{row.category || "-"}</td>
                <td className="px-4 py-3">{row.type}</td>
                <td className="max-w-xs whitespace-pre-wrap px-4 py-3">
                  {row.content || "-"}
                </td>
                <td className="px-4 py-3">
                  {["A", "B", "C", "D", "E"].map((label) => (
                    <div key={label}>
                      {label}.{" "}
                      {row[
                        `option_${label.toLowerCase()}` as keyof ExcelImportRow
                      ] as string}
                    </div>
                  ))}
                </td>
                <td className="px-4 py-3">{row.correct_answer || "-"}</td>
                <td className="max-w-xs px-4 py-3">
                  <div className="font-medium">{row.stimulus_title || "-"}</div>
                  <div className="line-clamp-3 text-xs text-muted-foreground">
                    {row.stimulus_content}
                  </div>
                </td>
              </tr>
            ))}
          </DataTable>
          <form action={saveExcelImportAction} className="mt-5 flex justify-end">
            <input
              type="hidden"
              name="rows_json"
              value={JSON.stringify(validRows)}
            />
            <ConfirmSubmitButton
              disabled={validCount === 0}
              confirmMessage={`Import ${validCount} baris valid ke bank soal sebagai draft?`}
              confirmTitle="Konfirmasi Import"
              loadingText="Sedang import..."
              variant="default"
              className="px-4 py-2 text-sm"
            >
              Import Baris Valid
            </ConfirmSubmitButton>
          </form>
        </section>
      ) : null}
    </div>
  );
}

function DownloadJsonButton({
  filename,
  label,
  payload,
  disabled = false,
}: {
  filename: string;
  label: string;
  payload: unknown;
  disabled?: boolean;
}) {
  function download() {
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      onClick={download}
      disabled={disabled}
      className="rounded-md border px-3 py-2 text-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
    >
      {label}
    </button>
  );
}

function Metric({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "success" | "warning" | "danger";
}) {
  const tones = {
    default: "text-foreground",
    success: "text-emerald-700",
    warning: "text-amber-700",
    danger: "text-destructive",
  };

  return (
    <div className="rounded-md border p-3 text-sm">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-lg font-semibold ${tones[tone]}`}>{value}</div>
    </div>
  );
}
