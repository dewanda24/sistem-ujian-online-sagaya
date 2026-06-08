import { CalendarDays } from "lucide-react";

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
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-slate-950">
            {exam.title}
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            {exam.subjectCode} - {exam.subjectName}
          </p>
        </div>
        <ExamStatusBadge status={exam.status} />
      </div>
      <div className="mt-3 flex gap-2 text-sm text-slate-600">
        <CalendarDays className="mt-0.5 size-4 shrink-0 text-blue-700" />
        <div>
          <p>{formatJakartaDateTime(exam.startAt)}</p>
          <p>sampai {formatJakartaDateTime(exam.endAt)}</p>
        </div>
      </div>
    </div>
  );
}
