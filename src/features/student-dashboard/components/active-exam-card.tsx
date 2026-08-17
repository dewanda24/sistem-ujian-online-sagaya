import Link from "next/link";
import { ArrowRight, CheckCircle2, Hourglass, KeyRound, LogIn, XCircle } from "lucide-react";

import { formatJakartaDate, formatJakartaTime } from "@/lib/date-time";
import { ExamCountdownTimer } from "./exam-countdown-timer";
import { SubmitButton } from "@/components/dashboard/submit-button";

export type ActiveExamCardExam = {
  id: string;
  title: string;
  subjectCode: string;
  subjectName: string;
  startAt: string;
  endAt: string;
  durationMinutes?: number | null;
  status: "not_started" | "in_progress" | "submitted" | "late" | "cancelled" | "graded";
  attemptId?: string | null;
  tokenRequired?: boolean | null;
  schoolOrClassName?: string | null;
  score?: number | null;
  maxScore?: number | null;
  gradingStatus?: string | null;
  showResult?: boolean | null;
};

export function ActiveExamCard({
  exam,
  action,
}: {
  exam: ActiveExamCardExam;
  action?: (formData: FormData) => void | Promise<void>;
}) {
  const isOngoing = exam.status === "in_progress" || exam.status === "not_started";
  const isSubmitted = exam.status === "submitted" || exam.status === "late";
  const isCancelled = exam.status === "cancelled";
  const canShowScore =
    exam.showResult &&
    exam.score !== undefined &&
    exam.score !== null &&
    exam.gradingStatus !== "needs_manual_grading";

  const actionLabel = exam.attemptId ? "Lanjutkan Ujian" : "Mulai Ujian";

  // Format schedule text e.g. "16 Agustus 2026 • 08.00 - 10.00"
  const formattedSchedule = `${formatJakartaDate(exam.startAt)} • ${formatJakartaTime(exam.startAt)} - ${formatJakartaTime(exam.endAt)}`;

  // ----------------------------------------------------
  // STATE A: Sedang Berlangsung / Aktif (Vibrant Blue Card)
  // ----------------------------------------------------
  if (isOngoing) {
    return (
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1D4ED8] via-[#2563EB] to-[#1E40AF] p-5 sm:p-7 text-white shadow-xl">
        {/* Decorative ambient glows */}
        <div className="pointer-events-none absolute -right-10 -top-10 size-48 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-10 -left-10 size-48 rounded-full bg-indigo-900/40 blur-2xl" />

        <div className="relative z-10 space-y-5">
          {/* Header Row: Subject & Status Badge */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white truncate">
                  {exam.subjectName || exam.title}
                </h2>
                {exam.subjectCode && (
                  <span className="hidden sm:inline-flex rounded-lg bg-white/15 px-2 py-0.5 text-xs font-bold text-blue-100 backdrop-blur-xs">
                    {exam.subjectCode}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm font-medium text-blue-100">
                {exam.schoolOrClassName || exam.title}
              </p>
              <p className="text-xs text-blue-200/90 font-medium">
                {formattedSchedule}
              </p>
            </div>

            {/* Status Badge */}
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-extrabold text-emerald-200 border border-emerald-400/30 backdrop-blur-xs">
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Sedang Berlangsung</span>
            </span>
          </div>

          {/* Countdown Timer & Progress bar */}
          <div className="rounded-2xl bg-black/20 p-3.5 sm:p-4 backdrop-blur-md border border-white/10">
            <ExamCountdownTimer
              startAt={exam.startAt}
              endAt={exam.endAt}
              durationMinutes={exam.durationMinutes}
            />
          </div>

          {/* Action Area / Form */}
          {action ? (
            <form action={action} className="flex flex-col sm:flex-row gap-3 pt-1">
              <input type="hidden" name="schedule_id" value={exam.id} />
              {exam.tokenRequired && !exam.attemptId ? (
                <div className="relative flex-1 sm:max-w-xs">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-blue-200" />
                  <input
                    name="access_token"
                    placeholder="MASUKKAN TOKEN"
                    className="h-12 w-full rounded-2xl border border-white/30 bg-white/10 pl-10 pr-4 text-sm font-bold uppercase tracking-wider text-white placeholder:text-blue-200/70 outline-none backdrop-blur-xs transition focus:border-white focus:bg-white/20 focus:ring-2 focus:ring-white/30"
                    autoComplete="off"
                    required
                  />
                </div>
              ) : null}

              {exam.attemptId ? (
                <Link
                  href={`/dashboard/exam-room/${exam.attemptId}`}
                  className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-white px-6 text-sm font-black text-blue-700 shadow-md transition-all duration-150 hover:bg-blue-50 active:scale-98"
                >
                  <span>{actionLabel}</span>
                  <ArrowRight className="size-4 stroke-[3]" />
                </Link>
              ) : (
                <SubmitButton
                  loadingText="Membuka Ruang Ujian..."
                  className="h-12 flex-1 rounded-2xl bg-white px-6 text-sm font-black text-blue-700 shadow-md transition-all duration-150 hover:bg-blue-50 active:scale-98"
                >
                  <LogIn className="size-4" />
                  <span>{actionLabel}</span>
                  <ArrowRight className="size-4 stroke-[3]" />
                </SubmitButton>
              )}
            </form>
          ) : (
            <div className="pt-1">
              <Link
                href={exam.attemptId ? `/dashboard/exam-room/${exam.attemptId}` : "/dashboard/student/active-exams"}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-white px-6 text-sm font-black text-blue-700 shadow-md transition-all duration-150 hover:bg-blue-50 active:scale-98"
              >
                <span>{actionLabel}</span>
                <ArrowRight className="size-4 stroke-[3]" />
              </Link>
            </div>
          )}
        </div>
      </section>
    );
  }

  // ----------------------------------------------------
  // STATE C: Ujian Selesai - Menunggu Koreksi (Amber Card)
  // ----------------------------------------------------
  if (isSubmitted && !canShowScore) {
    return (
      <section className="relative overflow-hidden rounded-3xl border border-amber-200/90 bg-gradient-to-br from-amber-50 via-amber-100/30 to-amber-50/60 p-5 sm:p-7 shadow-xs">
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <p className="text-xs font-extrabold uppercase tracking-wider text-amber-700">
                Ujian Terakhir
              </p>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 truncate">
                {exam.subjectName || exam.title}
              </h2>
              <p className="text-xs sm:text-sm font-medium text-slate-600">
                Telah Dikumpulkan: {formattedSchedule}
              </p>
            </div>

            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
              <Hourglass className="size-6 animate-pulse" />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-amber-100/80 px-3 py-1.5 text-xs font-bold text-amber-800 border border-amber-300/60">
              <span className="size-2 rounded-full bg-amber-500" />
              <span>Menunggu Koreksi</span>
            </span>

            <Link
              href="/dashboard/student/history"
              className="inline-flex h-10 items-center justify-center rounded-xl bg-white px-4 text-xs font-bold text-slate-800 border border-slate-200 shadow-2xs transition hover:bg-slate-50"
            >
              Lihat Detail
            </Link>
          </div>
        </div>
      </section>
    );
  }

  // ----------------------------------------------------
  // STATE D & E: Nilai Tersedia / Selesai (Emerald Card)
  // ----------------------------------------------------
  if (isSubmitted && canShowScore) {
    return (
      <section className="relative overflow-hidden rounded-3xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50 via-emerald-100/20 to-teal-50/40 p-5 sm:p-7 shadow-xs">
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <p className="text-xs font-extrabold uppercase tracking-wider text-emerald-700">
                Ujian Terakhir
              </p>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 truncate">
                {exam.subjectName || exam.title}
              </h2>
              <p className="text-xs sm:text-sm font-medium text-slate-600">
                {formattedSchedule}
              </p>
            </div>

            {/* Big Score Tag */}
            <div className="text-right">
              <div className="flex items-baseline justify-end gap-1">
                <span className="text-3xl sm:text-4xl font-black text-emerald-600">
                  {Number(exam.score ?? 0)}
                </span>
                <span className="text-xs sm:text-sm font-bold text-slate-400">
                  /{Number(exam.maxScore ?? 100)}
                </span>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                <CheckCircle2 className="size-3" />
                <span>Selesai Dikoreksi</span>
              </span>
            </div>
          </div>

          <div className="pt-2">
            <Link
              href="/dashboard/student/history"
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 active:scale-98"
            >
              <span>Lihat Hasil</span>
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>
    );
  }

  // ----------------------------------------------------
  // STATE F: Dibatalkan (Rose Card)
  // ----------------------------------------------------
  if (isCancelled) {
    return (
      <section className="relative overflow-hidden rounded-3xl border border-rose-200 bg-rose-50/80 p-5 sm:p-7 shadow-xs">
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 truncate">
                {exam.subjectName || exam.title}
              </h2>
              <p className="text-xs sm:text-sm font-medium text-slate-600">
                {formattedSchedule}
              </p>
            </div>
            <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
              <XCircle className="size-6" />
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-2">
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-rose-100 px-3 py-1 text-xs font-bold text-rose-700">
              <span>Dibatalkan oleh sekolah</span>
            </span>
            <Link
              href="/dashboard/student/schedules"
              className="inline-flex h-10 items-center justify-center rounded-xl bg-white px-4 text-xs font-bold text-slate-800 border border-slate-200 shadow-2xs transition hover:bg-slate-50"
            >
              Lihat Detail
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return null;
}
