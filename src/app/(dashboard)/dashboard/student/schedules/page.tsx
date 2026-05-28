import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { DataTable } from "@/components/master-data/data-table";
import { getStudentExamSchedules } from "@/features/exam-room/queries";
import { requirePermission } from "@/lib/auth/require-permission";

export default async function StudentSchedulesPage() {
  await requirePermission("active_exams.view");
  const schedules = await getStudentExamSchedules();

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Schedules"
        description="Jadwal ujian peserta berdasarkan kelas aktif siswa."
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
              {new Intl.DateTimeFormat("id-ID", {
                dateStyle: "medium",
                timeStyle: "short",
              }).format(new Date(schedule.start_at))}
            </td>
            <td className="px-4 py-3">
              {new Intl.DateTimeFormat("id-ID", {
                dateStyle: "medium",
                timeStyle: "short",
              }).format(new Date(schedule.end_at))}
            </td>
            <td className="px-4 py-3">{schedule.status}</td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}
