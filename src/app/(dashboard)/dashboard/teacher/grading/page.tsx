import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { ActionToast } from "@/components/master-data/action-toast";
import { Zap } from "lucide-react";
import Link from "next/link";
import {
  firstRelation,
  getTeacherGradingFilters,
  getTeacherResultRecap,
} from "@/features/results/queries";
import { GradingTable } from "@/features/results/components/grading-table";
import { hasPermission } from "@/lib/auth/has-permission";
import { requirePermission } from "@/lib/auth/require-permission";

type PageProps = {
  searchParams: Promise<{
    q?: string;
    grading_status?: string;
    schedule_id?: string;
    subject_id?: string;
    notice?: string;
    message?: string;
  }>;
};

export default async function GradingPage({ searchParams }: PageProps) {
  const user = await requirePermission("grading.view");
  const canFinalize = hasPermission(user, "exam_results.finalize");
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

  const attemptItems = attempts.map((attempt) => {
    const student = firstRelation(attempt.users);
    const profile = firstRelation(student?.user_profiles);
    const schedule = firstRelation(attempt.exam_schedules);
    const examPackage = firstRelation(schedule?.exam_packages);
    const subject = firstRelation(examPackage?.subjects);

    return {
      id: attempt.id,
      score: attempt.score,
      max_score: attempt.max_score,
      correct_answers: attempt.correct_answers,
      total_questions: attempt.total_questions,
      grading_status: attempt.grading_status,
      student_name: profile?.full_name ?? student?.username ?? "-",
      student_identifier: profile?.nis ?? student?.email ?? "",
      schedule_title: schedule?.title ?? "-",
      subject_code: subject?.code ?? "-",
    };
  });

  const queryParams = new URLSearchParams();
  if (params.q) queryParams.set("q", params.q);
  if (params.grading_status) queryParams.set("grading_status", params.grading_status);
  if (params.subject_id) queryParams.set("subject_id", params.subject_id);
  if (params.schedule_id) queryParams.set("schedule_id", params.schedule_id);

  const currentUrl = `/dashboard/teacher/grading${
    queryParams.toString() ? `?${queryParams.toString()}` : ""
  }`;

  return (
    <div className="space-y-6">
      <ActionToast status={params.notice} message={params.message} />

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <DashboardPageHeader
          title="Koreksi Jawaban Essay"
          description="Periksa dan beri skor jawaban esai peserta ujian, lalu finalisasi nilai agar dapat dilihat oleh siswa."
        />
        {params.schedule_id && (
          <Link
            href={`/dashboard/teacher/grading/rapid?schedule_id=${params.schedule_id}`}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white shadow-2xs hover:bg-blue-700 transition active:scale-95"
          >
            <Zap className="size-4" />
            <span>Mode Koreksi Cepat</span>
          </Link>
        )}
      </div>

      <form className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs md:grid-cols-[1fr_200px_200px_200px_auto]">
        <input
          name="q"
          defaultValue={params.q ?? ""}
          placeholder="Cari siswa, nis, email..."
          className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-medium outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
        />
        <select
          name="grading_status"
          defaultValue={params.grading_status ?? ""}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium outline-none focus:border-blue-600"
        >
          <option value="">Semua status</option>
          <option value="needs_manual_grading">Perlu koreksi essay</option>
          <option value="auto_scored">Sudah dinilai otomatis</option>
          <option value="finalized">Nilai final</option>
        </select>
        <select
          name="subject_id"
          defaultValue={params.subject_id ?? ""}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium outline-none focus:border-blue-600"
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
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium outline-none focus:border-blue-600"
        >
          <option value="">Semua jadwal ujian</option>
          {filters.schedules.map((schedule) => (
            <option key={schedule.value} value={schedule.value}>
              {schedule.label}
            </option>
          ))}
        </select>
        <button className="rounded-xl bg-slate-900 px-5 py-2 text-xs font-bold text-white shadow-2xs hover:bg-slate-800 transition active:scale-95">
          Filter
        </button>
      </form>

      {!params.schedule_id &&
        attempts.some((a) => a.grading_status === "needs_manual_grading") && (
          <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4 text-xs font-medium text-blue-900 flex items-center justify-between shadow-2xs">
            <span>
              💡 <strong>Tips Efisiensi:</strong> Pilih salah satu jadwal ujian di filter dropdown untuk membuka <strong>Mode Koreksi Cepat</strong> atau memfinalisasi semua nilai sekaligus.
            </span>
          </div>
        )}

      <GradingTable
        attempts={attemptItems}
        canFinalize={canFinalize}
        scheduleId={params.schedule_id}
        currentUrl={currentUrl}
      />
    </div>
  );
}
