import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { StatusPill } from "@/components/dashboard/status-pill";
import { DataTable } from "@/components/master-data/data-table";
import {
  firstRelation,
  getTeacherResultRecap,
} from "@/features/results/queries";
import { requirePermission } from "@/lib/auth/require-permission";

type PageProps = {
  searchParams: Promise<{
    q?: string;
    grading_status?: string;
  }>;
};

export default async function GradingPage({ searchParams }: PageProps) {
  await requirePermission("grading.view");
  const params = await searchParams;
  const attempts = (await getTeacherResultRecap({
    grading_status: params.grading_status,
  })).filter((attempt) => {
    const keyword = params.q?.toLowerCase().trim();

    if (!keyword) {
      return true;
    }

    const student = firstRelation(attempt.users);
    const profile = firstRelation(student?.user_profiles);
    const schedule = firstRelation(attempt.exam_schedules);
    const examPackage = firstRelation(schedule?.exam_packages);
    const subject = firstRelation(examPackage?.subjects);

    return [
      profile?.full_name,
      profile?.nis,
      student?.email,
      schedule?.title,
      subject?.code,
      subject?.name,
    ]
      .join(" ")
      .toLowerCase()
      .includes(keyword);
  });

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Grading"
        description="Rekap hasil ujian yang sudah dikumpulkan. Essay ditandai perlu koreksi manual."
      />
      <form className="grid gap-3 rounded-lg border bg-card p-4 md:grid-cols-[1fr_220px_auto]">
        <input
          name="q"
          defaultValue={params.q ?? ""}
          placeholder="Cari siswa, ujian, mapel"
          className="rounded-md border px-3 py-2 text-sm"
        />
        <select
          name="grading_status"
          defaultValue={params.grading_status ?? ""}
          className="rounded-md border px-3 py-2 text-sm"
        >
          <option value="">Semua status</option>
          <option value="needs_manual_grading">Perlu koreksi essay</option>
          <option value="auto_scored">Auto scored</option>
          <option value="finalized">Finalized</option>
        </select>
        <button className="rounded-md border px-4 py-2 text-sm hover:bg-muted">
          Filter
        </button>
      </form>
      <DataTable
        columns={["Siswa", "Ujian", "Mapel", "Skor", "Benar", "Status", "Aksi"]}
        isEmpty={attempts.length === 0}
        empty={
          <EmptyState
            title="Tidak ada pekerjaan grading"
            description="Daftar penilaian akan tampil setelah ujian selesai dikerjakan peserta."
          />
        }
      >
        {attempts.map((attempt) => {
          const student = firstRelation(attempt.users);
          const profile = firstRelation(student?.user_profiles);
          const schedule = firstRelation(attempt.exam_schedules);
          const examPackage = firstRelation(schedule?.exam_packages);
          const subject = firstRelation(examPackage?.subjects);

          return (
            <tr key={attempt.id}>
              <td className="px-4 py-3">
                <div className="font-medium">
                  {profile?.full_name ?? student?.username ?? "-"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {profile?.nis ?? student?.email ?? ""}
                </div>
              </td>
              <td className="px-4 py-3">{schedule?.title ?? "-"}</td>
              <td className="px-4 py-3">{subject?.code ?? "-"}</td>
              <td className="px-4 py-3">
                {Number(attempt.score ?? 0)} / {Number(attempt.max_score ?? 0)}
              </td>
              <td className="px-4 py-3">
                {attempt.correct_answers ?? 0} / {attempt.total_questions ?? 0}
              </td>
              <td className="px-4 py-3">
                <StatusPill value={attempt.grading_status} />
              </td>
              <td className="px-4 py-3">
                <a
                  href={`/dashboard/exam-results/${attempt.id}`}
                  className="rounded-md border px-3 py-1.5 text-xs hover:bg-muted"
                >
                  Detail
                </a>
              </td>
            </tr>
          );
        })}
      </DataTable>
    </div>
  );
}
