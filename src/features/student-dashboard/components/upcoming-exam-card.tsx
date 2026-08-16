import { Clock } from "lucide-react";

import { ExamStatusBadge, type StudentExamStatus } from "./exam-status-badge";
import { formatJakartaDateTime } from "@/lib/date-time";

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
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs transition-all hover:border-blue-200 hover:shadow-xs">
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700">
              {exam.subjectCode}
            </span>
            <span className="truncate text-xs font-semibold text-slate-500">
              {exam.subjectName}
            </span>
          </div>
          <h3 className="mt-1 text-sm font-bold text-slate-950 sm:text-base">
            {exam.title}
          </h3>
        </div>
        <ExamStatusBadge status={exam.status} />
      </div>

      <div className="mt-3 flex items-start gap-2 rounded-xl bg-slate-50 p-2.5 text-xs text-slate-600">
        <Clock className="size-4 shrink-0 text-blue-600 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-semibold text-slate-900">{formatJakartaDateTime(exam.startAt)}</p>
          <p className="text-[11px] text-slate-500">s/d {formatJakartaDateTime(exam.endAt)}</p>
        </div>
      </div>
    </div>
  );
}

