"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function MonitoringAutoRefresh({
  intervalSeconds = 15,
}: {
  intervalSeconds?: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [lastUpdatedAt, setLastUpdatedAt] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => {
      startTransition(() => {
        router.refresh();
        setLastUpdatedAt(new Date());
      });
    }, intervalSeconds * 1000);

    return () => window.clearInterval(timer);
  }, [intervalSeconds, router]);

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-card px-4 py-3 text-xs text-muted-foreground">
      <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
      <span>Auto-refresh aktif setiap {intervalSeconds} detik</span>
      <span className="hidden sm:inline">|</span>
      <span>
        Terakhir diperbarui:{" "}
        {lastUpdatedAt.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })}
      </span>
      {isPending ? <span className="font-medium">Memuat data terbaru...</span> : null}
    </div>
  );
}
