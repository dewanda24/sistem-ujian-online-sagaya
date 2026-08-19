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
  const firstName = studentName.split(" ")[0] ?? studentName;

  const quote =
    motivationalQuote ||
    (statusType === "active"
      ? "Ada ujian yang harus dikerjakan hari ini."
      : statusType === "waiting_grading"
        ? "Ujian selesai. Menunggu hasil koreksi."
        : statusType === "result_ready"
          ? "Hasil ujian sudah tersedia!"
          : "Tetap semangat dan terus belajar!");

  return (
    <div className="flex items-center gap-3">
      {/* Avatar */}
      <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#2563EB] text-white text-[16px] font-bold select-none">
        {firstName.charAt(0).toUpperCase()}
      </div>
      {/* Text */}
      <div className="min-w-0 flex-1">
        <p className="text-[17px] font-semibold text-[#1E293B] truncate">
          Halo, {firstName} 👋
        </p>
        <p className="text-[13px] text-[#64748B] truncate">{quote}</p>
      </div>
    </div>
  );
}
