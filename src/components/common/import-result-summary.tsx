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
    <div className="space-y-6 rounded-xl border border-[#E2E8F0] bg-white p-4 text-[#0F172A] shadow-sm sm:p-6">
      <div>
        <h3 className="mb-4 text-lg font-semibold">Hasil Import</h3>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
            <div className="text-xs text-[#64748B]">Total Baris</div>
            <div className="mt-1 text-2xl font-bold">{totalRows}</div>
          </div>
          <div className="rounded-xl border border-[#22C55E]/25 bg-emerald-50 p-4">
            <div className="text-xs font-medium text-[#16A34A]">Berhasil</div>
            <div className="mt-1 flex items-baseline gap-2">
              <div className="text-2xl font-bold text-[#16A34A]">
                {successCount}
              </div>
              <div className="text-xs text-[#16A34A]">
                ({successPercentage}%)
              </div>
            </div>
          </div>
          <div
            className={`rounded-xl p-4 ${
              errorCount > 0
                ? "border border-[#EF4444]/30 bg-red-50"
                : "border border-[#22C55E]/25 bg-emerald-50"
            }`}
          >
            <div
              className={`text-xs font-medium ${
                errorCount > 0 ? "text-[#DC2626]" : "text-[#16A34A]"
              }`}
            >
              {errorCount > 0 ? "Gagal" : "Tidak ada kesalahan"}
            </div>
            <div
              className={`mt-1 text-2xl font-bold ${
                errorCount > 0 ? "text-[#DC2626]" : "text-[#16A34A]"
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
            <span className="font-medium">Progres</span>
            <span className="text-xs text-[#64748B]">
              {successPercentage}% selesai
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[#E2E8F0]">
            <div
              className={`h-full transition-all ${
                errorCount > 0 ? "bg-[#F59E0B]" : "bg-[#22C55E]"
              }`}
              style={{ width: `${successPercentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Error Details */}
      {displayedErrors.length > 0 && (
        <div>
          <h4 className="mb-3 text-sm font-medium text-[#DC2626]">
            Baris yang Gagal ({failedRows.length})
          </h4>
          <div className="space-y-2 rounded-xl border border-[#EF4444]/30 bg-red-50">
            {displayedErrors.map((row) => (
              <div
                key={row.row_number}
                className="border-b px-3 py-2 last:border-b-0"
              >
                <div className="font-mono text-xs text-[#64748B]">
                  Baris {row.row_number}
                </div>
                <ul className="mt-1 space-y-1">
                  {row.errors.map((error, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 text-xs text-[#DC2626]"
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
            <p className="mt-2 text-xs text-[#64748B]">
              ...dan {hiddenErrorsCount} baris dengan kesalahan lainnya
            </p>
          )}
        </div>
      )}

      {/* Success Message */}
      {errorCount === 0 && successCount > 0 && (
        <div className="rounded-xl border border-[#22C55E]/25 bg-emerald-50 p-4">
          <p className="text-sm font-medium text-[#16A34A]">
            ✓ Import berhasil! {successCount} data telah diproses.
          </p>
        </div>
      )}
    </div>
  );
}
