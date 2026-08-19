import Link from "next/link";
import { ArrowRight, CalendarDays } from "lucide-react";

export function EmptyExamState({ upcomingCount = 0 }: { upcomingCount?: number }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 text-center shadow-xs">
      {/* Subtle modern vector illustration */}
      <div className="relative mb-4 flex size-20 sm:size-24 items-center justify-center rounded-3xl bg-blue-50/80 text-blue-600 ring-8 ring-blue-50/40">
        <svg
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="size-12 sm:size-14"
          aria-hidden="true"
        >
          {/* Clipboard Board */}
          <rect
            x="14"
            y="12"
            width="36"
            height="44"
            rx="6"
            fill="#E0E7FF"
            stroke="#4F46E5"
            strokeWidth="2"
          />
          {/* Clip Top */}
          <rect
            x="24"
            y="8"
            width="16"
            height="8"
            rx="3"
            fill="#4F46E5"
          />
          <circle cx="32" cy="12" r="1.5" fill="#FFFFFF" />
          {/* Lines / Tasks */}
          <line
            x1="22"
            y1="24"
            x2="42"
            y2="24"
            stroke="#6366F1"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <line
            x1="22"
            y1="32"
            x2="38"
            y2="32"
            stroke="#93C5FD"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <line
            x1="22"
            y1="40"
            x2="34"
            y2="40"
            stroke="#93C5FD"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* Checkmark circle */}
          <circle cx="44" cy="44" r="8" fill="#10B981" />
          <path
            d="M41 44L43 46L47 42"
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <h2 className="text-[18px] sm:text-[20px] font-bold text-[#1E293B]">
        Belum ada ujian aktif
      </h2>
      <p className="mt-2 max-w-sm text-[14px] text-[#64748B] leading-relaxed">
        Saat ini tidak ada ujian yang sedang berlangsung. Waktunya bernapas lega atau bersiap untuk ujian berikutnya!
      </p>

      {upcomingCount > 0 ? (
        <div className="mt-6 flex flex-col items-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 border border-amber-200">
            <CalendarDays className="size-4 text-amber-600" />
            <span className="text-[13px] font-semibold text-amber-700">
              Ada {upcomingCount} ujian menanti di jadwal
            </span>
          </div>
          <Link
            href="/dashboard/student/schedules"
            className="flex h-[48px] items-center justify-center gap-2 rounded-full bg-[#2563EB] px-6 text-[15px] font-bold text-white shadow-md transition active:scale-[0.98]"
          >
            <span>Lihat Jadwal Saya</span>
            <ArrowRight className="size-4 stroke-[2.5]" />
          </Link>
        </div>
      ) : (
        <div className="mt-6">
          <Link
            href="/dashboard/student/schedules"
            className="flex h-[48px] items-center justify-center gap-2 rounded-full border-[1.5px] border-[#CBD5E1] bg-white px-6 text-[15px] font-bold text-[#64748B] transition active:scale-[0.98]"
          >
            <CalendarDays className="size-4" />
            <span>Lihat Kalender Ujian</span>
          </Link>
        </div>
      )}
    </div>
  );
}
