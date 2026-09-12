"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, CheckSquare, Square } from "lucide-react";
import { StatusPill } from "@/components/dashboard/status-pill";
import { EmptyState } from "@/components/dashboard/empty-state";
import { ConfirmSubmitButton } from "@/components/dashboard/confirm-submit-button";
import { bulkFinalizeAttemptsAction } from "@/features/results/actions";

type AttemptItem = {
  id: string;
  score: number | string | null;
  max_score: number | string | null;
  correct_answers: number | null;
  total_questions: number | null;
  grading_status: string | null;
  student_name: string;
  student_identifier: string;
  schedule_title: string;
  subject_code: string;
};

type GradingTableProps = {
  attempts: AttemptItem[];
  canFinalize: boolean;
  scheduleId?: string;
  currentUrl: string;
};

export function GradingTable({
  attempts,
  canFinalize,
  scheduleId,
  currentUrl,
}: GradingTableProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const finalizableAttempts = useMemo(
    () => attempts.filter((a) => a.grading_status !== "finalized"),
    [attempts]
  );

  const allSelected =
    finalizableAttempts.length > 0 &&
    finalizableAttempts.every((a) => selectedIds.includes(a.id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(finalizableAttempts.map((a) => a.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  if (attempts.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8">
        <EmptyState
          title="Tidak ada pekerjaan grading"
          description="Daftar koreksi akan tampil setelah siswa mengumpulkan jawaban ujian."
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Bulk Action Bar */}
      {canFinalize && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50/60 p-3.5 shadow-2xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleSelectAll}
              disabled={finalizableAttempts.length === 0}
              className="inline-flex items-center gap-2 rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-xs font-bold text-blue-800 shadow-2xs hover:bg-blue-50 disabled:opacity-50 transition"
            >
              {allSelected ? (
                <CheckSquare className="size-4 text-blue-600" />
              ) : (
                <Square className="size-4 text-slate-400" />
              )}
              <span>
                {allSelected ? "Batal Pilih Semua" : `Pilih Semua Belum Final (${finalizableAttempts.length})`}
              </span>
            </button>
            {selectedIds.length > 0 && (
              <span className="text-xs font-semibold text-blue-900">
                {selectedIds.length} siswa dipilih
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {selectedIds.length > 0 && (
              <form action={bulkFinalizeAttemptsAction} className="inline-block">
                <input type="hidden" name="return_to" value={currentUrl} />
                {selectedIds.map((id) => (
                  <input key={id} type="hidden" name="attempt_ids" value={id} />
                ))}
                <ConfirmSubmitButton
                  confirmTitle="Finalisasi Nilai Terpilih"
                  confirmMessage={`Apakah Anda yakin ingin memfinalisasi nilai untuk ${selectedIds.length} siswa terpilih? Nilai yang difinalisasi akan langsung dapat dilihat oleh siswa dan masuk ke rekap akhir.`}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white shadow-2xs hover:bg-blue-700 transition"
                >
                  <CheckCircle2 className="size-3.5" />
                  <span>Finalisasi Terpilih ({selectedIds.length})</span>
                </ConfirmSubmitButton>
              </form>
            )}

            {scheduleId && finalizableAttempts.length > 0 && (
              <form action={bulkFinalizeAttemptsAction} className="inline-block">
                <input type="hidden" name="return_to" value={currentUrl} />
                <input type="hidden" name="schedule_id" value={scheduleId} />
                <input type="hidden" name="finalize_all" value="true" />
                <ConfirmSubmitButton
                  confirmTitle="Finalisasi Seluruh Siswa di Jadwal Ini"
                  confirmMessage={`Akan memfinalisasi seluruh ${finalizableAttempts.length} siswa yang belum berstatus final pada jadwal ujian ini. Pastikan seluruh jawaban esai telah Anda periksa.`}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-600 px-3.5 text-xs font-bold text-white shadow-2xs hover:bg-emerald-700 transition"
                >
                  <CheckCircle2 className="size-3.5" />
                  <span>Finalisasi Semua di Jadwal ({finalizableAttempts.length})</span>
                </ConfirmSubmitButton>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-bold uppercase tracking-wider text-slate-500">
              <tr>
                {canFinalize && <th className="w-10 px-4 py-3.5 text-center">#</th>}
                <th className="px-4 py-3.5">Siswa</th>
                <th className="px-4 py-3.5">Ujian</th>
                <th className="px-4 py-3.5">Mapel</th>
                <th className="px-4 py-3.5">Skor Akhir</th>
                <th className="px-4 py-3.5">Jawaban Benar</th>
                <th className="px-4 py-3.5">Status Koreksi</th>
                <th className="px-4 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {attempts.map((attempt) => {
                const isFinalized = attempt.grading_status === "finalized";
                const isSelected = selectedIds.includes(attempt.id);

                return (
                  <tr
                    key={attempt.id}
                    className={`transition-colors hover:bg-slate-50/60 ${
                      isSelected ? "bg-blue-50/40" : ""
                    }`}
                  >
                    {canFinalize && (
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={isFinalized}
                          onChange={() => toggleSelect(attempt.id)}
                          className="size-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                          title={isFinalized ? "Sudah final" : "Pilih untuk finalisasi"}
                        />
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900">
                        {attempt.student_name}
                      </div>
                      <div className="text-xs text-slate-500">
                        {attempt.student_identifier}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-700">
                      {attempt.schedule_title}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700">
                        {attempt.subject_code}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900">
                      {Number(attempt.score ?? 0)} / {Number(attempt.max_score ?? 0)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {attempt.correct_answers ?? 0} / {attempt.total_questions ?? 0}
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill value={attempt.grading_status ?? "needs_manual_grading"} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/dashboard/exam-results/${attempt.id}`}
                        className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 active:scale-95 transition"
                      >
                        Detail & Koreksi
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
