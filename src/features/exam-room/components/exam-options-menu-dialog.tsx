"use client";

import { useEffect, useRef } from "react";
import {
  Bookmark,
  Trash2,
  Info,
  Wifi,
  LogOut,
  X,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface ExamOptionsMenuDialogProps {
  isOpen: boolean;
  onClose: () => void;
  isCurrentFlagged: boolean;
  hasAnswer: boolean;
  isReadOnly?: boolean;
  onToggleFlag: () => void;
  onClearAnswer: () => void;
  onOpenInfo: () => void;
  onOpenConnection: () => void;
  onOpenSubmit: () => void;
}

export function ExamOptionsMenuDialog({
  isOpen,
  onClose,
  isCurrentFlagged,
  hasAnswer,
  isReadOnly,
  onToggleFlag,
  onClearAnswer,
  onOpenInfo,
  onOpenConnection,
  onOpenSubmit,
}: ExamOptionsMenuDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (isOpen) {
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [isOpen]);

  return (
    <dialog
      ref={dialogRef}
      onCancel={onClose}
      className="w-[calc(100vw-2rem)] max-w-sm rounded-3xl border border-slate-200 bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-black/60 backdrop:backdrop-blur-xs animate-in fade-in zoom-in-95 duration-150"
    >
      <div className="flex flex-col p-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-base font-bold text-slate-900">Menu Opsi</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100 active:scale-90 transition-all"
            aria-label="Tutup menu"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Menu Items List */}
        <div className="divide-y divide-slate-100 py-2">
          {/* 1. Tandai Ragu-Ragu */}
          <button
            type="button"
            onClick={() => {
              onToggleFlag();
              onClose();
            }}
            className={cn(
              "flex w-full items-center justify-between py-3 px-2 rounded-xl text-left text-sm font-semibold transition-all active:scale-98 hover:bg-slate-50",
              isCurrentFlagged ? "text-amber-700 bg-amber-50/70" : "text-slate-800"
            )}
          >
            <div className="flex items-center gap-3">
              <Bookmark
                className={cn(
                  "size-5",
                  isCurrentFlagged
                    ? "fill-amber-500 text-amber-600"
                    : "text-slate-600"
                )}
              />
              <span>Tandai Ragu-ragu</span>
            </div>
            {isCurrentFlagged && (
              <span className="flex size-5 items-center justify-center rounded-full bg-amber-500 text-white text-xs font-bold">
                <Check className="size-3" />
              </span>
            )}
          </button>

          {/* 2. Hapus Jawaban */}
          <button
            type="button"
            disabled={!hasAnswer || isReadOnly}
            onClick={() => {
              onClearAnswer();
              onClose();
            }}
            className="flex w-full items-center gap-3 py-3 px-2 rounded-xl text-left text-sm font-semibold text-slate-800 transition-all active:scale-98 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Trash2 className="size-5 text-slate-600" />
            <span>Hapus Jawaban</span>
          </button>

          {/* 3. Informasi Soal (Detail) */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenInfo();
            }}
            className="flex w-full items-center gap-3 py-3 px-2 rounded-xl text-left text-sm font-semibold text-slate-800 transition-all active:scale-98 hover:bg-slate-50"
          >
            <Info className="size-5 text-slate-600" />
            <span>Informasi Soal</span>
          </button>

          {/* 4. Periksa Koneksi */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenConnection();
            }}
            className="flex w-full items-center gap-3 py-3 px-2 rounded-xl text-left text-sm font-semibold text-slate-800 transition-all active:scale-98 hover:bg-slate-50"
          >
            <Wifi className="size-5 text-slate-600" />
            <span>Periksa Koneksi</span>
          </button>

          {/* 5. Keluar / Kumpulkan Ujian */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenSubmit();
            }}
            className="flex w-full items-center gap-3 py-3 px-2 rounded-xl text-left text-sm font-bold text-red-600 transition-all active:scale-98 hover:bg-red-50"
          >
            <LogOut className="size-5 text-red-600" />
            <span>Keluar / Kumpulkan Ujian</span>
          </button>
        </div>

        {/* Footer Button: Tutup */}
        <div className="pt-3 border-t border-slate-100">
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
