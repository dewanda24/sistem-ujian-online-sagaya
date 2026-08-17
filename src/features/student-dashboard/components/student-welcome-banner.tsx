import { Sparkles } from "lucide-react";

interface StudentWelcomeBannerProps {
  studentName: string;
  motivationalQuote?: string;
  statusType?: "active" | "empty" | "waiting_grading" | "result_ready";
}

export function StudentWelcomeBanner({
  studentName,
  motivationalQuote,
  statusType = "empty",
}: StudentWelcomeBannerProps) {
  // Default quote based on status type if not explicitly provided
  const quote =
    motivationalQuote ||
    (statusType === "active"
      ? "Semangat, hari ini pasti bisa!"
      : statusType === "waiting_grading"
        ? "Terima kasih sudah mengerjakan ujian."
        : statusType === "result_ready"
          ? "Hasil ujian sudah tersedia!"
          : "Tetap semangat dan terus belajar!");

  return (
    <div className="flex items-center gap-3.5 sm:gap-4.5 rounded-2xl bg-white p-3.5 sm:p-4.5 border border-slate-200/80 shadow-2xs">
      {/* Friendly Avatar Container */}
      <div className="relative flex size-12 sm:size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-sm ring-4 ring-blue-50">
        <svg
          viewBox="0 0 36 36"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="size-8 sm:size-9"
          aria-hidden="true"
        >
          {/* Avatar Hair & Head */}
          <circle cx="18" cy="14" r="7" fill="#FEE2E2" />
          <path
            d="M12 13C12 9.68629 14.6863 7 18 7C21.3137 7 24 9.68629 24 13C24 13.5 23.5 14 23 14C22 14 21.5 13 20 13C18.5 13 18 14 17 14C15.5 14 15 13 14 13C13 13 12 13.5 12 13Z"
            fill="#1E293B"
          />
          {/* Eyes & Smile */}
          <circle cx="15.5" cy="14" r="0.8" fill="#1E293B" />
          <circle cx="20.5" cy="14" r="0.8" fill="#1E293B" />
          <path
            d="M16 16.5C16.8 17.5 19.2 17.5 20 16.5"
            stroke="#1E293B"
            strokeWidth="0.8"
            strokeLinecap="round"
          />
          {/* Body/Shirt */}
          <path
            d="M9 31C9 25.4772 13.0294 22 18 22C22.9706 22 27 25.4772 27 31"
            fill="#3B82F6"
          />
          <path
            d="M15 22L18 26L21 22"
            stroke="#FFFFFF"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        {/* Little badge / status dot */}
        <span className="absolute -bottom-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-amber-400 ring-2 ring-white">
          <Sparkles className="size-2.5 text-amber-950" />
        </span>
      </div>

      {/* Greeting Texts */}
      <div className="min-w-0 flex-1">
        <h1 className="flex items-center gap-1.5 text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
          <span className="truncate">Halo, {studentName}!</span>
          <span className="shrink-0 text-amber-500 animate-wiggle">👋</span>
        </h1>
        <p className="text-xs sm:text-sm font-medium text-slate-500 truncate mt-0.5">
          {quote}
        </p>
      </div>
    </div>
  );
}
