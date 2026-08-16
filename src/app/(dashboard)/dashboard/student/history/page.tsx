import Link from "next/link";
import { ArrowUpRight, CheckCircle2, Clock } from "lucide-react";

import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { ActionToast } from "@/components/master-data/action-toast";
import { DataTable } from "@/components/master-data/data-table";
import {
  firstRelation,
  getStudentSubmittedAttempts,
} from "@/features/results/queries";
import { requirePermission } from "@/lib/auth/require-permission";
import { formatJakartaDateTime } from "@/lib/date-time";

type PageProps = {
  searchParams: Promise<{
    notice?: string;
    message?: string;
  }>;
};

function scoreText(score?: number | null, maxScore?: number | null) {
  return `${Number(score ?? 0)} / ${Number(maxScore ?? 0)}`;
}

export default async function ExamHistoryPage({ searchParams }: PageProps) {
  await requirePermission("exam_results.view");
  const [params, attempts] = await Promise.all([
    searchParams,
    getStudentSubmittedAttempts(),
  ]);

  return (
    <div className="space-y-6">
      <ActionToast status={params.notice} message={params.message} />
      <DashboardPageHeader
        title="Riwayat Ujian"
        description="Daftar ujian yang sudah kamu kumpulkan beserta hasil nilai yang tersedia."
      />

      {attempts.length === 0 ? (
        <EmptyState
          title="Riwayat masih kosong"
          description="Riwayat ujian akan muncul di sini setelah kamu menyelesaikan dan mengumpulkan ujian."
        />
      ) : (
        <>
          {/* Mobile Card List (Visible on phones) */}
          <div className="grid gap-3.5 md:hidden">
            {attempts.map((attempt) => {
              const schedule = firstRelation(attempt.exam_schedules);
              const examPackage = firstRelation(schedule?.exam_packages);
              const subject = firstRelation(examPackage?.subjects);
              const canShowScore =
                Boolean(examPackage?.show_result) &&
                attempt.grading_status !== "needs_manual_grading";

              const gradingLabel =
                attempt.grading_status === "needs_manual_grading"
                  ? "Menunggu Koreksi Guru"
                  : attempt.grading_status === "finalized"
                    ? "Nilai Final"
                    : "Selesai";

              return (
                <div
                  key={attempt.id}
                  className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-3.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="rounded-lg bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-700">
                        {subject?.code ?? "-"}
                      </span>
                      <span className="text-xs font-medium text-slate-500">
                        {subject?.name ?? "Mata Pelajaran"}
                      </span>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                        attempt.grading_status === "needs_manual_grading"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      <CheckCircle2 className="size-3" />
                      {gradingLabel}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-950">
                      {schedule?.title ?? "Ujian"}
                    </h3>
                  </div>

                  <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-3.5">
                    <div>
                      <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Skor Perolehan
                      </span>
                      <span className="text-2xl font-black text-slate-950">
                        {canShowScore
                          ? scoreText(attempt.score, attempt.max_score)
                          : "Menunggu Hasil"}
                      </span>
                    </div>

                    <div className="text-right text-[11px] text-slate-500 space-y-0.5">
                      <div className="flex items-center gap-1 justify-end">
                        <Clock className="size-3 text-slate-400" />
                        <span>Dikumpulkan:</span>
                      </div>
                      <p className="font-semibold text-slate-700">
                        {attempt.submitted_at ? formatJakartaDateTime(attempt.submitted_at) : "-"}
                      </p>
                    </div>
                  </div>

                  <Link
                    href={`/dashboard/exam-results/${attempt.id}`}
                    className="inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 shadow-2xs transition hover:bg-slate-50 active:scale-98"
                  >
                    <span>Lihat Detail & Jawaban</span>
                    <ArrowUpRight className="size-4" />
                  </Link>
                </div>
              );
            })}
          </div>

          {/* Desktop Table (Hidden on phones) */}
          <div className="hidden md:block">
            <DataTable
              columns={["Ujian", "Mata Pelajaran", "Waktu Dikumpulkan", "Skor", "Status Koreksi", "Aksi"]}
              isEmpty={false}
            >
              {attempts.map((attempt) => {
                const schedule = firstRelation(attempt.exam_schedules);
                const examPackage = firstRelation(schedule?.exam_packages);
                const subject = firstRelation(examPackage?.subjects);
                const canShowScore =
                  Boolean(examPackage?.show_result) &&
                  attempt.grading_status !== "needs_manual_grading";

                return (
                  <tr key={attempt.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5 font-bold text-slate-950">
                      {schedule?.title ?? "-"}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-semibold text-slate-900">
                        {subject?.code ?? "-"}
                      </span>
                      <div className="text-xs text-slate-500">
                        {subject?.name ?? ""}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-700">
                      {attempt.submitted_at
                        ? formatJakartaDateTime(attempt.submitted_at)
                        : "-"}
                    </td>
                    <td className="px-4 py-3.5 font-extrabold text-slate-950">
                      {canShowScore
                        ? scoreText(attempt.score, attempt.max_score)
                        : <span className="font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md text-xs">Menunggu Hasil</span>}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          attempt.grading_status === "needs_manual_grading"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {attempt.grading_status === "needs_manual_grading"
                          ? "Menunggu Koreksi"
                          : attempt.grading_status === "finalized"
                            ? "Nilai Final"
                            : attempt.grading_status ?? "-"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <Link
                        href={`/dashboard/exam-results/${attempt.id}`}
                        className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 shadow-2xs hover:bg-slate-50 transition active:scale-95"
                      >
                        <span>Detail</span>
                        <ArrowUpRight className="size-3.5" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </DataTable>
          </div>
        </>
      )}
    </div>
  );
}

