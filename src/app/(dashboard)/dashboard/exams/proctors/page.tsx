import { Calendar, Trash2, UserCheck, Users } from "lucide-react";

import { ActionsMenu } from "@/components/dashboard/actions-menu";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { StatusPill } from "@/components/dashboard/status-pill";
import { SubmitButton } from "@/components/dashboard/submit-button";
import { ActionToast } from "@/components/master-data/action-toast";
import { DataTable } from "@/components/master-data/data-table";
import {
  assignTeacherProctorAction,
  deleteTeacherProctorAction,
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
    <div className="space-y-6">
      <ActionToast status={params.notice} message={params.message} />
      <DashboardPageHeader
        title="Pengawas Ujian"
        description="Kelola penugasan guru pengawas untuk setiap jadwal pelaksanaan ujian."
      />

      {/* QUICK ASSIGNMENT CARD */}
      <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-3">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <Users className="size-4" />
          </span>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Tugaskan Guru Pengawas
          </h2>
        </div>

        <form
          action={assignTeacherProctorAction}
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.5fr_1.2fr_1fr_auto]"
        >
          <select
            name="schedule_id"
            required
            defaultValue={params.schedule_id ?? ""}
            className="h-10 rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none font-medium"
          >
            <option value="">-- Pilih Jadwal Ujian --</option>
            {schedules.map((schedule) => (
              <option key={schedule.value} value={schedule.value}>
                {schedule.label}
              </option>
            ))}
          </select>
          <select
            name="teacher_id"
            required
            className="h-10 rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none font-medium"
          >
            <option value="">-- Pilih Guru Pengawas --</option>
            {teachers.map((teacher) => (
              <option key={teacher.value} value={teacher.value}>
                {teacher.label}
              </option>
            ))}
          </select>
          <input
            name="notes"
            placeholder="Catatan / Ruang (Opsional)"
            className="h-10 rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none font-medium"
          />
          <SubmitButton
            disabled={schedules.length === 0 || teachers.length === 0}
            loadingText="Menugaskan..."
            className="h-10 px-4 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs"
          >
            <UserCheck className="size-4" />
            Tugaskan
          </SubmitButton>
        </form>
      </section>

      {/* ASSIGNMENT DATA TABLE */}
      <DataTable
        columns={["Jadwal Ujian", "Guru Pengawas", "Status", "Ditugaskan", "Catatan / Ruang", "Aksi"]}
        isEmpty={assignments.length === 0}
        searchPlaceholder="Cari jadwal ujian atau nama guru..."
        empty={
          <EmptyState
            title="Belum ada penugasan pengawas"
            description="Tugaskan guru ke jadwal ujian di atas agar guru tersebut memiliki akses pengawasan ujian."
          />
        }
      >
        {assignments.map((assignment) => (
          <tr key={assignment.id} className="transition-colors hover:bg-slate-50/60">
            <td className="min-w-0">
              <div className="font-bold text-slate-900 text-xs line-clamp-1">
                {assignment.scheduleTitle}
              </div>
              <div className="mt-0.5 text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                <Calendar className="size-3 text-slate-400" />
                <span>{assignment.scheduleStatus}</span>
              </div>
            </td>
            <td>
              <div className="font-bold text-slate-900 text-xs">
                {assignment.teacherName}
              </div>
              <div className="mt-0.5 text-[11px] text-slate-500">
                {assignment.teacherEmail || "-"}
              </div>
            </td>
            <td>
              <StatusPill value={assignment.isActive ? "aktif" : "nonaktif"} />
            </td>
            <td className="text-xs text-slate-600 font-medium">
              {formatDate(assignment.assignedAt)}
            </td>
            <td className="max-w-xs truncate text-xs text-slate-600">
              {assignment.notes ? (
                <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                  {assignment.notes}
                </span>
              ) : (
                "-"
              )}
            </td>
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
                    variant={assignment.isActive ? "outline" : "outline"}
                    className="w-full justify-start px-3 py-1.5 text-xs text-slate-700"
                    loadingText="Memproses..."
                  >
                    {assignment.isActive ? "Nonaktifkan Pengawas" : "Aktifkan Pengawas"}
                  </SubmitButton>
                </form>

                <form action={deleteTeacherProctorAction}>
                  <input type="hidden" name="id" value={assignment.id} />
                  <SubmitButton
                    variant="danger"
                    className="w-full justify-start px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50"
                    loadingText="Menghapus..."
                  >
                    <Trash2 className="size-3.5 mr-1.5 text-rose-600" />
                    Hapus Penugasan
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
