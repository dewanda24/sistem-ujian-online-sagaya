import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { StatusPill } from "@/components/dashboard/status-pill";
import { DataTable } from "@/components/master-data/data-table";
import { Zap } from "lucide-react";
import Link from "next/link";
import {
  firstRelation,
  getTeacherGradingFilters,
  getTeacherResultRecap,
} from "@/features/results/queries";
import { requirePermission } from "@/lib/auth/require-permission";

type PageProps = {
  searchParams: Promise<{
    q?: string;
    grading_status?: string;
    schedule_id?: string;
    subject_id?: string;
  }>;
};

export default async function GradingPage({ searchParams }: PageProps) {
  await requirePermission("grading.view");
  const params = await searchParams;
  const [rawAttempts, filters] = await Promise.all([
    getTeacherResultRecap({
      grading_status: params.grading_status,
      schedule_id: params.schedule_id,
      subject_id: params.subject_id,
    }),
    getTeacherGradingFilters(),
  ]);
  const attempts = rawAttempts.filter((attempt) => {
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
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <DashboardPageHeader
          title="Koreksi Essay"
          description="Jawaban essay yang perlu diperiksa sebelum nilai siswa menjadi final."
        />
        {params.schedule_id && (
          <Link
            href={`/dashboard/teacher/grading/rapid?schedule_id=${params.schedule_id}`}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            <Zap className="size-4" />
            Mode Koreksi Cepat
          </Link>
        )}
      </div>
      <form className="grid gap-3 rounded-lg border bg-card p-4 md:grid-cols-[1fr_220px_220px_220px_auto]">
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
          <option value="auto_scored">Sudah dinilai otomatis</option>
          <option value="finalized">Nilai final</option>
        </select>
        <select
          name="subject_id"
          defaultValue={params.subject_id ?? ""}
          className="rounded-md border px-3 py-2 text-sm"
        >
          <option value="">Semua mapel</option>
          {filters.subjects.map((subject) => (
            <option key={subject.value} value={subject.value}>
              {subject.label}
            </option>
          ))}
        </select>
        <select
          name="schedule_id"
          defaultValue={params.schedule_id ?? ""}
          className="rounded-md border px-3 py-2 text-sm"
        >
          <option value="">Semua ujian</option>
          {filters.schedules.map((schedule) => (
            <option key={schedule.value} value={schedule.value}>
              {schedule.label}
            </option>
          ))}
        </select>
        <button className="rounded-md border px-4 py-2 text-sm hover:bg-muted">
          Filter
        </button>
      </form>
      {/* ... alert if no schedule_id is selected for Rapid Grading */}
      {!params.schedule_id && attempts.some(a => a.grading_status === "needs_manual_grading") && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 flex items-center justify-between">
          <span>Pilih <strong>satu ujian spesifik</strong> di dropdown filter untuk menggunakan <strong>Mode Koreksi Cepat</strong>.</span>
        </div>
      )}
      <DataTable
        columns={["Siswa", "Ujian", "Mapel", "Skor", "Benar", "Status", "Aksi"]}
        isEmpty={attempts.length === 0}
        empty={
          <EmptyState
            title="Tidak ada pekerjaan grading"
            description="Daftar koreksi akan tampil setelah siswa mengumpulkan jawaban essay."
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
