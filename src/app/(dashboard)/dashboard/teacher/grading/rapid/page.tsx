import { redirect } from "next/navigation";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { ActionToast } from "@/components/master-data/action-toast";
import { requirePermission } from "@/lib/auth/require-permission";
import { getRapidGradingAnswers, firstRelation } from "@/features/results/queries";
import { gradeEssayAnswerAction } from "@/features/results/actions";
import { QuestionMathRenderer } from "@/features/question-bank/components/question-math-renderer";
import Link from "next/link";
import { CheckCircle2, ChevronLeft } from "lucide-react";

type PageProps = {
  searchParams: Promise<{ schedule_id?: string; notice?: string; message?: string; }>;
};

export default async function RapidGradingPage({ searchParams }: PageProps) {
  await requirePermission("grading.manage");
  const params = await searchParams;
  
  if (!params.schedule_id) {
    redirect("/dashboard/teacher/grading");
  }

  const answers = await getRapidGradingAnswers(params.schedule_id);

  if (answers.length === 0) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader
          title="Mode Koreksi Cepat"
          description="Semua esai untuk jadwal ini telah dinilai."
        />
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-8 text-center flex flex-col items-center justify-center">
          <CheckCircle2 className="size-12 text-emerald-600 mb-3" />
          <h2 className="text-lg font-bold text-emerald-800">Pekerjaan Selesai!</h2>
          <p className="mt-1 text-emerald-700">Semua jawaban esai pada jadwal ujian ini telah selesai dikoreksi.</p>
          <div className="mt-6">
            <Link href="/dashboard/teacher/grading" className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition">
              <ChevronLeft className="size-4" />
              Kembali ke Daftar Koreksi
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ActionToast status={params.notice} message={params.message} />
      
      <div className="flex items-start justify-between">
        <DashboardPageHeader
          title="Mode Koreksi Cepat"
          description={`${answers.length} jawaban esai menunggu untuk dinilai.`}
        />
        <Link href="/dashboard/teacher/grading" className="inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-1.5 text-sm font-medium hover:bg-slate-50 transition">
          <ChevronLeft className="size-4" />
          Tutup Mode Cepat
        </Link>
      </div>

      <div className="space-y-8">
        {answers.map((answer, index) => {
          const attempt = firstRelation(answer.exam_attempts);
          const student = firstRelation(attempt?.users);
          const profile = firstRelation(student?.user_profiles);
          const question = firstRelation(answer.questions);
          const stimuli = firstRelation(question?.question_stimuli);

          return (
            <div key={answer.id} className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-sm ring-1 ring-slate-900/5">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] bg-slate-50/50 p-4">
                <div>
                  <h3 className="font-semibold text-slate-800">Antrean #{index + 1}</h3>
                  <p className="text-sm text-slate-500">{profile?.full_name ?? student?.username} ({student?.username})</p>
                </div>
                <div className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-200">
                  Maks: {answer.max_score ?? question?.point ?? 0} Poin
                </div>
              </div>

              <div className="p-6">
                {/* Soal */}
                <div className="mb-6 space-y-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Pertanyaan</h4>
                  {stimuli ? (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
                      <div className="text-sm font-bold text-slate-700">{stimuli.title}</div>
                      <QuestionMathRenderer content={stimuli.content} className="mt-2 text-sm" />
                    </div>
                  ) : null}
                  <div className="font-medium text-slate-800">
                    <QuestionMathRenderer content={question?.content ?? ""} />
                  </div>
                </div>

                {/* Jawaban Siswa */}
                <div className="mb-6">
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Jawaban Siswa</h4>
                  <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 text-[#0F172A] min-h-[100px]">
                    <QuestionMathRenderer content={answer.essay_answer ?? "-"} />
                  </div>
                </div>

                {/* Input Nilai */}
                <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <form action={gradeEssayAnswerAction} className="flex flex-col sm:flex-row sm:items-end gap-3">
                    <input type="hidden" name="attempt_id" value={attempt?.id} />
                    <input type="hidden" name="answer_id" value={answer.id} />
                    <input
                      type="hidden"
                      name="max_score"
                      value={answer.max_score ?? question?.point ?? 0}
                    />
                    <input type="hidden" name="return_to" value={`/dashboard/teacher/grading/rapid?schedule_id=${params.schedule_id}`} />
                    
                    <div className="flex-1 max-w-[200px]">
                      <label className="mb-1.5 block text-xs font-bold text-amber-800 uppercase tracking-wider">Beri Skor</label>
                      <input
                        name="awarded_score"
                        type="number"
                        min="0"
                        max={Number(answer.max_score ?? question?.point ?? 0)}
                        step="0.01"
                        defaultValue={answer.awarded_score ?? 0}
                        className="h-10 w-full rounded-lg border border-amber-300 px-3 font-medium text-amber-900 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
                        required
                        autoFocus={index === 0}
                      />
                    </div>
                    
                    <button type="submit" className="h-10 w-full sm:w-auto rounded-lg bg-blue-600 px-6 font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-95">
                      Simpan Nilai & Lanjut
                    </button>
                  </form>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
