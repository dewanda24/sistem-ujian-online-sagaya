"use client";

import { useEffect, useRef } from "react";
import { X, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ExamQuestionPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: Array<{
    question: {
      id: string;
    };
  }>;
  activeIndex: number;
  onSelectIndex: (index: number) => void;
  isAnswered: (questionId: string) => boolean;
  isFlagged: (questionId: string) => boolean;
}

export function ExamQuestionPaletteModal({
  isOpen,
  onClose,
  questions,
  activeIndex,
  onSelectIndex,
  isAnswered,
  isFlagged,
}: ExamQuestionPaletteModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (isOpen) {
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [isOpen]);

  const answeredCount = questions.filter(({ question }) =>
    isAnswered(question.id)
  ).length;
  const flaggedCount = questions.filter(({ question }) =>
    isFlagged(question.id)
  ).length;
  const unansweredCount = questions.length - answeredCount;

  return (
    <dialog
      ref={dialogRef}
      onCancel={onClose}
      className="w-[calc(100vw-2rem)] max-w-lg rounded-3xl border border-slate-200 bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-black/60 backdrop:backdrop-blur-xs animate-in fade-in zoom-in-95 duration-150"
    >
      <div className="flex max-h-[85vh] flex-col p-5 sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-950">
              Daftar Soal
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Klik nomor untuk berpindah soal secara cepat.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100 active:scale-90 transition-all"
            aria-label="Tutup daftar soal"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* 4-Color Status Legend (TERMIN 7.3 & 7.6) */}
        <div className="grid grid-cols-2 gap-2 py-3 border-b border-slate-100 sm:grid-cols-4 text-xs font-semibold">
          <div className="flex items-center gap-2 text-slate-700">
            <span className="size-3.5 rounded-full bg-emerald-500 shrink-0 shadow-2xs" />
            <span>Sudah Dijawab ({answeredCount})</span>
          </div>
          <div className="flex items-center gap-2 text-slate-700">
            <span className="size-3.5 rounded-full bg-blue-600 shrink-0 shadow-2xs" />
            <span>Sedang Dikerjakan</span>
          </div>
          <div className="flex items-center gap-2 text-slate-700">
            <span className="size-3.5 rounded-full bg-amber-400 shrink-0 shadow-2xs" />
            <span>Ragu-ragu ({flaggedCount})</span>
          </div>
          <div className="flex items-center gap-2 text-slate-700">
            <span className="size-3.5 rounded-full border border-slate-300 bg-white shrink-0 shadow-2xs" />
            <span>Belum Dijawab ({unansweredCount})</span>
          </div>
        </div>

        {/* Grid Nomor Soal (5 Kolom) */}
        <div className="flex-1 overflow-y-auto py-4 pr-1">
          <div className="grid grid-cols-5 gap-2.5 sm:grid-cols-6 md:grid-cols-8">
            {questions.map(({ question }, index) => {
              const active = index === activeIndex;
              const answered = isAnswered(question.id);
              const flagged = isFlagged(question.id);

              return (
                <button
                  key={`palette-item-${question.id}`}
                  type="button"
                  onClick={() => {
                    onSelectIndex(index);
                    onClose();
                  }}
                  className={cn(
                    "relative flex aspect-square items-center justify-center rounded-2xl border text-sm font-bold transition-all select-none active:scale-90",
                    active &&
                      "border-blue-600 bg-blue-600 text-white shadow-md ring-2 ring-blue-300",
                    !active &&
                      flagged &&
                      "border-amber-400 bg-amber-400 text-amber-950 font-black shadow-xs",
                    !active &&
                      !flagged &&
                      answered &&
                      "border-emerald-500 bg-emerald-500 text-white font-bold shadow-xs",
                    !active &&
                      !flagged &&
                      !answered &&
                      "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                  )}
                  aria-label={`Buka soal nomor ${index + 1}`}
                >
                  <span>{index + 1}</span>
                  {flagged && !active && (
                    <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-amber-900 text-[9px] font-black text-white">
                      ?
                    </span>
                  )}
                  {answered && !flagged && !active && (
                    <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-emerald-700 text-[9px] font-black text-white">
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tips Callout Banner (7.6) */}
        <div className="flex items-center gap-2 rounded-2xl bg-blue-50/80 border border-blue-200/80 p-3 text-xs text-blue-900">
          <Lightbulb className="size-4 shrink-0 text-blue-600" />
          <p className="font-medium">
            <strong>Tips:</strong> Klik nomor soal untuk langsung melompat ke soal tersebut.
          </p>
        </div>

        {/* Footer Button: Tutup */}
        <div className="pt-3.5 border-t border-slate-100 mt-3">
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
