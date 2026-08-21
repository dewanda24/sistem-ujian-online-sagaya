"use client";

import { Clock3, MoreVertical, ShieldCheck, CheckCircle2, AlertTriangle, RefreshCw, Wifi, WifiOff, Maximize2, Minimize2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ExamHeaderBarProps {
  examTitle: string;
  subjectName: string;
  totalQuestions: number;
  answeredCount: number;
  currentQuestionNumber: number;
  remainingSeconds: number;
  isOnline: boolean;
  saveSummary: "saved" | "saving" | "error";
  saveStatusText: string;
  onOpenMenu: () => void;
  onOpenPalette: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

function formatRemainingTime(totalSeconds: number) {
  if (totalSeconds <= 0) {
    return "00:00:00";
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map((unit) => String(unit).padStart(2, "0"))
    .join(":");
}

export function ExamHeaderBar({
  examTitle,
  subjectName,
  totalQuestions,
  answeredCount,
  currentQuestionNumber,
  remainingSeconds,
  isOnline,
  saveSummary,
  saveStatusText,
  onOpenMenu,
  onOpenPalette,
  isFullscreen,
  onToggleFullscreen,
}: ExamHeaderBarProps) {
  const progressPercent = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

  const timerTone =
    remainingSeconds <= 300
      ? "danger"
      : remainingSeconds <= 600
        ? "warning"
        : "normal";

  return (
    <header className="sticky top-0 z-30 w-full select-none bg-[#0F172A] text-white shadow-lg transition-all">
      {/* Main Top Bar */}
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-3 py-2.5 sm:px-5 sm:py-3">
        {/* Left: Sagaya Logo & Status Badge */}
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md">
            <ShieldCheck className="size-5 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm tracking-tight text-white sm:text-base">
                SAGAYA EXAM
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/30">
                <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Berlangsung</span>
              </span>
            </div>
            <p className="truncate text-xs font-medium text-slate-300">
              {subjectName || examTitle}
            </p>
          </div>
        </div>

        {/* Center: Question Progress (Desktop & Tablet) */}
        <div className="hidden flex-1 max-w-xs md:flex md:flex-col md:items-center md:gap-1.5 mx-4">
          <button
            type="button"
            onClick={onOpenPalette}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-200 hover:text-white transition-colors"
          >
            <span>Soal</span>
            <span className="font-black text-blue-400">
              {currentQuestionNumber}
            </span>
            <span className="text-slate-400">/ {totalQuestions}</span>
            <span className="ml-1.5 rounded-md bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-300 border border-slate-700">
              {Math.round(progressPercent)}%
            </span>
          </button>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800 border border-slate-700/60">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
            />
          </div>
        </div>

        {/* Right: Sisa Waktu & Menu Button */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {/* Sisa Waktu Box */}
          <div className="flex flex-col items-end">
            <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Sisa Waktu
            </span>
            <div
              className={cn(
                "inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-black tabular-nums transition-all sm:px-3 sm:py-1 sm:text-sm shadow-xs",
                timerTone === "danger" &&
                  "bg-red-600 text-white animate-pulse shadow-red-500/30 ring-2 ring-red-400",
                timerTone === "warning" &&
                  "bg-amber-500 text-slate-950 font-black shadow-amber-500/20 ring-1 ring-amber-300",
                timerTone === "normal" &&
                  "bg-slate-800 text-white border border-slate-700",
              )}
              title="Sisa Waktu Pengerjaan"
            >
              <Clock3 className="size-3.5 shrink-0" aria-hidden="true" />
              <span>{formatRemainingTime(remainingSeconds)}</span>
            </div>
          </div>

          {/* Fullscreen Button */}
          {onToggleFullscreen && (
            <button
              type="button"
              onClick={onToggleFullscreen}
              className="hidden sm:flex size-9 items-center justify-center rounded-xl bg-slate-800/90 text-slate-300 border border-slate-700/80 hover:bg-slate-700 hover:text-white active:scale-90 transition-all"
              title={isFullscreen ? "Layar Penuh Aktif" : "Masuk Layar Penuh"}
              aria-label="Toggle Fullscreen"
            >
              {isFullscreen ? (
                <Minimize2 className="size-4 text-emerald-400" />
              ) : (
                <Maximize2 className="size-4" />
              )}
            </button>
          )}

          {/* Three Dots Menu Button (7.4 Menu Opsi) */}
          <button
            type="button"
            onClick={onOpenMenu}
            className="flex size-9 items-center justify-center rounded-xl bg-slate-800/90 text-slate-300 border border-slate-700/80 hover:bg-slate-700 hover:text-white active:scale-90 transition-all"
            aria-label="Menu Opsi Ujian"
            title="Menu Opsi"
          >
            <MoreVertical className="size-4" />
          </button>
        </div>
      </div>

      {/* Sub-bar: Auto-Save Status & Network Indicator */}
      <div className="flex items-center justify-between border-t border-slate-800/90 bg-[#0B132B]/80 px-3 py-1 text-[11px] sm:px-5">
        <div className="flex items-center gap-2">
          {saveSummary === "saving" ? (
            <span className="inline-flex items-center gap-1 font-medium text-blue-300">
              <RefreshCw className="size-3 animate-spin text-blue-400" />
              <span>Menyimpan jawaban...</span>
            </span>
          ) : saveSummary === "error" ? (
            <span className="inline-flex items-center gap-1 font-semibold text-red-400">
              <AlertTriangle className="size-3 text-red-400" />
              <span>Ada jawaban tertunda. Periksa koneksi.</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 font-medium text-emerald-300">
              <CheckCircle2 className="size-3 text-emerald-400" />
              <span>Tersimpan otomatis</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-slate-400">
          <button
            type="button"
            onClick={onOpenPalette}
            className="inline-flex md:hidden items-center gap-1 text-slate-300 font-bold hover:text-white"
          >
            <span>Soal {currentQuestionNumber}/{totalQuestions}</span>
          </button>

          <span className="inline-flex items-center gap-1 text-slate-400">
            {isOnline ? (
              <span className="flex items-center gap-1 text-emerald-400">
                <Wifi className="size-3" />
                <span className="hidden sm:inline">Online</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-red-400 animate-pulse">
                <WifiOff className="size-3" />
                <span>Offline</span>
              </span>
            )}
          </span>
        </div>
      </div>
    </header>
  );
}
