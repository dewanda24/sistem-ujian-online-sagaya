"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  Wifi,
  WifiOff,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  X,
  Database,
  CloudCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface ExamConnectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  isOnline: boolean;
  pendingSaveCount: number;
  failedSaveCount: number;
  lastSavedAt?: string | null;
  onRetrySyncAll?: () => void;
}

export function ExamConnectionDialog({
  isOpen,
  onClose,
  isOnline,
  pendingSaveCount,
  failedSaveCount,
  lastSavedAt,
  onRetrySyncAll,
}: ExamConnectionDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [isPinging, setIsPinging] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (isOpen) {
      dialogRef.current?.showModal();
      void checkPing();
    } else {
      dialogRef.current?.close();
    }
  }, [isOpen]);

  const checkPing = async () => {
    if (!navigator.onLine) {
      setLatencyMs(null);
      return;
    }

    setIsPinging(true);
    const start = performance.now();
    try {
      await fetch(`/api/exam-heartbeat?t=${Date.now()}`, {
        method: "HEAD",
        cache: "no-store",
      });
      const end = performance.now();
      setLatencyMs(Math.round(end - start));
    } catch {
      setLatencyMs(null);
    } finally {
      setIsPinging(false);
    }
  };

  const getLatencyQuality = (ms: number | null) => {
    if (ms === null) return { text: "Terputus", color: "text-red-600 bg-red-50 border-red-200" };
    if (ms < 150) return { text: "Sangat Cepat", color: "text-emerald-700 bg-emerald-50 border-emerald-200" };
    if (ms < 400) return { text: "Stabil", color: "text-blue-700 bg-blue-50 border-blue-200" };
    return { text: "Koneksi Lemah", color: "text-amber-700 bg-amber-50 border-amber-200" };
  };

  const quality = getLatencyQuality(latencyMs);

  return (
    <dialog
      ref={dialogRef}
      onCancel={onClose}
      className="w-[calc(100vw-2rem)] max-w-md rounded-3xl border border-slate-200 bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-black/60 backdrop:backdrop-blur-xs animate-in fade-in zoom-in-95 duration-150"
    >
      <div className="flex flex-col p-5 sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
          <div className="flex items-center gap-2">
            <Wifi className="size-5 text-blue-600" />
            <h2 className="text-base sm:text-lg font-bold text-slate-950">
              Diagnostik Jaringan & Sinkronisasi
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100 active:scale-90 transition-all"
            aria-label="Tutup diagnostik"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Content Status Cards */}
        <div className="space-y-3 py-4">
          {/* Card 1: Internet Status & Ping */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isOnline ? (
                  <Wifi className="size-5 text-emerald-600" />
                ) : (
                  <WifiOff className="size-5 text-red-600" />
                )}
                <div>
                  <p className="text-xs font-bold text-slate-900">Status Internet</p>
                  <p className="text-[11px] text-slate-500">
                    {isOnline ? "Tersambung ke internet" : "Tidak ada koneksi internet"}
                  </p>
                </div>
              </div>
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs font-bold border",
                  quality.color
                )}
              >
                {quality.text}
              </span>
            </div>

            <div className="flex items-center justify-between border-t border-slate-200/80 pt-2 text-xs">
              <span className="text-slate-600">Kecepatan Respon (Ping):</span>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900">
                  {latencyMs !== null ? `${latencyMs} ms` : "-"}
                </span>
                <button
                  type="button"
                  onClick={() => startTransition(checkPing)}
                  disabled={isPinging}
                  className="rounded-lg p-1 text-blue-600 hover:bg-blue-50 active:scale-90 transition-all"
                  title="Tes Ulang Ping"
                >
                  <RefreshCw
                    className={cn("size-3.5", isPinging && "animate-spin text-blue-600")}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Card 2: Sync Status */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-700">
                <Database className="size-4 text-blue-600" />
                <span className="font-semibold">Antrean Simpan Tertunda:</span>
              </div>
              <span
                className={cn(
                  "font-black text-sm",
                  failedSaveCount > 0
                    ? "text-red-600"
                    : pendingSaveCount > 0
                    ? "text-amber-600"
                    : "text-emerald-600"
                )}
              >
                {failedSaveCount + pendingSaveCount} Soal
              </span>
            </div>

            {lastSavedAt && (
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                <span>Terakhir tersimpan di server:</span>
                <span className="font-medium text-slate-700">{lastSavedAt}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Button if any errors */}
        {failedSaveCount > 0 && onRetrySyncAll && (
          <div className="mb-3">
            <button
              type="button"
              onClick={() => {
                onRetrySyncAll();
                void checkPing();
              }}
              className="flex w-full h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 font-bold text-sm text-white shadow-sm hover:bg-blue-700 active:scale-98 transition-all"
            >
              <RefreshCw className="size-4" />
              <span>Simpan Ulang Semua Jawaban Tertunda</span>
            </button>
          </div>
        )}

        {/* Footer Button */}
        <div className="pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="w-full h-11 rounded-xl border border-slate-300 bg-white font-bold text-sm text-slate-700 hover:bg-slate-50 active:scale-98 transition-all"
          >
            Tutup
          </button>
        </div>
      </div>
    </dialog>
  );
}
