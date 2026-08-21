import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Clock, FileText, Info, ShieldAlert } from "lucide-react";

import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { getExamAttempt } from "@/features/exam-room/queries";
import { requirePermission } from "@/lib/auth/require-permission";

type PageProps = {
  params: Promise<{
    attemptId: string;
  }>;
};

export default async function BriefingPage({ params }: PageProps) {
  await requirePermission("exam_room.access");
  const { attemptId } = await params;
  const attempt = await getExamAttempt(attemptId);

  if (!attempt) {
    notFound();
  }

  // Jika ujian sudah selesai dikumpulkan atau expired
  if (attempt.status !== "in_progress") {
    redirect(`/dashboard/student/history`);
  }

  const schedule = Array.isArray(attempt.exam_schedules)
    ? attempt.exam_schedules[0]
    : attempt.exam_schedules;
  const examPackage = schedule?.exam_packages;
  const subject = examPackage?.subjects as { name?: string; code?: string } | undefined;

  const durationText = examPackage?.duration_minutes
    ? `${examPackage.duration_minutes} Menit`
    : "Sesuai Jadwal Berakhir";

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      {/* Top Banner */}
      <div className="bg-blue-600 px-4 pt-12 pb-10 text-white shadow-md relative overflow-hidden">
        <div className="pointer-events-none absolute right-0 top-0 size-48 rounded-full bg-white/10 blur-xl" />
        <div className="relative z-10 mx-auto max-w-3xl">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-0.5 text-xs font-semibold uppercase tracking-wider backdrop-blur-sm mb-2 text-blue-100">
            <span>Petunjuk & Briefing Ujian</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black leading-tight">
            {examPackage?.title || schedule?.title}
          </h1>
          <p className="mt-1 text-sm text-blue-100 font-medium">
            {subject?.name || "Mata Pelajaran Umum"}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 -mt-4 space-y-4">
        {/* Info Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs">
            <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 mb-2">
              <Clock className="size-5" />
            </div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Durasi Ujian</p>
            <p className="text-base sm:text-lg font-black text-slate-900 mt-0.5">{durationText}</p>
          </div>
          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs">
            <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 mb-2">
              <FileText className="size-5" />
            </div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Jumlah Butir</p>
            <p className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
              {examPackage?.total_questions || 0} Soal
            </p>
          </div>
        </div>

        {/* Aturan & Tata Tertib */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
            <Info className="size-4.5 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">Tata Tertib & Informasi Pengerjaan</h2>
          </div>
          
          <ul className="space-y-3 text-xs sm:text-sm text-slate-600 font-medium">
            <li className="flex gap-3 items-start">
              <span className="shrink-0 flex size-6 items-center justify-center rounded-full bg-blue-50 text-blue-600 text-xs font-bold mt-0.5">1</span>
              <span className="leading-relaxed">Kerjakan soal secara mandiri, jujur, dan teliti. Pastikan kuota dan daya baterai HP mencukupi.</span>
            </li>
            <li className="flex gap-3 items-start">
              <span className="shrink-0 flex size-6 items-center justify-center rounded-full bg-blue-50 text-blue-600 text-xs font-bold mt-0.5">2</span>
              <span className="leading-relaxed">Jawaban tersimpan otomatis setiap kali opsi dipilih. Indikator hijau menandakan jawaban tersimpan aman di server.</span>
            </li>
            <li className="flex gap-3 items-start">
              <span className="shrink-0 flex size-6 items-center justify-center rounded-full bg-blue-50 text-blue-600 text-xs font-bold mt-0.5">3</span>
              <span className="leading-relaxed">Waktu ujian terus berjalan mundur. Jangan menutup browser atau berpindah ke aplikasi lain.</span>
            </li>
          </ul>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 sm:p-5 shadow-2xs space-y-2">
          <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
            <ShieldAlert className="size-4.5 text-amber-600" />
            <h2>Sistem Pengawasan & Wajib Layar Penuh (Anti-Curang)</h2>
          </div>
          <p className="text-xs text-amber-900 leading-relaxed font-medium">
            Ujian ini mewajibkan <strong>Mode Layar Penuh (Fullscreen)</strong>. Sistem mencatat perpindahan tab, minimize jendela, dan aplikasi lain. Lembar ujian akan terkunci jika Anda keluar dari mode layar penuh atau batas pelanggaran terlampaui.
          </p>
        </div>
      </div>

      {/* Sticky Bottom Action */}
      <div className="fixed bottom-0 inset-x-0 border-t border-slate-200 bg-white p-3.5 pb-[max(0.875rem,env(safe-area-inset-bottom))] shadow-[0_-8px_25px_rgba(15,23,42,0.08)] z-50">
        <div className="mx-auto max-w-3xl flex gap-3">
          <Link
            href="/dashboard/student/active-exams"
            className="flex h-12 flex-1 items-center justify-center rounded-xl border border-slate-300 bg-white text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-50 transition active:scale-95"
          >
            Nanti Saja
          </Link>
          <Link
            href={`/dashboard/exam-room/${attemptId}`}
            className="flex h-12 flex-[2] items-center justify-center gap-2 rounded-xl bg-blue-600 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-blue-700 transition active:scale-95"
          >
            <span>Mulai Kerjakan Ujian</span>
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
