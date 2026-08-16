import Link from "next/link";
import { Calendar, Clock, LogIn, Sparkles } from "lucide-react";

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
type StudentAttemptStatus = { id?: string; status?: string | null };

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
        description="Daftar seluruh jadwal ujian untuk kelasmu."
      />

      {schedules.length === 0 ? (
        <EmptyState
          title="Belum ada jadwal ujian"
          description="Jadwal akan tampil di sini setelah guru membuat jadwal ujian untuk kelasmu."
        />
      ) : (
        <>
          {/* Mobile Card List (Visible on phones) */}
          <div className="grid gap-3.5 md:hidden">
            {schedules.map((schedule) => {
              const status = getStatus(schedule, now);
              const subject = schedule.exam_packages?.subjects;
              const duration = schedule.exam_packages?.duration_minutes;
              const participant = getParticipant(schedule);
              const activeAttempt = participant?.exam_attempts?.find(
                (a: StudentAttemptStatus) => a.status === "in_progress",
              );

              return (
                <div
                  key={schedule.id}
                  className="rounded-3xl border border-slate-200/90 bg-white p-4.5 shadow-2xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="rounded-lg bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-700">
                        {subject?.code ?? "-"}
                      </span>
                      <span className="text-xs font-medium text-slate-500">
                        {subject?.name ?? "Mata Pelajaran"}
                      </span>
                    </div>
                    <ExamStatusBadge status={status} />
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-950">
                      {schedule.title}
                    </h3>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Calendar className="size-3.5 text-blue-600 shrink-0" />
                      <span>Mulai: <strong className="text-slate-900">{formatJakartaDateTime(schedule.start_at)}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="size-3.5 text-slate-400 shrink-0" />
                      <span>Selesai: <strong className="text-slate-900">{formatJakartaDateTime(schedule.end_at)}</strong></span>
                    </div>
                    {duration && (
                      <p className="text-[11px] text-blue-700 font-semibold pt-0.5">
                        Durasi Pengerjaan: {duration} Menit
                      </p>
                    )}
                  </div>

                  {status === "in_progress" && activeAttempt?.id ? (
                    <Link
                      href={`/dashboard/exam-room/${activeAttempt.id}`}
                      className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-blue-600 text-xs font-bold text-white shadow-2xs transition active:scale-98"
                    >
                      <LogIn className="size-4" />
                      <span>Lanjutkan Ujian</span>
                    </Link>
                  ) : status === "not_started" ? (
                    <Link
                      href="/dashboard/student/active-exams"
                      className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50/60 text-xs font-bold text-blue-700 transition active:scale-98"
                    >
                      <Sparkles className="size-4" />
                      <span>Buka Halaman Ujian</span>
                    </Link>
                  ) : null}
                </div>
              );
            })}
          </div>

          {/* Desktop Table (Hidden on phones) */}
          <div className="hidden md:block">
            <DataTable
              columns={["Ujian", "Mata Pelajaran", "Waktu Mulai", "Batas Selesai", "Status"]}
              isEmpty={false}
            >
              {schedules.map((schedule) => (
                <tr key={schedule.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3.5 font-bold text-slate-950">{schedule.title}</td>
                  <td className="px-4 py-3.5">
                    <span className="font-semibold text-slate-900">
                      {schedule.exam_packages?.subjects?.code ?? "-"}
                    </span>
                    <span className="block text-xs text-slate-500">
                      {schedule.exam_packages?.subjects?.name ?? ""}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-slate-700">
                    {formatJakartaDateTime(schedule.start_at)}
                  </td>
                  <td className="px-4 py-3.5 text-slate-700">
                    {formatJakartaDateTime(schedule.end_at)}
                  </td>
                  <td className="px-4 py-3.5">
                    <ExamStatusBadge status={getStatus(schedule, now)} />
                  </td>
                </tr>
              ))}
            </DataTable>
          </div>
        </>
      )}
    </div>
  );
}

