"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SkipForward } from "lucide-react";
import { SubmitButton } from "@/components/dashboard/submit-button";
import { gradeEssayAnswerAction } from "@/features/results/actions";

type RapidGradingFormProps = {
  attemptId: string;
  answerId: string;
  maxScore: number;
  returnTo: string;
  skipUrl: string;
  remainingCount: number;
};

export function RapidGradingForm({
  attemptId,
  answerId,
  maxScore,
  returnTo,
  skipUrl,
  remainingCount,
}: RapidGradingFormProps) {
  const [score, setScore] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Presets: 0, 25%, 50%, 75%, Max
  const presets = [
    { label: "0", val: 0 },
    { label: "25%", val: Number((maxScore * 0.25).toFixed(1)) },
    { label: "50%", val: Number((maxScore * 0.5).toFixed(1)) },
    { label: "75%", val: Number((maxScore * 0.75).toFixed(1)) },
    { label: "Maks", val: maxScore },
  ];

  // Auto focus input on mount or when answer changes
  useEffect(() => {
    setScore("");
    setNote("");
    inputRef.current?.focus();
  }, [answerId]);

  // Keyboard shortcut: Alt+S to skip, Alt+1..5 for score presets
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === "s" || e.key === "S")) {
        e.preventDefault();
        router.push(skipUrl);
        return;
      }

      if (e.altKey) {
        const num = parseInt(e.key, 10);
        if (num >= 1 && num <= 5) {
          e.preventDefault();
          const targetPreset = presets[num - 1];
          if (targetPreset) {
            setScore(String(targetPreset.val));
            inputRef.current?.focus();
          }
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [skipUrl, router, maxScore]);

  return (
    <div className="rounded-2xl border border-blue-200/80 bg-blue-50/70 p-4 sm:p-6 space-y-4">
      <form action={gradeEssayAnswerAction} className="space-y-4">
        <input type="hidden" name="attempt_id" value={attemptId} />
        <input type="hidden" name="answer_id" value={answerId} />
        <input type="hidden" name="max_score" value={maxScore} />
        <input type="hidden" name="return_to" value={returnTo} />

        <div className="space-y-4">
          {/* Score Input & Presets */}
          <div>
            <label className="mb-2 block text-xs font-bold text-blue-900 uppercase tracking-wider">
              Beri Skor (Maksimum: {maxScore} Poin)
            </label>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="sm:w-48">
                <input
                  ref={inputRef}
                  id="awarded_score_input"
                  name="awarded_score"
                  type="number"
                  min="0"
                  max={maxScore}
                  step="0.01"
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                  placeholder={`0 - ${maxScore}`}
                  className="h-12 w-full rounded-xl border border-blue-300 bg-white px-4 text-xl font-black text-blue-950 placeholder:text-blue-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-600 outline-none transition shadow-2xs"
                  required
                />
              </div>

              {/* Presets */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-bold text-blue-800 uppercase mr-1">
                  Preset Cepat:
                </span>
                {presets.map((preset, idx) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setScore(String(preset.val));
                      inputRef.current?.focus();
                    }}
                    title={`Pilih nilai ${preset.val} (Alt+${idx + 1})`}
                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-blue-200 bg-white px-2.5 text-xs font-bold text-blue-700 shadow-2xs hover:bg-blue-100 active:scale-95 transition"
                  >
                    <span>{preset.label} ({preset.val})</span>
                    <kbd className="hidden sm:inline-block rounded bg-blue-100/80 px-1 py-0.5 text-[9px] font-semibold text-blue-600">
                      Alt+{idx + 1}
                    </kbd>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Teacher Note / Feedback */}
          <div>
            <label
              htmlFor="teacher_note_input"
              className="mb-1.5 block text-xs font-semibold text-slate-700"
            >
              Catatan / Feedback untuk Siswa (Opsional)
            </label>
            <textarea
              id="teacher_note_input"
              name="teacher_note"
              rows={2}
              maxLength={500}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Contoh: Penjelasan sudah tepat, namun langkah pembuktian di baris kedua masih kurang lengkap."
              className="w-full rounded-xl border border-blue-200/90 bg-white p-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600 outline-none transition resize-none shadow-2xs"
            />
            <div className="mt-1 flex justify-between text-[11px] text-slate-400">
              <span>Feedback akan terlihat oleh siswa saat melihat hasil ujian</span>
              <span>{note.length}/500</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2 border-t border-blue-100">
            <div className="flex items-center gap-2">
              <Link
                href={skipUrl}
                className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 active:scale-95 transition"
                title="Lewati jawaban ini untuk dinilai nanti (Alt + S)"
              >
                <SkipForward className="size-4 text-slate-500" />
                <span>Lewati & Lanjut</span>
                <span className="text-slate-400 text-xs font-normal hidden sm:inline">
                  (Alt+S)
                </span>
              </Link>
            </div>

            <SubmitButton
              loadingText="Menyimpan Nilai..."
              className="h-11 w-full sm:w-auto rounded-xl bg-blue-600 px-8 font-bold text-white shadow-sm transition hover:bg-blue-700 active:scale-95 flex justify-center items-center gap-2"
            >
              <span>Simpan & Lanjut</span>
              <span className="text-blue-200 text-xs font-normal hidden sm:inline">
                (Enter)
              </span>
            </SubmitButton>
          </div>
        </div>
      </form>
    </div>
  );
}
