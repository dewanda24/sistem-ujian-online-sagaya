import Link from "next/link";
import { ArrowRight, BookCheck, Clock } from "lucide-react";

import { formatJakartaDate } from "@/lib/date-time";

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }
  return value ?? null;
}

export type StudentResultAttemptItem = {
  id: string;
  score?: number | null;
  max_score?: number | null;
  submitted_at?: string | null;
  grading_status?: string | null;
  exam_schedules?: any;
};

interface StudentLatestResultsListProps {
  attempts: StudentResultAttemptItem[];
  maxDisplay?: number;
}

export function StudentLatestResultsList({
  attempts,
  maxDisplay = 3,
}: StudentLatestResultsListProps) {
  // Deduplicate attempts by schedule ID so we only show the latest attempt per schedule
  const uniqueAttempts = attempts.filter((attempt, index, self) => {
    const scheduleId = firstRelation(attempt.exam_schedules)?.id;
    if (!scheduleId) return true;
    return index === self.findIndex((a) => firstRelation(a.exam_schedules)?.id === scheduleId);
  });

  const displayedAttempts = uniqueAttempts.slice(0, maxDisplay);

  return (
    <div className="space-y-3">

      {displayedAttempts.length > 0 ? (
        <div className="space-y-2.5">
          {displayedAttempts.map((attempt) => {
            const schedule = firstRelation(attempt.exam_schedules);
            const examPackage = firstRelation(schedule?.exam_packages);
            const subject = firstRelation(examPackage?.subjects);

            const canShowScore =
              Boolean(examPackage?.show_result) &&
              attempt.grading_status !== "needs_manual_grading" &&
              attempt.score !== null &&
              attempt.score !== undefined;

            const isWaitingGrading =
              attempt.grading_status === "needs_manual_grading" || !examPackage?.show_result;

            const formattedDate = attempt.submitted_at
              ? formatJakartaDate(attempt.submitted_at)
              : "-";

            return (
              <div
                key={attempt.id}
                className="group flex items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-2xs transition-all duration-150 hover:border-blue-200 hover:shadow-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Subject Icon */}
                  <div className="flex size-10 sm:size-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 group-hover:scale-105 transition-transform">
                    <BookCheck className="size-5" />
                  </div>

                  {/* Subject and Date */}
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-slate-900 truncate">
                      {subject?.name || schedule?.title || "Ujian"}
                    </h4>
                    <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                      {formattedDate}
                    </p>
                  </div>
                </div>

                {/* Score & Status Badge */}
                <div className="text-right shrink-0">
                  {canShowScore ? (
                    <div>
                      <div className="flex items-baseline justify-end gap-0.5">
                        <span className="text-base sm:text-lg font-black text-emerald-600">
                          {Number(attempt.score ?? 0)}
                        </span>
                        <span className="text-[11px] font-bold text-slate-400">
                          /{Number(attempt.max_score ?? 100)}
                        </span>
                      </div>
                      <span className="inline-block text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60 mt-0.5">
                        Selesai Dikoreksi
                      </span>
                    </div>
                  ) : (
                    <div>
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200/60">
                        <Clock className="size-3" />
                        <span>Menunggu Koreksi</span>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl bg-white border border-slate-200/80 p-6 text-center text-xs font-medium text-slate-500">
          Belum ada riwayat hasil ujian.
        </div>
      )}
    </div>
  );
}
