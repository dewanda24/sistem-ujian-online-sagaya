"use client";

import { useEffect, useRef, useState } from "react";
import { X, Lightbulb, Filter } from "lucide-react";
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

type FilterMode = "all" | "unanswered" | "flagged";

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
  const [filterMode, setFilterMode] = useState<FilterMode>("all");

  useEffect(() => {
    if (isOpen) {
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
      // Reset filter when closed
      setTimeout(() => setFilterMode("all"), 300);
    }
  }, [isOpen]);

  const answeredCount = questions.filter(({ question }) =>
    isAnswered(question.id)
  ).length;
  const flaggedCount = questions.filter(({ question }) =>
    isFlagged(question.id)
  ).length;
  const unansweredCount = questions.length - answeredCount;

  const filteredQuestions = questions.map((q, index) => ({ q, index })).filter(({ q }) => {
    if (filterMode === "unanswered") return !isAnswered(q.question.id);
    if (filterMode === "flagged") return isFlagged(q.question.id);
    return true;
  });

  return (
    <dialog
      ref={dialogRef}
      onCancel={onClose}
      className="m-0 mt-auto sm:m-auto w-full sm:w-[calc(100vw-2rem)] max-w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl border border-slate-200 bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-black/60 backdrop:backdrop-blur-xs animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200"
    >
      {/* Mobile drag indicator */}
      <div className="flex justify-center pt-3 pb-1 sm:hidden">
        <div className="h-1.5 w-12 rounded-full bg-slate-200"></div>
      </div>

      <div className="flex max-h-[85vh] sm:max-h-[80vh] flex-col p-4 sm:p-6 pt-2 sm:pt-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-950">
              Daftar Soal
            </h2>
            <p className="text-[13px] text-slate-500 mt-0.5">
              Klik nomor untuk berpindah soal secara cepat.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100 active:scale-90 transition-all"
            aria-label="Tutup daftar soal"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* 4-Color Status Legend (TERMIN 7.3 & 7.6) */}
        <div className="grid grid-cols-2 gap-2 py-3 sm:grid-cols-4 text-xs font-semibold">
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

        {/* Quick Filters */}
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-2 overflow-x-auto no-scrollbar">
          <Filter className="size-3.5 text-slate-400 shrink-0 ml-1" />
          <button
            type="button"
            onClick={() => setFilterMode("all")}
            className={cn(
              "whitespace-nowrap px-3 py-1.5 rounded-full text-[13px] font-bold transition-all",
              filterMode === "all" ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            Semua
          </button>
          <button
            type="button"
            onClick={() => setFilterMode("unanswered")}
            className={cn(
              "whitespace-nowrap px-3 py-1.5 rounded-full text-[13px] font-bold transition-all",
              filterMode === "unanswered" ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            Belum Dijawab
          </button>
          <button
            type="button"
            onClick={() => setFilterMode("flagged")}
            className={cn(
              "whitespace-nowrap px-3 py-1.5 rounded-full text-[13px] font-bold transition-all",
              filterMode === "flagged" ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            Ragu-ragu
          </button>
        </div>

        {/* Grid Nomor Soal (5 Kolom on mobile, 6/8 on desktop) */}
        <div className="flex-1 overflow-y-auto py-2 pr-1 min-h-[150px]">
          {filteredQuestions.length > 0 ? (
            <div className="grid grid-cols-5 gap-2.5 sm:grid-cols-6 md:grid-cols-8">
              {filteredQuestions.map(({ q, index }) => {
                const active = index === activeIndex;
                const answered = isAnswered(q.question.id);
                const flagged = isFlagged(q.question.id);

                return (
                  <button
                    key={`palette-item-${q.question.id}`}
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
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-slate-400">
              <Filter className="size-8 mb-2 opacity-20" />
              <p className="text-[13px] font-medium text-center">Tidak ada soal yang cocok dengan filter ini.</p>
            </div>
          )}
        </div>

        {/* Footer Button: Tutup */}
        <div className="pt-3.5 border-t border-slate-100 mt-2 pb-2 sm:pb-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full h-12 rounded-2xl border border-slate-300 bg-white font-bold text-sm text-slate-700 hover:bg-slate-50 active:scale-95 transition-all shadow-sm"
          >
            Tutup
          </button>
        </div>
      </div>
    </dialog>
  );
}
