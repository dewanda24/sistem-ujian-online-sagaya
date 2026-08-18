"use client";

import { useEffect, useRef } from "react";
import {
  BookOpen,
  FileText,
  GraduationCap,
  LayoutGrid,
  Clock,
  Award,
  CheckCircle2,
  User,
  Calendar,
  AlertTriangle,
  X,
} from "lucide-react";

export interface ExamInfoDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  subjectName: string;
  examType: string;
  className?: string | null;
  totalQuestions: number;
  durationMinutes: number;
  maxScore?: number;
  passingGrade?: number;
  creatorName?: string | null;
  startAt?: string | null;
  endAt?: string | null;
}

export function ExamInfoDetailDialog({
  isOpen,
  onClose,
  subjectName,
  examType,
  className = "9A",
  totalQuestions,
  durationMinutes,
  maxScore = 100,
  passingGrade = 70,
  creatorName = "Guru Pengampu",
  startAt,
  endAt,
}: ExamInfoDetailDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (isOpen) {
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [isOpen]);

  const items = [
    {
      icon: BookOpen,
      label: "Mata Pelajaran",
      value: subjectName || "Matematika",
    },
    {
      icon: FileText,
      label: "Jenis Ujian",
      value: examType || "Sumatif Tengah Semester",
    },
    {
      icon: GraduationCap,
      label: "Kelas",
      value: className || "Semua Kelas",
    },
    {
      icon: LayoutGrid,
      label: "Jumlah Soal",
      value: `${totalQuestions} Soal`,
    },
    {
      icon: Clock,
      label: "Waktu Ujian",
      value: `${durationMinutes} Menit`,
    },
    {
      icon: Award,
      label: "Nilai Maksimal",
      value: String(maxScore),
    },
    {
      icon: CheckCircle2,
      label: "Passing Grade (KKM)",
      value: String(passingGrade),
    },
    {
      icon: User,
      label: "Pembuat Ujian",
      value: creatorName || "Guru Mata Pelajaran",
    },
    ...(startAt
      ? [
          {
            icon: Calendar,
            label: "Tersedia Mulai",
            value: startAt,
          },
        ]
      : []),
    ...(endAt
      ? [
          {
            icon: Calendar,
            label: "Tersedia Sampai",
            value: endAt,
          },
        ]
      : []),
  ];

  return (
    <dialog
      ref={dialogRef}
      onCancel={onClose}
      className="w-[calc(100vw-2rem)] max-w-md rounded-3xl border border-slate-200 bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-black/60 backdrop:backdrop-blur-xs animate-in fade-in zoom-in-95 duration-150"
    >
      <div className="flex max-h-[85vh] flex-col p-5 sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
          <h2 className="text-base sm:text-lg font-bold text-slate-950">
            Informasi Soal
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100 active:scale-90 transition-all"
            aria-label="Tutup informasi soal"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* List of Details */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 py-2">
          {items.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={`info-${index}`}
                className="flex items-center justify-between py-2.5 px-1 text-xs sm:text-sm"
              >
                <div className="flex items-center gap-2.5 text-slate-600">
                  <Icon className="size-4 shrink-0 text-blue-600" />
                  <span className="font-medium">{item.label}</span>
                </div>
                <span className="font-bold text-slate-900 text-right">
                  {item.value}
                </span>
              </div>
            );
          })}
        </div>

        {/* Warning Callout Box */}
        <div className="mt-3 flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900">
          <AlertTriangle className="size-4 shrink-0 text-amber-600 mt-0.5" />
          <div>
            <p className="font-bold text-amber-950">Perhatian</p>
            <p className="mt-0.5 leading-relaxed text-amber-800">
              Pastikan kamu memiliki koneksi internet yang stabil selama ujian berlangsung.
            </p>
          </div>
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
