"use client";

import {
  Bookmark,
  CloudCheck,
  Clock,
  Wifi,
  LogOut,
  CheckCircle2,
  BookOpen,
  Smile,
  ShieldAlert,
  Sparkles,
  ClipboardCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface ExamQuickInfoSectionProps {
  remainingSeconds: number;
  isOnline: boolean;
  onOpenSubmitConfirm: () => void;
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

export function ExamQuickInfoSection({
  remainingSeconds,
  isOnline,
  onOpenSubmitConfirm,
}: ExamQuickInfoSectionProps) {
  return (
    <div className="space-y-4 pt-2">
      {/* 7.9 Interaksi Penting Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {/* 1. Tandai Ragu-ragu */}
        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
              <Bookmark className="size-4.5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Tandai Ragu-ragu</p>
              <p className="text-[11px] text-slate-500">Tandai soal untuk ditinjau nanti</p>
            </div>
          </div>
          <span className="rounded-lg bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-800 border border-amber-300">
            Ragu-ragu
          </span>
        </div>

        {/* 2. Simpan Otomatis */}
        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
              <ClipboardCheck className="size-4.5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Simpan Otomatis</p>
              <p className="text-[11px] text-slate-500">Jawaban tersimpan tiap detik</p>
            </div>
          </div>
          <span className="rounded-lg bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-800 border border-emerald-300">
            Otomatis
          </span>
        </div>

        {/* 3. Waktu Ujian */}
        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
              <Clock className="size-4.5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Waktu Ujian</p>
              <p className="text-[11px] text-slate-500">Jangan sampai terlambat</p>
            </div>
          </div>
          <span className="rounded-lg bg-blue-100 px-2.5 py-1 text-[11px] font-black text-blue-800 border border-blue-300 tabular-nums">
            {formatRemainingTime(remainingSeconds)}
          </span>
        </div>

        {/* 4. Koneksi Internet */}
        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
              <Wifi className="size-4.5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Koneksi Internet</p>
              <p className="text-[11px] text-slate-500">Pastikan koneksi stabil</p>
            </div>
          </div>
          <span
            className={cn(
              "rounded-lg px-2.5 py-1 text-[11px] font-bold border",
              isOnline
                ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                : "bg-red-100 text-red-800 border-red-300"
            )}
          >
            {isOnline ? "Stabil" : "Terputus"}
          </span>
        </div>

        {/* 5. Keluar Ujian */}
        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-red-50 text-red-600 border border-red-200">
              <LogOut className="size-4.5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Keluar Ujian</p>
              <p className="text-[11px] text-slate-500">Ujian otomatis berakhir jika keluar</p>
            </div>
          </div>
          <span className="rounded-lg bg-red-100 px-2.5 py-1 text-[11px] font-bold text-red-800 border border-red-300">
            Dilarang
          </span>
        </div>

        {/* 6. Periksa Kembali */}
        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
              <CheckCircle2 className="size-4.5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Periksa Kembali</p>
              <p className="text-[11px] text-slate-500">Cek sebelum kumpulkan</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenSubmitConfirm}
            className="rounded-lg bg-blue-600 px-3 py-1 text-[11px] font-bold text-white shadow-2xs hover:bg-blue-700 active:scale-95 transition-all"
          >
            Periksa
          </button>
        </div>
      </div>

      {/* 7.10 Tips Sukses Section */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="size-4 text-blue-600" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Tips Sukses Mengerjakan Ujian
          </h3>
        </div>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-5 text-xs">
          <div className="flex items-start gap-2 rounded-xl bg-white p-2.5 border border-slate-200/80">
            <BookOpen className="size-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-slate-900 font-bold">Baca Teliti</strong>
              <span className="text-slate-500 text-[11px]">Pahami pertanyaan sebelum menjawab.</span>
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-xl bg-white p-2.5 border border-slate-200/80">
            <Smile className="size-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-slate-900 font-bold">Kerjakan Mudah</strong>
              <span className="text-slate-500 text-[11px]">Selesaikan soal yang mudah dahulu.</span>
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-xl bg-white p-2.5 border border-slate-200/80">
            <Clock className="size-4 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-slate-900 font-bold">Atur Waktu</strong>
              <span className="text-slate-500 text-[11px]">Bagi waktu pengerjaan dengan cermat.</span>
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-xl bg-white p-2.5 border border-slate-200/80">
            <CheckCircle2 className="size-4 text-teal-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-slate-900 font-bold">Cek Jawaban</strong>
              <span className="text-slate-500 text-[11px]">Periksa kembali sebelum kumpul.</span>
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-xl bg-white p-2.5 border border-slate-200/80">
            <Sparkles className="size-4 text-purple-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-slate-900 font-bold">Tetap Tenang</strong>
              <span className="text-slate-500 text-[11px]">Percaya diri, kamu pasti bisa!</span>
            </div>
          </div>
        </div>
      </div>

      {/* Security Guard Reminder (Bottom) */}
      <div className="flex items-center justify-center gap-2 rounded-2xl border border-blue-200/80 bg-blue-50/70 p-3 text-xs text-blue-900">
        <ShieldAlert className="size-4 shrink-0 text-blue-600" />
        <p className="font-medium text-center">
          <strong>Ingat:</strong> Jangan refresh halaman dan jangan keluar dari aplikasi selama ujian berlangsung.
        </p>
      </div>
    </div>
  );
}
