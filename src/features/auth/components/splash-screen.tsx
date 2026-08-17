"use client";

import { useEffect, useState } from "react";
import {
  Award,
  BookOpen,
  CheckCircle2,
  FileCheck,
  GraduationCap,
  Loader2,
  LockKeyhole,
  ShieldCheck,
  Trophy,
  Wifi,
} from "lucide-react";

import { SagayaLogo } from "@/components/common/sagaya-logo";

type SplashScreenProps = {
  onComplete?: () => void;
  autoDismissMs?: number; // default 2400ms, set to 0 to disable auto dismiss
  className?: string;
};

export function SplashScreen({
  onComplete,
  autoDismissMs = 0,
  className = "",
}: SplashScreenProps) {
  const [activeDot, setActiveDot] = useState(0);

  useEffect(() => {
    const dotInterval = setInterval(() => {
      setActiveDot((prev) => (prev + 1) % 3);
    }, 600);

    let dismissTimer: NodeJS.Timeout | null = null;
    if (autoDismissMs > 0 && onComplete) {
      dismissTimer = setTimeout(() => {
        onComplete();
      }, autoDismissMs);
    }

    return () => {
      clearInterval(dotInterval);
      if (dismissTimer) clearTimeout(dismissTimer);
    };
  }, [autoDismissMs, onComplete]);

  return (
    <div
      className={`relative flex min-h-[580px] w-full flex-col justify-between overflow-hidden rounded-3xl bg-gradient-to-b from-[#07183D] via-[#0A1C4C] to-[#0D2463] p-6 text-white shadow-2xl ${className}`}
    >
      {/* Background Watermark Floating Icons */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-10">
        <BookOpen className="absolute -left-6 top-16 size-24 -rotate-12 text-blue-300" />
        <ShieldCheck className="absolute right-4 top-20 size-20 rotate-12 text-blue-300" />
        <Trophy className="absolute -right-4 top-1/2 size-28 -rotate-6 text-blue-300" />
        <FileCheck className="absolute -left-4 bottom-28 size-24 rotate-12 text-blue-300" />
        <Award className="absolute left-1/4 bottom-10 size-16 text-blue-300" />
        <GraduationCap className="absolute right-1/4 top-1/3 size-20 -rotate-12 text-blue-300" />
        <LockKeyhole className="absolute right-8 bottom-36 size-14 rotate-6 text-blue-300" />
        <CheckCircle2 className="absolute left-10 top-1/2 size-16 rotate-45 text-blue-300" />
      </div>

      {/* Decorative Radial Glows */}
      <div className="pointer-events-none absolute left-1/2 top-1/3 size-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/15 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/2 size-72 -translate-x-1/2 rounded-full bg-indigo-500/20 blur-2xl" />

      {/* Top Status Bar Mockup */}
      <div className="relative z-10 flex items-center justify-between text-xs font-semibold text-blue-200/80">
        <span>9:41</span>
        <div className="flex items-center gap-1.5">
          <div className="flex gap-0.5 items-end h-2.5">
            <span className="w-0.5 h-1 bg-blue-200/80 rounded-xs" />
            <span className="w-0.5 h-1.5 bg-blue-200/80 rounded-xs" />
            <span className="w-0.5 h-2 bg-blue-200/80 rounded-xs" />
            <span className="w-0.5 h-2.5 bg-blue-200/80 rounded-xs" />
          </div>
          <Wifi className="size-3 text-blue-200/80" />
          <div className="h-2.5 w-5 rounded-xs border border-blue-200/80 p-0.5 flex items-center">
            <div className="h-full w-3/4 rounded-2xs bg-blue-200/80" />
          </div>
        </div>
      </div>

      {/* Main Centered Brand Hero */}
      <div className="relative z-10 my-auto flex flex-col items-center justify-center text-center">
        <div className="transition-transform duration-700 hover:scale-105">
          <SagayaLogo theme="dark" size="xl" variant="full" />
        </div>
      </div>

      {/* Bottom Loading Status & 3-Dot Indicators */}
      <div className="relative z-10 flex flex-col items-center gap-4 pb-4">
        {/* 3 Pagination Dots */}
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((idx) => (
            <span
              key={idx}
              className={`h-2 rounded-full transition-all duration-300 ${
                activeDot === idx
                  ? "w-6 bg-white shadow-xs shadow-white/40"
                  : "w-2 bg-blue-300/30"
              }`}
            />
          ))}
        </div>

        {/* Loading Spinner & Status Text */}
        <div className="flex items-center gap-2 text-xs font-medium text-blue-200/90">
          <Loader2 className="size-3.5 animate-spin text-blue-400" />
          <span>Memuat sistem...</span>
        </div>

        {onComplete && (
          <button
            type="button"
            onClick={onComplete}
            className="mt-2 rounded-full border border-blue-400/30 bg-blue-900/40 px-4 py-1 text-[11px] font-medium text-blue-200 transition hover:bg-blue-800/60 hover:text-white"
          >
            Lewati Splash
          </button>
        )}
      </div>
    </div>
  );
}
