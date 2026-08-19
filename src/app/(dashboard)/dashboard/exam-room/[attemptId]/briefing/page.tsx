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
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      {/* Top Banner */}
      <div className="bg-[#2563EB] px-4 pt-12 pb-8 text-white">
        <div className="mx-auto max-w-3xl">
          <p className="text-[13px] font-semibold text-blue-200 uppercase tracking-wider mb-2">
            Briefing Ujian
          </p>
          <h1 className="text-[24px] font-bold leading-tight">
            {examPackage?.title || schedule?.title}
          </h1>
          <p className="mt-1 text-[15px] text-blue-100">
            {subject?.name || "Mata Pelajaran Umum"}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 -mt-4">
        {/* Info Cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm">
            <div className="flex size-10 items-center justify-center rounded-full bg-blue-50 text-[#2563EB] mb-3">
              <Clock className="size-5" />
            </div>
            <p className="text-[13px] text-[#64748B] font-medium">Durasi Ujian</p>
            <p className="text-[16px] font-bold text-[#1E293B]">{durationText}</p>
          </div>
          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm">
            <div className="flex size-10 items-center justify-center rounded-full bg-blue-50 text-[#2563EB] mb-3">
              <FileText className="size-5" />
            </div>
            <p className="text-[13px] text-[#64748B] font-medium">Jumlah Soal</p>
            <p className="text-[16px] font-bold text-[#1E293B]">
              {examPackage?.total_questions || 0} Soal
            </p>
          </div>
        </div>

        {/* Aturan & Tata Tertib */}
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm space-y-4 mb-6">
          <div className="flex items-center gap-2 pb-2 border-b border-[#F1F5F9]">
            <Info className="size-5 text-[#64748B]" />
            <h2 className="text-[16px] font-bold text-[#1E293B]">Informasi Pengerjaan</h2>
          </div>
          
          <ul className="space-y-3 text-[14px] text-[#475569] font-medium">
            <li className="flex gap-3">
              <span className="shrink-0 flex size-6 items-center justify-center rounded-full bg-[#F1F5F9] text-[#64748B] text-[12px] font-bold">1</span>
              <span>Kerjakan soal dengan jujur dan teliti. Pastikan koneksi internet stabil.</span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 flex size-6 items-center justify-center rounded-full bg-[#F1F5F9] text-[#64748B] text-[12px] font-bold">2</span>
              <span>Jawaban akan tersimpan otomatis. Tanda hijau akan muncul di bawah soal jika jawaban sudah tersimpan.</span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 flex size-6 items-center justify-center rounded-full bg-[#F1F5F9] text-[#64748B] text-[12px] font-bold">3</span>
              <span>Waktu ujian berjalan terus meskipun Anda keluar atau refresh halaman.</span>
            </li>
          </ul>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm space-y-3 mb-6">
          <div className="flex items-center gap-2 text-amber-700">
            <ShieldAlert className="size-5" />
            <h2 className="text-[15px] font-bold">Peringatan Anti-Curang</h2>
          </div>
          <p className="text-[13px] text-amber-800 leading-relaxed font-medium">
            Sistem mencatat aktivitas ujian Anda. Ujian yang dibuka di dua perangkat atau browser secara bersamaan akan otomatis diblokir.
          </p>
        </div>

      </div>

      {/* Sticky Bottom Action */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-[#E2E8F0] bg-white p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50">
        <div className="mx-auto max-w-3xl flex gap-3">
          <Link
            href="/dashboard/student/active-exams"
            className="flex h-[52px] flex-1 items-center justify-center rounded-full border-[1.5px] border-[#CBD5E1] bg-white text-[15px] font-bold text-[#64748B] transition active:scale-[0.98]"
          >
            Nanti Saja
          </Link>
          <Link
            href={`/dashboard/exam-room/${attemptId}`}
            className="flex h-[52px] flex-[2] items-center justify-center gap-2 rounded-full bg-[#2563EB] text-[15px] font-bold text-white shadow-md transition active:scale-[0.98]"
          >
            <span>Saya Mengerti, Mulai Ujian</span>
            <ArrowRight className="size-4 stroke-[2.5]" />
          </Link>
        </div>
      </div>
    </div>
  );
}
