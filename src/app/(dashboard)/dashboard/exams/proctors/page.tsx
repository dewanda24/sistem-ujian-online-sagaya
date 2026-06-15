import { UserCheck } from "lucide-react";

import { ActionsMenu } from "@/components/dashboard/actions-menu";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { StatusPill } from "@/components/dashboard/status-pill";
import { SubmitButton } from "@/components/dashboard/submit-button";
import { ActionToast } from "@/components/master-data/action-toast";
import { DataTable } from "@/components/master-data/data-table";
import {
  assignTeacherProctorAction,
  toggleTeacherProctorAction,
} from "@/features/exams/proctor-assignment-actions";
import { getProctorAssignmentPageData } from "@/features/exams/proctor-assignments";
import { requirePermission } from "@/lib/auth/require-permission";

type PageProps = {
  searchParams: Promise<{
    schedule_id?: string;
    notice?: string;
    message?: string;
  }>;
};

export default async function ExamProctorsPage({ searchParams }: PageProps) {
  await requirePermission("exam_schedules.manage");
  const params = await searchParams;
  const { schedules, teachers, assignments } =
    await getProctorAssignmentPageData();

  return (
    <div className="space-y-5">
      <ActionToast status={params.notice} message={params.message} />
      <DashboardPageHeader
        title="Pengawas Ujian"
        description="Kelola pengawas internal maupun eksternal untuk pelaksanaan ujian."
      />

      <section className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm">
        <form
          action={assignTeacherProctorAction}
          className="grid gap-3 md:grid-cols-[1.2fr_1fr_1fr_auto]"
        >
          <select
            name="schedule_id"
            required
            defaultValue={params.schedule_id ?? ""}
            className="h-10 rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm"
          >
            <option value="">Pilih jadwal ujian</option>
            {schedules.map((schedule) => (
              <option key={schedule.value} value={schedule.value}>
                {schedule.label}
              </option>
            ))}
          </select>
          <select
            name="teacher_id"
            required
            className="h-10 rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm"
          >
            <option value="">Pilih guru</option>
            {teachers.map((teacher) => (
              <option key={teacher.value} value={teacher.value}>
                {teacher.label}
              </option>
            ))}
          </select>
          <input
            name="notes"
            placeholder="Catatan opsional"
            className="h-10 rounded-xl border border-[#E2E8F0] px-3 text-sm"
          />
          <SubmitButton
            disabled={schedules.length === 0 || teachers.length === 0}
            loadingText="Menugaskan..."
          >
            <UserCheck className="size-4" />
            Tugaskan
          </SubmitButton>
        </form>
      </section>

      <DataTable
        columns={["Jadwal", "Guru", "Status", "Ditugaskan", "Catatan", "Aksi"]}
        isEmpty={assignments.length === 0}
        searchPlaceholder="Cari jadwal atau guru"
        empty={
          <EmptyState
            title="Belum ada penugasan pengawas"
            description="Tugaskan guru ke jadwal ujian agar guru tersebut bisa melakukan pengawasan ujian."
          />
        }
      >
        {assignments.map((assignment) => (
          <tr key={assignment.id}>
            <td>
              <div className="font-medium text-[#0F172A]">
                {assignment.scheduleTitle}
              </div>
              <div className="mt-1 text-xs text-[#64748B]">
                {assignment.scheduleStatus}
              </div>
            </td>
            <td>
              <div className="font-medium text-[#0F172A]">
                {assignment.teacherName}
              </div>
              <div className="mt-1 text-xs text-[#64748B]">
                {assignment.teacherEmail || "-"}
              </div>
            </td>
            <td>
              <StatusPill value={assignment.isActive ? "aktif" : "nonaktif"} />
            </td>
            <td>{formatDate(assignment.assignedAt)}</td>
            <td className="max-w-xs truncate">{assignment.notes || "-"}</td>
            <td>
              <ActionsMenu label="Aksi">
                <form action={toggleTeacherProctorAction}>
                  <input type="hidden" name="id" value={assignment.id} />
                  <input
                    type="hidden"
                    name="is_active"
                    value={assignment.isActive ? "false" : "true"}
                  />
                  <SubmitButton
                    variant={assignment.isActive ? "danger" : "outline"}
                    className="w-full px-2 py-1.5 text-xs"
                    loadingText="Memproses..."
                  >
                    {assignment.isActive ? "Nonaktifkan" : "Aktifkan"}
                  </SubmitButton>
                </form>
              </ActionsMenu>
            </td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}
