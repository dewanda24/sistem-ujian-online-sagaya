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
  const formattedSchedule = `${formatJakartaDate(exam.startAt)} • ${formatJakartaTime(exam.startAt)} – ${formatJakartaTime(exam.endAt)}`;

  /* ── STATE A: Sedang Berlangsung / Aktif ── */
  if (isOngoing) {
    return (
      <section className="relative overflow-hidden rounded-2xl bg-[#2563EB] p-5 text-white shadow-lg">
        {/* Subtle radial highlight — no heavy blur */}
        <div className="pointer-events-none absolute right-0 top-0 size-40 rounded-full bg-white/8" />

        <div className="relative z-10 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-0.5">
              <p className="text-[12px] font-semibold text-blue-200 uppercase tracking-wider">
                Ujian Aktif
              </p>
              <h2 className="text-[18px] font-bold text-white leading-tight truncate">
                {exam.subjectName || exam.title}
              </h2>
              {exam.schoolOrClassName && (
                <p className="text-[13px] text-blue-200">{exam.schoolOrClassName}</p>
              )}
              <p className="text-[12px] text-blue-300">{formattedSchedule}</p>
            </div>

            {/* Live indicator */}
            <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 px-2.5 py-1 text-[11px] font-semibold text-emerald-200">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              LIVE
            </span>
          </div>

          {/* Countdown */}
          <div className="rounded-xl bg-black/20 px-4 py-3 border border-white/10">
            <ExamCountdownTimer
              startAt={exam.startAt}
              endAt={exam.endAt}
              durationMinutes={exam.durationMinutes}
            />
          </div>

          {/* Action */}
          {action ? (
            <form action={action} className="space-y-3">
              <input type="hidden" name="schedule_id" value={exam.id} />
              {exam.tokenRequired && !exam.attemptId ? (
                <div className="relative">
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 size-4.5 text-blue-200 pointer-events-none" />
                  <input
                    name="access_token"
                    placeholder="TOKEN RUANGAN (MISAL: ABCXYZ)"
                    className="h-12 w-full rounded-2xl border border-white/35 bg-white/20 pl-11 pr-4 font-mono text-base font-black tracking-widest text-white uppercase placeholder:text-blue-200/60 placeholder:font-sans placeholder:tracking-normal placeholder:text-xs placeholder:font-semibold outline-none focus:border-white focus:bg-white/25 focus:ring-2 focus:ring-white/30 transition shadow-inner"
                    autoComplete="off"
                    autoCapitalize="characters"
                    spellCheck={false}
                    required
                  />
                </div>
              ) : null}

              {exam.attemptId ? (
                <Link
                  href={`/dashboard/exam-room/${exam.attemptId}/briefing`}
                  className="flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-white text-[15px] font-semibold text-[#2563EB] shadow-sm transition active:scale-[0.97]"
                >
                  <span>{actionLabel}</span>
                  <ArrowRight className="size-4 stroke-[2.5]" />
                </Link>
              ) : (
                <SubmitButton
                  loadingText="Menyiapkan Ujian..."
                  className="flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-white text-[15px] font-semibold text-[#2563EB] shadow-sm transition active:scale-[0.97]"
                >
                  <LogIn className="size-4" />
                  <span>{actionLabel}</span>
                  <ArrowRight className="size-4 stroke-[2.5]" />
                </SubmitButton>
              )}
            </form>
          ) : (
            <Link
              href={exam.attemptId ? `/dashboard/exam-room/${exam.attemptId}/briefing` : "/dashboard/student/active-exams"}
              className="flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-white text-[15px] font-semibold text-[#2563EB] shadow-sm transition active:scale-[0.97]"
            >
              <span>{actionLabel}</span>
              <ArrowRight className="size-4 stroke-[2.5]" />
            </Link>
          )}
        </div>
      </section>
    );
  }

  /* ── STATE B: Menunggu Koreksi ── */
  if (isSubmitted && !canShowScore) {
    return (
      <section className="rounded-2xl border border-amber-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0 space-y-0.5">
            <p className="text-[12px] font-semibold text-amber-600 uppercase tracking-wider">
              Ujian Terakhir
            </p>
            <h2 className="text-[17px] font-bold text-[#1E293B] leading-tight truncate">
              {exam.subjectName || exam.title}
            </h2>
            <p className="text-[13px] text-[#64748B]">{formattedSchedule}</p>
          </div>
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <Hourglass className="size-5" />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 h-8 text-[13px] font-medium text-amber-700">
            <span className="size-1.5 rounded-full bg-amber-500" />
            Menunggu Koreksi
          </span>
          <Link
            href="/dashboard/student/history"
            className="flex h-9 items-center rounded-full border border-[#E2E8F0] bg-white px-4 text-[13px] font-semibold text-[#1E293B]"
          >
            Lihat Detail
          </Link>
        </div>
      </section>
    );
  }

  /* ── STATE C: Nilai Tersedia ── */
  if (isSubmitted && canShowScore) {
    return (
      <section className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0 space-y-0.5">
            <p className="text-[12px] font-semibold text-emerald-600 uppercase tracking-wider">
              Ujian Terakhir
            </p>
            <h2 className="text-[17px] font-bold text-[#1E293B] leading-tight truncate">
              {exam.subjectName || exam.title}
            </h2>
            <p className="text-[13px] text-[#64748B]">{formattedSchedule}</p>
          </div>

          {/* Score */}
          <div className="text-right shrink-0">
            <div className="flex items-baseline gap-0.5 justify-end">
              <span className="text-[32px] font-black text-emerald-600 leading-none">
                {Number(exam.score ?? 0)}
              </span>
              <span className="text-[13px] font-bold text-[#94A3B8]">
                /{Number(exam.maxScore ?? 100)}
              </span>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 mt-0.5">
              <CheckCircle2 className="size-3" />
              <span>Selesai</span>
            </span>
          </div>
        </div>

        <Link
          href="/dashboard/student/history"
          className="flex h-[48px] w-full items-center justify-center gap-2 rounded-full bg-emerald-600 text-[14px] font-semibold text-white transition active:scale-[0.97]"
        >
          <span>Lihat Hasil</span>
          <ArrowRight className="size-4" />
        </Link>
      </section>
    );
  }

  /* ── STATE D: Dibatalkan ── */
  if (isCancelled) {
    return (
      <section className="rounded-2xl border border-red-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0 space-y-0.5">
            <h2 className="text-[17px] font-bold text-[#1E293B] leading-tight truncate">
              {exam.subjectName || exam.title}
            </h2>
            <p className="text-[13px] text-[#64748B]">{formattedSchedule}</p>
          </div>
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-500">
            <XCircle className="size-5" />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center rounded-lg border border-red-200 bg-red-50 px-3 h-8 text-[13px] font-medium text-red-600">
            Dibatalkan
          </span>
          <Link
            href="/dashboard/student/schedules"
            className="flex h-9 items-center rounded-full border border-[#E2E8F0] bg-white px-4 text-[13px] font-semibold text-[#1E293B]"
          >
            Lihat Jadwal
          </Link>
        </div>
      </section>
    );
  }

  return null;
}
