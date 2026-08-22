"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

export function LiveMonitoringRefresher() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [intervalSeconds, setIntervalSeconds] = useState<number>(15);
  const [countdown, setCountdown] = useState<number>(15);

  useEffect(() => {
    if (intervalSeconds <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          startTransition(() => {
            router.refresh();
          });
          return intervalSeconds;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [intervalSeconds, router]);

  const handleIntervalChange = (newInterval: number) => {
    setIntervalSeconds(newInterval);
    setCountdown(newInterval > 0 ? newInterval : 0);
  };

  const handleManualRefresh = () => {
    setCountdown(intervalSeconds > 0 ? intervalSeconds : 0);
    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/80 bg-card p-3 shadow-xs">
      <div className="flex items-center gap-2.5">
        <span className="relative flex h-3 w-3">
          {intervalSeconds > 0 ? (
            <>
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
            </>
          ) : (
            <span className="relative inline-flex h-3 w-3 rounded-full bg-muted-foreground/50" />
          )}
        </span>
        <div className="text-xs font-medium">
          {intervalSeconds > 0 ? (
            <span className="text-foreground">
              Live Monitoring Aktif{" "}
              <span className="text-muted-foreground">({countdown}s)</span>
            </span>
          ) : (
            <span className="text-muted-foreground">Auto-refresh Nonaktif</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>Interval:</span>
          <select
            value={intervalSeconds}
            onChange={(e) => handleIntervalChange(Number(e.target.value))}
            className="rounded-md border border-input bg-background px-2 py-1 text-xs font-medium shadow-2xs focus:outline-hidden focus:ring-1 focus:ring-ring"
          >
            <option value={10}>10 detik</option>
            <option value={15}>15 detik</option>
            <option value={30}>30 detik</option>
            <option value={60}>60 detik</option>
            <option value={0}>Manual / Mati</option>
          </select>
        </label>

        <button
          type="button"
          onClick={handleManualRefresh}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-2.5 py-1 text-xs font-medium text-foreground shadow-2xs hover:bg-muted focus:outline-hidden disabled:opacity-50"
        >
          <RefreshCw className={`h-3 w-3 ${isPending ? "animate-spin text-primary" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>
    </div>
  );
}
