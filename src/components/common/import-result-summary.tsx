"use client";

interface ImportResultRow {
  row_number: number;
  errors: string[];
}

export interface ImportResultSummaryProps {
  totalRows: number;
  successCount: number;
  errorCount: number;
  failedRows?: ImportResultRow[];
  maxErrorsDisplay?: number;
}

export function ImportResultSummary({
  totalRows,
  successCount,
  errorCount,
  failedRows = [],
  maxErrorsDisplay = 10,
}: ImportResultSummaryProps) {
  const displayedErrors = failedRows.slice(0, maxErrorsDisplay);
  const hiddenErrorsCount = Math.max(0, failedRows.length - maxErrorsDisplay);

  const successPercentage =
    totalRows > 0 ? Math.round((successCount / totalRows) * 100) : 0;

  return (
    <div className="space-y-6 rounded-lg border bg-card p-6">
      <div>
        <h3 className="mb-4 text-lg font-semibold">Hasil Import</h3>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border p-4">
            <div className="text-xs text-muted-foreground">Total Baris</div>
            <div className="mt-1 text-2xl font-bold">{totalRows}</div>
          </div>
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
            <div className="text-xs font-medium text-emerald-700">Berhasil</div>
            <div className="mt-1 flex items-baseline gap-2">
              <div className="text-2xl font-bold text-emerald-700">
                {successCount}
              </div>
              <div className="text-xs text-emerald-600">
                ({successPercentage}%)
              </div>
            </div>
          </div>
          <div
            className={`rounded-lg p-4 ${
              errorCount > 0
                ? "border border-destructive/30 bg-destructive/10"
                : "border border-emerald-200 bg-emerald-50"
            }`}
          >
            <div
              className={`text-xs font-medium ${
                errorCount > 0 ? "text-destructive" : "text-emerald-700"
              }`}
            >
              {errorCount > 0 ? "Gagal" : "Tidak ada error"}
            </div>
            <div
              className={`mt-1 text-2xl font-bold ${
                errorCount > 0 ? "text-destructive" : "text-emerald-700"
              }`}
            >
              {errorCount}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      {totalRows > 0 && (
        <div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium">Progress</span>
            <span className="text-xs text-muted-foreground">
              {successPercentage}% selesai
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full transition-all ${
                errorCount > 0 ? "bg-amber-500" : "bg-emerald-500"
              }`}
              style={{ width: `${successPercentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Error Details */}
      {displayedErrors.length > 0 && (
        <div>
          <h4 className="mb-3 text-sm font-medium text-destructive">
            Baris yang Gagal ({failedRows.length})
          </h4>
          <div className="space-y-2 rounded-md border border-destructive/30 bg-destructive/5">
            {displayedErrors.map((row) => (
              <div
                key={row.row_number}
                className="border-b px-3 py-2 last:border-b-0"
              >
                <div className="font-mono text-xs text-muted-foreground">
                  Baris {row.row_number}
                </div>
                <ul className="mt-1 space-y-1">
                  {row.errors.map((error, idx) => (
                    <li
                      key={idx}
                      className="text-xs text-destructive flex items-start gap-2"
                    >
                      <span className="mt-0.5">•</span>
                      <span>{error}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          {hiddenErrorsCount > 0 && (
            <p className="mt-2 text-xs text-muted-foreground">
              ...dan {hiddenErrorsCount} baris error lainnya
            </p>
          )}
        </div>
      )}

      {/* Success Message */}
      {errorCount === 0 && successCount > 0 && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-medium text-emerald-700">
            ✓ Import berhasil! {successCount} data telah diproses.
          </p>
        </div>
      )}
    </div>
  );
}
