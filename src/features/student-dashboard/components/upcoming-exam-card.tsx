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

/** Android Material 3 List Item style for upcoming exam */
export function UpcomingExamCard({ exam }: { exam: UpcomingExamCardExam }) {
  const date = formatJakartaDate(exam.startAt);
  const time = `${formatJakartaTime(exam.startAt)} – ${formatJakartaTime(exam.endAt)}`;

  return (
    <div className="md-list-item">
      {/* Leading color dot */}
      <span className="size-2.5 rounded-full bg-[#2563EB] shrink-0" />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-semibold text-[#1E293B] truncate leading-snug">
          {exam.subjectName || exam.title}
        </p>
        <p className="text-[13px] text-[#64748B] truncate mt-0.5">
          {date} • {time}
        </p>
      </div>

      {/* Trailing chip */}
      <div className="shrink-0">
        <ExamStatusBadge status={exam.status} />
      </div>
    </div>
  );
}
