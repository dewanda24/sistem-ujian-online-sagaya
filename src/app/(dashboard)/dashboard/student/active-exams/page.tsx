import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { StatusPill } from "@/components/dashboard/status-pill";
import { ActionToast } from "@/components/master-data/action-toast";
import { DataTable } from "@/components/master-data/data-table";
import { startExamAction } from "@/features/exam-room/actions";
import { getStudentExamSchedules } from "@/features/exam-room/queries";
import { requirePermission } from "@/lib/auth/require-permission";
import { formatJakartaDateTime } from "@/lib/date-time";

type PageProps = {
  searchParams: Promise<{
    notice?: string;
    message?: string;
  }>;
};

function getParticipant(schedule: {
  exam_participants?: Array<{
    id: string;
    status: string;
    exam_attempts?: Array<{ id: string; status: string }> | null;
  }> | null;
}) {
  return schedule.exam_participants?.[0] ?? null;
}

export default async function ActiveExamsPage({ searchParams }: PageProps) {
  await requirePermission("active_exams.view");
  const params = await searchParams;
  const schedules = await getStudentExamSchedules({ activeOnly: true });

  return (
    <div className="space-y-6">
      <ActionToast status={params.notice} message={params.message} />
      <DashboardPageHeader
        title="Active Exams"
        description="Daftar ujian yang sedang aktif untuk kelas siswa. Klik mulai untuk masuk ruang ujian."
      />

      <DataTable
        columns={["Ujian", "Mapel", "Waktu", "Durasi", "Status", "Aksi"]}
        isEmpty={schedules.length === 0}
        empty={
          <EmptyState
            title="Tidak ada ujian aktif"
            description="Ujian aktif akan muncul saat jadwal sudah masuk rentang waktu pengerjaan."
          />
        }
      >
        {schedules.map((schedule) => {
          const participant = getParticipant(schedule);
          const activeAttempt = participant?.exam_attempts?.find(
            (attempt) => attempt.status === "in_progress",
          );
          const submittedAttempt = participant?.exam_attempts?.find(
            (attempt) => attempt.status === "submitted",
          );

          return (
            <tr key={schedule.id}>
              <td className="px-4 py-3 font-medium">{schedule.title}</td>
              <td className="px-4 py-3">
                {schedule.exam_packages?.subjects?.code ?? "-"}
                <div className="text-xs text-muted-foreground">
                  {schedule.exam_packages?.subjects?.name ?? ""}
                </div>
              </td>
              <td className="px-4 py-3">
                <div>{formatJakartaDateTime(schedule.start_at)}</div>
                <div className="text-xs text-muted-foreground">
                  sampai {formatJakartaDateTime(schedule.end_at)}
                </div>
              </td>
              <td className="px-4 py-3">
                {schedule.exam_packages?.duration_minutes ?? "-"} menit
              </td>
              <td className="px-4 py-3">
                <StatusPill value={participant?.status ?? schedule.status} />
              </td>
              <td className="px-4 py-3">
                {submittedAttempt ? (
                  <span className="text-sm text-muted-foreground">
                    Sudah dikumpulkan
                  </span>
                ) : activeAttempt ? (
                  <a
                    href={`/dashboard/exam-room/${activeAttempt.id}`}
                    className="rounded-md border px-3 py-1.5 text-xs hover:bg-muted"
                  >
                    Lanjutkan
                  </a>
                ) : (
                  <form action={startExamAction} className="flex flex-wrap gap-2">
                    <input type="hidden" name="schedule_id" value={schedule.id} />
                    {schedule.token_required ? (
                      <input
                        name="access_token"
                        placeholder="Token"
                        className="w-24 rounded-md border px-2 py-1.5 text-xs uppercase"
                        autoComplete="off"
                        required
                      />
                    ) : null}
                    <button className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">
                      Mulai
                    </button>
                  </form>
                )}
              </td>
            </tr>
          );
        })}
      </DataTable>
    </div>
  );
}
