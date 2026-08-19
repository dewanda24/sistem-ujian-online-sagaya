import Link from "next/link";
import { ArrowUpRight, CheckCircle2, Clock } from "lucide-react";
import { formatJakartaDateTime } from "@/lib/date-time";

interface HistoryExamCardProps {
  attemptId: string;
  scheduleTitle: string;
  subjectCode: string;
  subjectName: string;
  score: number | null;
  maxScore: number | null;
  canShowScore: boolean;
  gradingStatus: string | null;
  submittedAt: string | null;
}

export function HistoryExamCard({
  attemptId,
  scheduleTitle,
  subjectCode,
  subjectName,
  score,
  maxScore,
  canShowScore,
  gradingStatus,
  submittedAt,
}: HistoryExamCardProps) {
  const gradingLabel =
    gradingStatus === "needs_manual_grading"
      ? "Menunggu Koreksi Guru"
      : gradingStatus === "finalized"
        ? "Nilai Final"
        : "Selesai";

  const isPending = gradingStatus === "needs_manual_grading";
  const actualScore = score ?? 0;
  const actualMax = maxScore ?? 100;
  
  // Calculate percentage for progress circle
  const percentage = actualMax > 0 ? (actualScore / actualMax) * 100 : 0;
  const isPassing = percentage >= 70; // Assuming 70 is KKM, but mostly for visual tone

  return (
    <div className="group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:shadow-md sm:p-6 flex flex-col md:flex-row gap-5 md:items-center">
      
      {/* Left Content (Info) */}
      <div className="flex-1 space-y-3.5">
        <div className="flex flex-wrap items-start justify-between gap-2 md:justify-start md:gap-3">
          <div className="flex items-center gap-1.5">
            <span className="rounded-lg bg-[#E0E7FF] px-2.5 py-0.5 text-[11px] font-bold tracking-wide text-[#3730A3]">
              {subjectCode || "-"}
            </span>
            <span className="text-[13px] font-semibold text-[#64748B]">
              {subjectName || "Mata Pelajaran"}
            </span>
          </div>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
              isPending
                ? "bg-amber-100 text-amber-800"
                : "bg-emerald-100 text-emerald-800"
            }`}
          >
            <CheckCircle2 className="size-3" />
            {gradingLabel}
          </span>
        </div>

        <div>
          <h3 className="text-[18px] md:text-[20px] font-extrabold text-[#0F172A] leading-tight">
            {scheduleTitle || "Ujian"}
          </h3>
        </div>

        <div className="flex items-center gap-1.5 text-[13px] text-[#64748B] font-medium">
          <Clock className="size-4 opacity-70" />
          <span>
            Dikumpulkan: {submittedAt ? formatJakartaDateTime(submittedAt) : "-"}
          </span>
        </div>
      </div>

      {/* Right Content (Score & Action) */}
      <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-4 md:border-t-0 md:border-l md:pl-6 md:pt-0 shrink-0 md:min-w-[200px]">
        {/* Score Display */}
        <div className="flex flex-col">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
            Skor Akhir
          </span>
          {canShowScore ? (
            <div className="flex items-baseline gap-1">
              <span className={`text-[32px] md:text-[36px] font-black tracking-tighter leading-none ${isPassing ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                {actualScore}
              </span>
              <span className="text-[16px] font-bold text-slate-300">
                / {actualMax}
              </span>
            </div>
          ) : (
            <div className="flex h-[36px] items-center">
              <span className="text-[13px] font-bold italic text-amber-500">
                Menunggu Hasil
              </span>
            </div>
          )}
        </div>

        {/* Action Button */}
        <Link
          href={`/dashboard/exam-results/${attemptId}`}
          className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-slate-500 hover:bg-[#2563EB] hover:text-white hover:shadow-md transition-all active:scale-95 group-hover:bg-[#2563EB] group-hover:text-white"
          title="Lihat Detail Jawaban"
        >
          <ArrowUpRight className="size-5" />
        </Link>
      </div>
    </div>
  );
}
