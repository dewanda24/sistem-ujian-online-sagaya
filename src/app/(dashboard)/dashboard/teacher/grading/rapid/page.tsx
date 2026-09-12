import { redirect } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, ChevronLeft, RotateCcw } from "lucide-react";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { ActionToast } from "@/components/master-data/action-toast";
import { requirePermission } from "@/lib/auth/require-permission";
import { getRapidGradingAnswers, firstRelation } from "@/features/results/queries";
import { RapidGradingForm } from "@/features/results/components/rapid-grading-form";
import { QuestionMathRenderer } from "@/features/question-bank/components/question-math-renderer";

type PageProps = {
  searchParams: Promise<{
    schedule_id?: string;
    skip_ids?: string;
    notice?: string;
    message?: string;
  }>;
};

export default async function RapidGradingPage({ searchParams }: PageProps) {
  await requirePermission("grading.manage");
  const params = await searchParams;

  if (!params.schedule_id) {
    redirect("/dashboard/teacher/grading");
  }

  const skipIdList = params.skip_ids
    ? params.skip_ids.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  const answers = await getRapidGradingAnswers(params.schedule_id, skipIdList);

  if (answers.length === 0) {
    if (skipIdList.length > 0) {
      return (
        <div className="space-y-6">
          <DashboardPageHeader
            title="Mode Koreksi Cepat"
            description="Semua jawaban aktif dalam antrean telah dinilai."
          />
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center flex flex-col items-center justify-center shadow-xs">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 mb-4">
              <RotateCcw className="size-7" />
            </div>
            <h2 className="text-xl font-bold text-amber-950">Jawaban Aktif Selesai!</h2>
            <p className="mt-2 text-sm text-amber-800 max-w-md">
              Anda telah menilai seluruh jawaban aktif, namun masih terdapat{" "}
              <strong>{skipIdList.length} jawaban</strong> yang sebelumnya dilewati.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link
                href={`/dashboard/teacher/grading/rapid?schedule_id=${params.schedule_id}`}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-amber-700 shadow-sm transition active:scale-95"
              >
                <RotateCcw className="size-4" />
                Periksa Jawaban yang Dilewati
              </Link>
              <Link
                href="/dashboard/teacher/grading"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition active:scale-95"
              >
                <ChevronLeft className="size-4" />
                Kembali ke Rekap Koreksi
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <DashboardPageHeader
          title="Mode Koreksi Cepat"
          description="Semua esai untuk jadwal ini telah dinilai."
        />
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center flex flex-col items-center justify-center shadow-xs">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 mb-4">
            <CheckCircle2 className="size-8" />
          </div>
          <h2 className="text-xl font-bold text-emerald-950">Pekerjaan Selesai!</h2>
          <p className="mt-2 text-sm text-emerald-800 max-w-md">
            Luar biasa! Semua jawaban esai pada jadwal ujian ini telah selesai dikoreksi.
          </p>
          <div className="mt-6">
            <Link
              href="/dashboard/teacher/grading"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 shadow-sm transition active:scale-95"
            >
              <ChevronLeft className="size-4" />
              Kembali ke Daftar Koreksi
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const answer = answers[0];
  const attempt = firstRelation(answer.exam_attempts);
  const student = firstRelation(attempt?.users);
  const profile = firstRelation(student?.user_profiles);
  const question = firstRelation(answer.questions);
  const stimuli = firstRelation(question?.question_stimuli);
  const remaining = answers.length - 1;
  const maxScore = Number(answer.max_score ?? question?.point ?? 0);

  const currentSkipIds = [...skipIdList, answer.id];
  const skipUrl = `/dashboard/teacher/grading/rapid?schedule_id=${params.schedule_id}&skip_ids=${currentSkipIds.join(",")}`;
  const returnTo = `/dashboard/teacher/grading/rapid?schedule_id=${params.schedule_id}${
    skipIdList.length > 0 ? `&skip_ids=${skipIdList.join(",")}` : ""
  }`;

  return (
    <div className="space-y-6">
      <ActionToast status={params.notice} message={params.message} />

      <div className="flex items-start justify-between gap-4">
        <DashboardPageHeader
          title="Mode Koreksi Cepat"
          description={`${answers.length} jawaban esai menunggu untuk dinilai.${
            skipIdList.length > 0 ? ` (${skipIdList.length} dilewati)` : ""
          }`}
        />
        <div className="flex items-center gap-2">
          {skipIdList.length > 0 && (
            <Link
              href={`/dashboard/teacher/grading/rapid?schedule_id=${params.schedule_id}`}
              className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800 hover:bg-amber-100 transition shadow-2xs"
              title="Tampilkan kembali semua jawaban yang sebelumnya dilewati"
            >
              <RotateCcw className="size-3.5" />
              <span>Reset Lewati ({skipIdList.length})</span>
            </Link>
          )}
          <Link
            href="/dashboard/teacher/grading"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
          >
            <ChevronLeft className="size-4" />
            <span>Tutup Mode Cepat</span>
          </Link>
        </div>
      </div>

      <div className="space-y-8">
        <div
          key={answer.id}
          className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-sm ring-1 ring-slate-900/5"
        >
          {/* Header Kartu Jawaban */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#E2E8F0] bg-slate-50/70 p-4 gap-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Siswa yang Dinilai
              </h3>
              <p className="mt-0.5 text-base font-bold text-slate-900">
                {profile?.full_name ?? student?.username}
                <span className="ml-2 text-xs font-normal text-slate-500">
                  ({student?.username})
                </span>
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              {remaining > 0 ? (
                <div className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full ring-1 ring-amber-200">
                  Sisa antrean: {remaining} jawaban lagi
                </div>
              ) : (
                <div className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full ring-1 ring-emerald-200">
                  Jawaban terakhir dalam antrean
                </div>
              )}
              <div className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 ring-1 ring-blue-200">
                Maksimal: {maxScore} Poin
              </div>
            </div>
          </div>

          <div className="p-6">
            {/* Butir Soal */}
            <div className="mb-6 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Pertanyaan Soal
              </h4>
              {stimuli ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-2xs">
                  <div className="text-sm font-bold text-slate-800">{stimuli.title}</div>
                  <QuestionMathRenderer
                    content={stimuli.content}
                    className="mt-2 text-sm"
                  />
                </div>
              ) : null}
              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 text-base font-medium text-slate-900">
                <QuestionMathRenderer content={question?.content ?? ""} />
              </div>
            </div>

            {/* Jawaban Siswa */}
            <div className="mb-6 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Jawaban Siswa
              </h4>
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 text-slate-900 min-h-[120px] text-base leading-relaxed">
                <QuestionMathRenderer content={answer.essay_answer ?? "-"} />
              </div>
            </div>

            {/* Form Input Nilai & Catatan & Skip (Client Component) */}
            <RapidGradingForm
              attemptId={attempt?.id ?? ""}
              answerId={answer.id}
              maxScore={maxScore}
              returnTo={returnTo}
              skipUrl={skipUrl}
              remainingCount={remaining}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
