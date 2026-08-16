import { Clock, KeyRound, LogIn, Sparkles } from "lucide-react";

import { formatJakartaDateTime } from "@/lib/date-time";
import { ExamStatusBadge, type StudentExamStatus } from "./exam-status-badge";
import { SubmitButton } from "@/components/dashboard/submit-button";

export type ActiveExamCardExam = {
  id: string;
  title: string;
  subjectCode: string;
  subjectName: string;
  startAt: string;
  endAt: string;
  durationMinutes?: number | null;
  status: StudentExamStatus;
  attemptId?: string | null;
  tokenRequired?: boolean | null;
};

export function ActiveExamCard({
  exam,
  action,
}: {
  exam: ActiveExamCardExam;
  action: (formData: FormData) => void | Promise<void>;
}) {
  const canStart = exam.status === "not_started" || exam.status === "in_progress";
  const actionLabel = exam.attemptId ? "Lanjutkan Ujian Sekarang" : "Mulai Ujian Sekarang";

  return (
    <section className="relative overflow-hidden rounded-3xl border-2 border-blue-500/30 bg-gradient-to-br from-white via-blue-50/20 to-indigo-50/30 p-5 shadow-md sm:p-7">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <ExamStatusBadge status={exam.status} />
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-0.5 text-xs font-extrabold text-blue-700">
              <Sparkles className="size-3" />
              {exam.subjectCode}
            </span>
          </div>

          <div>
            <h2 className="text-xl font-extrabold leading-tight text-slate-950 sm:text-2xl">
              {exam.title}
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-600">
              Mata Pelajaran: <span className="text-slate-900">{exam.subjectName}</span>
            </p>
          </div>
        </div>

        {/* Schedule & Duration badge */}
        <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 text-xs font-medium text-slate-700 shadow-2xs backdrop-blur-xs lg:min-w-72">
          <div className="flex items-start gap-3">
            <Clock className="mt-0.5 size-5 shrink-0 text-blue-600" />
            <div className="space-y-1">
              <p className="font-bold text-slate-950 text-sm">Waktu Pelaksanaan</p>
              <p>Mulai: <span className="font-semibold">{formatJakartaDateTime(exam.startAt)}</span></p>
              <p>Selesai: <span className="font-semibold">{formatJakartaDateTime(exam.endAt)}</span></p>
              {exam.durationMinutes ? (
                <p className="text-blue-700 font-bold">Durasi: {exam.durationMinutes} Menit</p>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Start / Continue Form */}
      <form action={action} className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input type="hidden" name="schedule_id" value={exam.id} />
        {exam.tokenRequired && !exam.attemptId ? (
          <div className="relative flex-1 sm:max-w-xs">
            <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <input
              name="access_token"
              placeholder="MASUKKAN TOKEN UJIAN"
              className="h-12 w-full rounded-2xl border border-slate-300 bg-white pl-11 pr-4 text-sm uppercase font-extrabold tracking-wider outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              autoComplete="off"
              required
            />
          </div>
        ) : null}

        {exam.attemptId ? (
          <a
            href={`/dashboard/exam-room/${exam.attemptId}`}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-7 text-sm font-bold text-white shadow-md transition-all duration-150 hover:from-blue-700 hover:to-indigo-700 active:scale-98 sm:min-w-48"
          >
            <LogIn className="size-5" />
            <span>{actionLabel}</span>
          </a>
        ) : (
          <SubmitButton
            loadingText="Membuka Ruang Ujian..."
            disabled={!canStart}
            className="h-12 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-7 text-sm font-bold text-white shadow-md hover:from-blue-700 hover:to-indigo-700 active:scale-98 sm:min-w-48"
          >
            <LogIn className="size-5" />
            <span>{actionLabel}</span>
          </SubmitButton>
        )}
      </form>
    </section>
  );
}

