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
  Sparkles,
  Trophy,
  Wifi,
  X,
} from "lucide-react";

import { SagayaLogo } from "@/components/common/sagaya-logo";

type SplashScreenProps = {
  onComplete?: () => void;
  autoDismissMs?: number; // default 1800ms
  className?: string;
  isOverlay?: boolean;
};

export function SplashScreen({
  onComplete,
  autoDismissMs = 1800,
  className = "",
  isOverlay = true,
}: SplashScreenProps) {
  const [progress, setProgress] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    const startTime = Date.now();
    const intervalTime = 30;

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const currentProgress = Math.min(100, Math.round((elapsed / autoDismissMs) * 100));
      setProgress(currentProgress);

      if (elapsed >= autoDismissMs) {
        clearInterval(timer);
        setIsFadingOut(true);
        setTimeout(() => {
          if (onComplete) onComplete();
        }, 400); // match transition duration
      }
    }, intervalTime);

    return () => {
      clearInterval(timer);
    };
  }, [autoDismissMs, onComplete]);

  const handleSkip = () => {
    setIsFadingOut(true);
    setTimeout(() => {
      if (onComplete) onComplete();
    }, 200);
  };

  const containerClasses = isOverlay
    ? `fixed inset-0 z-50 flex flex-col justify-between overflow-hidden bg-gradient-to-b from-[#061435] via-[#0A1C4C] to-[#0D2463] p-6 text-white transition-opacity duration-400 sm:p-10 ${
        isFadingOut ? "opacity-0 pointer-events-none" : "opacity-100"
      } ${className}`
    : `relative flex min-h-[580px] w-full flex-col justify-between overflow-hidden rounded-3xl bg-gradient-to-b from-[#061435] via-[#0A1C4C] to-[#0D2463] p-6 text-white shadow-2xl transition-opacity duration-400 ${
        isFadingOut ? "opacity-0 pointer-events-none" : "opacity-100"
      } ${className}`;

  return (
    <div className={containerClasses} role="dialog" aria-modal="true" aria-label="Memuat Sagaya CBT">
      {/* Background Watermark Floating Decorative Icons */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-10 select-none">
        <BookOpen className="absolute -left-6 top-16 size-28 -rotate-12 text-blue-300 animate-pulse" />
        <ShieldCheck className="absolute right-8 top-20 size-24 rotate-12 text-blue-300" />
        <Trophy className="absolute -right-6 top-1/2 size-32 -rotate-6 text-blue-300" />
        <FileCheck className="absolute -left-4 bottom-28 size-28 rotate-12 text-blue-300" />
        <Award className="absolute left-1/4 bottom-10 size-20 text-blue-300" />
        <GraduationCap className="absolute right-1/4 top-1/3 size-24 -rotate-12 text-blue-300" />
        <LockKeyhole className="absolute right-10 bottom-36 size-16 rotate-6 text-blue-300" />
        <CheckCircle2 className="absolute left-12 top-1/2 size-20 rotate-45 text-blue-300" />
      </div>

      {/* Decorative Radial Ambient Glows */}
      <div className="pointer-events-none absolute left-1/2 top-1/3 size-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/20 blur-3xl animate-pulse" />
      <div className="pointer-events-none absolute bottom-0 left-1/2 size-80 -translate-x-1/2 rounded-full bg-indigo-500/25 blur-2xl" />

      {/* Top Header / Bar */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-950/50 px-3.5 py-1 text-xs font-semibold text-blue-200/90 backdrop-blur-xs">
          <Sparkles className="size-3.5 text-blue-400" />
          <span>Sistem Ujian Sekolah Digital</span>
        </div>

        {onComplete && (
          <button
            type="button"
            onClick={handleSkip}
            className="flex items-center gap-1.5 rounded-full border border-blue-400/25 bg-blue-900/30 px-3.5 py-1 text-xs font-medium text-blue-200 backdrop-blur-xs transition hover:bg-blue-800/60 hover:text-white"
          >
            <span>Lewati</span>
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {/* Main Centered Brand Hero */}
      <div className="relative z-10 my-auto flex flex-col items-center justify-center text-center">
        <div className="animate-in zoom-in-95 duration-500">
          <SagayaLogo theme="dark" size="xl" variant="full" />
        </div>
        <p className="mt-4 max-w-sm text-xs font-medium text-blue-200/70 sm:text-sm">
          Platform Ujian Online Terintegrasi, Cepat, dan Terpercaya
        </p>
      </div>

      {/* Bottom Loading Status & Progress Bar */}
      <div className="relative z-10 mx-auto flex w-full max-w-xs flex-col items-center gap-3 pb-4">
        {/* Progress Bar */}
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-blue-950/80 border border-blue-800/40">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-400 to-blue-300 transition-all duration-100 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Loading Spinner & Status Text */}
        <div className="flex items-center justify-between w-full text-[11px] font-medium text-blue-200/80">
          <div className="flex items-center gap-1.5">
            <Loader2 className="size-3 animate-spin text-blue-400" />
            <span>Memuat sistem...</span>
          </div>
          <span className="font-semibold text-blue-300">{progress}%</span>
        </div>
      </div>
    </div>
  );
}
