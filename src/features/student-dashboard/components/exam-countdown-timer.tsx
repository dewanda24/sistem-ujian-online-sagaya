"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

interface ExamCountdownTimerProps {
  startAt: string;
  endAt: string;
  durationMinutes?: number | null;
  lightMode?: boolean;
}

export function ExamCountdownTimer({
  startAt,
  endAt,
  durationMinutes,
  lightMode = false,
}: ExamCountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    hours: string;
    minutes: string;
    seconds: string;
    totalSeconds: number;
    percentage: number;
    isEnded: boolean;
  }>({
    hours: "00",
    minutes: "00",
    seconds: "00",
    totalSeconds: 0,
    percentage: 100,
    isEnded: false,
  });

  useEffect(() => {
    function calculate() {
      const now = Date.now();
      const endTime = new Date(endAt).getTime();
      const startTime = new Date(startAt).getTime();
      const diff = endTime - now;

      if (diff <= 0) {
        setTimeLeft({
          hours: "00",
          minutes: "00",
          seconds: "00",
          totalSeconds: 0,
          percentage: 0,
          isEnded: true,
        });
        return;
      }

      const totalDuration =
        durationMinutes && durationMinutes > 0
          ? durationMinutes * 60 * 1000
          : endTime - startTime;

      const elapsed = Math.max(0, now - startTime);
      const percentage =
        totalDuration > 0
          ? Math.max(0, Math.min(100, 100 - (elapsed / totalDuration) * 100))
          : 50;

      const totalSec = Math.floor(diff / 1000);
      const h = Math.floor(totalSec / 3600);
      const m = Math.floor((totalSec % 3600) / 60);
      const s = totalSec % 60;

      setTimeLeft({
        hours: String(h).padStart(2, "0"),
        minutes: String(m).padStart(2, "0"),
        seconds: String(s).padStart(2, "0"),
        totalSeconds: totalSec,
        percentage,
        isEnded: false,
      });
    }

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [startAt, endAt, durationMinutes]);

  return (
    <div className="space-y-1.5 w-full">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 font-medium opacity-90">
          <Clock className="size-3.5" />
          <span>Sisa Waktu</span>
        </div>
        <span className="font-mono text-sm sm:text-base font-black tracking-wider">
          {timeLeft.isEnded
            ? "Waktu Habis"
            : `${timeLeft.hours}:${timeLeft.minutes}:${timeLeft.seconds}`}
        </span>
      </div>

      {/* Progress bar */}
      <div
        className={`h-1.5 w-full overflow-hidden rounded-full ${
          lightMode ? "bg-slate-200" : "bg-white/20"
        }`}
      >
        <div
          className={`h-full transition-all duration-1000 ease-linear rounded-full ${
            lightMode
              ? timeLeft.percentage < 20
                ? "bg-rose-500"
                : "bg-blue-600"
              : timeLeft.percentage < 20
                ? "bg-rose-400"
                : "bg-emerald-300"
          }`}
          style={{ width: `${timeLeft.percentage}%` }}
        />
      </div>
    </div>
  );
}
