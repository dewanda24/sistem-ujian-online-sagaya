import { CalendarDays } from "lucide-react";

import { formatJakartaDate, formatJakartaTime } from "@/lib/date-time";
import { ExamStatusBadge, type StudentExamStatus } from "./exam-status-badge";

export type UpcomingExamCardExam = {
  id: string;
  title: string;
  subjectCode: string;
  subjectName: string;
  startAt: string;
  endAt: string;
  status: StudentExamStatus;
};

export function UpcomingExamCard({ exam }: { exam: UpcomingExamCardExam }) {
  const formattedSchedule = `${formatJakartaDate(exam.startAt)} • ${formatJakartaTime(exam.startAt)} - ${formatJakartaTime(exam.endAt)}`;

  return (
    <div className="group flex items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-2xs transition-all duration-150 hover:border-blue-200 hover:shadow-xs">
      <div className="flex items-center gap-3 min-w-0">
        {/* Rounded Icon Container */}
        <div className="flex size-10 sm:size-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100 group-hover:scale-105 transition-transform">
          <CalendarDays className="size-5" />
        </div>

        {/* Info */}
        <div className="min-w-0">
          <h4 className="text-sm font-bold text-slate-900 truncate">
            {exam.subjectName || exam.title}
          </h4>
          <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
            {formattedSchedule}
          </p>
        </div>
      </div>

      {/* Status Badge */}
      <div className="shrink-0 hidden sm:block">
        <ExamStatusBadge status={exam.status} />
      </div>
    </div>
  );
}
