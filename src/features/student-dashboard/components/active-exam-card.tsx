import { Clock, LogIn } from "lucide-react";

import { formatJakartaDateTime } from "@/lib/date-time";

import { ExamStatusBadge, type StudentExamStatus } from "./exam-status-badge";

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
  const actionLabel = exam.attemptId ? "Lanjutkan Ujian" : "Mulai Ujian";

  return (
    <section className="rounded-lg border border-blue-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-3">
          <ExamStatusBadge status={exam.status} />
          <div>
            <h2 className="text-2xl font-bold leading-tight text-slate-950 sm:text-3xl">
              {exam.title}
            </h2>
            <p className="mt-2 text-base font-medium text-slate-700">
              {exam.subjectCode} - {exam.subjectName}
            </p>
          </div>
        </div>
        <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-700 lg:min-w-72">
          <div className="flex items-start gap-3">
            <Clock className="mt-0.5 size-5 shrink-0 text-blue-700" />
            <div className="space-y-1">
              <p className="font-semibold text-slate-950">Waktu ujian</p>
              <p>Mulai: {formatJakartaDateTime(exam.startAt)}</p>
              <p>Selesai: {formatJakartaDateTime(exam.endAt)}</p>
              {exam.durationMinutes ? <p>Durasi: {exam.durationMinutes} menit</p> : null}
            </div>
          </div>
        </div>
      </div>

      <form action={action} className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input type="hidden" name="schedule_id" value={exam.id} />
        {exam.tokenRequired && !exam.attemptId ? (
          <input
            name="access_token"
            placeholder="Token ujian"
            className="h-12 rounded-lg border border-slate-300 px-4 text-base uppercase outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 sm:w-44"
            autoComplete="off"
            required
          />
        ) : null}
        {exam.attemptId ? (
          <a
            href={`/dashboard/exam-room/${exam.attemptId}`}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-blue-700 px-6 text-base font-semibold text-white transition hover:bg-blue-800 sm:min-w-48"
          >
            <LogIn className="size-5" />
            {actionLabel}
          </a>
        ) : (
          <button
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-blue-700 px-6 text-base font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300 sm:min-w-48"
            disabled={!canStart}
          >
            <LogIn className="size-5" />
            {actionLabel}
          </button>
        )}
      </form>
    </section>
  );
}
