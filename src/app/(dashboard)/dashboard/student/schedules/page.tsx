import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { DataTable } from "@/components/master-data/data-table";
import { getStudentExamSchedules } from "@/features/exam-room/queries";
import {
  ExamStatusBadge,
  type StudentExamStatus,
} from "@/features/student-dashboard/components/exam-status-badge";
import { requirePermission } from "@/lib/auth/require-permission";
import { formatJakartaDateTime } from "@/lib/date-time";

type StudentSchedule = Awaited<ReturnType<typeof getStudentExamSchedules>>[number];
type StudentAttemptStatus = { status?: string | null };

function getParticipant(schedule: StudentSchedule) {
  return schedule.exam_participants?.[0] ?? null;
}

function getStatus(schedule: StudentSchedule, now: Date): StudentExamStatus {
  const participant = getParticipant(schedule);
  const attempts = participant?.exam_attempts ?? [];
  const hasSubmitted =
    participant?.status === "submitted" ||
    attempts.some((attempt: StudentAttemptStatus) => attempt.status === "submitted");
  const hasInProgress =
    participant?.status === "in_progress" ||
    attempts.some((attempt: StudentAttemptStatus) => attempt.status === "in_progress");
  const endAt = schedule.end_at ? new Date(schedule.end_at) : null;

  if (hasSubmitted) {
    return "submitted";
  }

  if (hasInProgress) {
    return "in_progress";
  }

  if (endAt && endAt < now) {
    return "late";
  }

  return "not_started";
}

export default async function StudentSchedulesPage() {
  await requirePermission("active_exams.view");
  const schedules = await getStudentExamSchedules();
  const now = new Date();

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Jadwal Ujian"
        description="Jadwal ujian untuk kelasmu."
      />
      <DataTable
        columns={["Ujian", "Mapel", "Mulai", "Selesai", "Status"]}
        isEmpty={schedules.length === 0}
        empty={
          <EmptyState
            title="Belum ada jadwal"
            description="Jadwal akan tampil setelah guru membuat jadwal untuk kelas siswa."
          />
        }
      >
        {schedules.map((schedule) => (
          <tr key={schedule.id}>
            <td className="px-4 py-3 font-medium">{schedule.title}</td>
            <td className="px-4 py-3">
              {schedule.exam_packages?.subjects?.code ?? "-"}
            </td>
            <td className="px-4 py-3">
              {formatJakartaDateTime(schedule.start_at)}
            </td>
            <td className="px-4 py-3">
              {formatJakartaDateTime(schedule.end_at)}
            </td>
            <td className="px-4 py-3">
              <ExamStatusBadge status={getStatus(schedule, now)} />
            </td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}
