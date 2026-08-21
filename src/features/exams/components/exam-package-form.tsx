"use client";

import { useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Check,
  CheckCircle2,
  Clock,
  Dices,
  Eye,
  Image as ImageIcon,
  Layers,
  ListOrdered,
  Loader2,
  Plus,
  RotateCcw,
  Save,
  Search,
  Send,
  Sliders,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";

import { saveExamPackageAction } from "@/features/exams/actions";
import { QuestionMathRenderer } from "@/features/question-bank/components/question-math-renderer";
import { QuestionMediaPreview } from "@/features/question-bank/components/question-media-preview";
import { cn } from "@/lib/utils";

type SubjectOption = {
  value: string;
  label: string;
};

type QuestionAttachment = {
  id: string;
  media_type: string;
  url: string;
  file_name?: string | null;
  caption?: string | null;
  order_number: number;
};

type QuestionOptionItem = {
  id: string;
  option_label: string;
  option_text: string;
  is_correct: boolean;
  order_number: number;
};

type QuestionStimulus = {
  id?: string | null;
  title?: string | null;
  content?: string | null;
  media_url?: string | null;
  media_type?: string | null;
};

type QuestionOption = {
  id: string;
  content: string | null;
  point: number | string | null;
  type: string | null;
  difficulty?: string | null;
  explanation?: string | null;
  subject_id: string | null;
  subjects?: { code?: string | null; name?: string | null } | Array<{ code?: string | null; name?: string | null }> | null;
  question_categories?: { id?: string | null; name?: string | null } | Array<{ id?: string | null; name?: string | null }> | null;
  question_attachments?: QuestionAttachment[] | null;
  question_options?: QuestionOptionItem[] | null;
  question_stimuli?: QuestionStimulus | QuestionStimulus[] | null;
};

type EditablePackage = {
  id?: string | null;
  title?: string | null;
  description?: string | null;
  subject_id?: string | null;
  duration_minutes?: number | string | null;
  status?: string | null;
  shuffle_questions?: boolean | null;
  shuffle_options?: boolean | null;
  show_result?: boolean | null;
  is_active?: boolean | null;
};

type ExamPackageFormProps = {
  editable?: EditablePackage | null;
  schoolId: string;
  subjects: SubjectOption[];
  questions: QuestionOption[];
  selectedQuestionIds: string[];
  defaultSubjectId?: string;
};

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

export function ExamPackageForm({
  editable,
  schoolId,
  subjects,
  questions,
  selectedQuestionIds,
  defaultSubjectId,
}: ExamPackageFormProps) {
  const [activeTab, setActiveTab] = useState<"all" | "selected">("all");
  const [title, setTitle] = useState(editable?.title ?? "");
  const [description, setDescription] = useState(editable?.description ?? "");
  const [subjectId, setSubjectId] = useState(
    editable?.subject_id ?? defaultSubjectId ?? subjects[0]?.value ?? "",
  );
  const [durationMinutes, setDurationMinutes] = useState(
    String(editable?.duration_minutes ?? 60),
  );
  const [status, setStatus] = useState(
    editable?.status === "published" ? "published" : "draft",
  );
  const [shuffleQuestions, setShuffleQuestions] = useState(
    Boolean(editable?.shuffle_questions ?? true),
  );
  const [shuffleOptions, setShuffleOptions] = useState(
    Boolean(editable?.shuffle_options ?? true),
  );
  const [showResult, setShowResult] = useState(Boolean(editable?.show_result));
  const [isActive, setIsActive] = useState(editable?.is_active ?? true);

  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>(selectedQuestionIds);
  const [previewQuestion, setPreviewQuestion] = useState<QuestionOption | null>(null);
  const [randomCount, setRandomCount] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const statusInputRef = useRef<HTMLInputElement>(null);

  const subjectQuestions = useMemo(
    () => questions.filter((question) => question.subject_id === subjectId),
    [questions, subjectId],
  );

  const categoryOptions = useMemo(() => {
    const map = new Map<string, string>();
    subjectQuestions.forEach((question) => {
      const category = firstRelation(question.question_categories);
      if (category?.id && category.name) {
        map.set(category.id, category.name);
      }
    });

    return Array.from(map.entries()).map(([value, label]) => ({
      value,
      label,
    }));
  }, [subjectQuestions]);

  const filteredQuestions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return subjectQuestions.filter((question) => {
      const category = firstRelation(question.question_categories);
      const matchQuery = normalizedQuery
        ? String(question.content ?? "").toLowerCase().includes(normalizedQuery)
        : true;
      const matchType = typeFilter ? question.type === typeFilter : true;
      const matchCategory = categoryFilter ? category?.id === categoryFilter : true;

      return matchQuery && matchType && matchCategory;
    });
  }, [categoryFilter, query, subjectQuestions, typeFilter]);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const selectedQuestions = useMemo(
    () => questions.filter((question) => selectedSet.has(question.id) && question.subject_id === subjectId),
    [questions, selectedSet, subjectId],
  );

  const totalPoints = useMemo(
    () => selectedQuestions.reduce((acc, q) => acc + Number(q.point ?? 0), 0),
    [selectedQuestions],
  );

  const allFilteredSelected =
    filteredQuestions.length > 0 &&
    filteredQuestions.every((question) => selectedSet.has(question.id));

  function toggleQuestion(id: string) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  function toggleFiltered() {
    setSelectedIds((current) => {
      const next = new Set(current);

      if (allFilteredSelected) {
        filteredQuestions.forEach((question) => next.delete(question.id));
      } else {
        filteredQuestions.forEach((question) => next.add(question.id));
      }

      return Array.from(next);
    });
  }

  function selectRandomQuestions() {
    const count = parseInt(randomCount, 10);
    if (isNaN(count) || count <= 0) return;
    const available = filteredQuestions.filter((q) => !selectedSet.has(q.id));
    const shuffled = [...available].sort(() => 0.5 - Math.random());
    const picked = shuffled.slice(0, count).map((q) => q.id);
    setSelectedIds((prev) => Array.from(new Set([...prev, ...picked])));
    setRandomCount("");
  }

  function clearCurrentSelection() {
    setSelectedIds((prev) =>
      prev.filter((id) => {
        const q = questions.find((item) => item.id === id);
        return q && q.subject_id !== subjectId;
      }),
    );
  }

  function validate() {
    const nextErrors: string[] = [];
    if (!title.trim()) nextErrors.push("Judul paket ujian wajib diisi.");
    if (!subjectId) nextErrors.push("Mata pelajaran wajib dipilih.");
    if (!Number(durationMinutes) || Number(durationMinutes) <= 0) {
      nextErrors.push("Durasi ujian wajib lebih dari 0 menit.");
    }
    if (selectedQuestions.length === 0) {
      nextErrors.push("Pilih minimal satu butir soal untuk paket ujian ini.");
    }

    setErrors(nextErrors);
    return nextErrors.length === 0;
  }

  return (
    <form
      action={saveExamPackageAction}
      className="space-y-6 pb-20"
      onSubmit={(event) => {
        if (!validate()) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={editable?.id ?? ""} />
      <input type="hidden" name="school_id" value={schoolId} />
      <input
        ref={statusInputRef}
        type="hidden"
        name="status"
        value={status}
      />
      <input
        type="hidden"
        name="shuffle_questions"
        value={shuffleQuestions ? "true" : "false"}
      />
      <input
        type="hidden"
        name="shuffle_options"
        value={shuffleOptions ? "true" : "false"}
      />
      <input
        type="hidden"
        name="show_result"
        value={showResult ? "true" : "false"}
      />
      <input
        type="hidden"
        name="is_active"
        value={isActive ? "true" : "false"}
      />

      {/* Hidden Inputs for Selected Questions */}
      {selectedQuestions.map((question) => (
        <input
          key={question.id}
          type="hidden"
          name="question_ids"
          value={question.id}
        />
      ))}

      {/* Validation Errors */}
      {errors.length > 0 ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800">
          <p className="font-bold">Mohon lengkapi formulir sebelum menyimpan:</p>
          <ul className="mt-1 list-disc pl-5 space-y-0.5">
            {errors.map((error, idx) => (
              <li key={idx}>{error}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* SECTION 1: INFORMASI & PENGATURAN PAKET */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-2xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Layers className="size-4.5" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Informasi Paket Ujian</h2>
              <p className="text-xs text-slate-500">Tentukan identitas dan pengaturan dasar pengerjaan paket.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="size-4 rounded text-blue-600 focus:ring-blue-500"
              />
              <span>Paket Aktif</span>
            </label>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2 space-y-1">
            <label className="text-xs font-bold text-slate-700">
              Judul Paket Ujian <span className="text-rose-500">*</span>
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              name="title"
              required
              placeholder="Contoh: PTS Matematika Wajib Kelas X - Semester Ganjil"
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">
              Mata Pelajaran <span className="text-rose-500">*</span>
            </label>
            <select
              value={subjectId}
              onChange={(e) => {
                setSubjectId(e.target.value);
                setCategoryFilter("");
              }}
              name="subject_id"
              required
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
            >
              {subjects.map((subject) => (
                <option key={subject.value} value={subject.value}>
                  {subject.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">
              Durasi Ujian (Menit) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Clock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                type="number"
                min="1"
                max="600"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                name="duration_minutes"
                required
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
              />
            </div>
          </div>

          <div className="sm:col-span-2 space-y-1">
            <label className="text-xs font-bold text-slate-700">Deskripsi / Petunjuk Ujian (Opsional)</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              name="description"
              placeholder="Contoh: Kerjakan soal pilihan ganda terlebih dahulu sebelum esai."
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        {/* Options Switch Bar */}
        <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Opsi Pelaksanaan Paket</p>
          <div className="grid gap-3 sm:grid-cols-3 text-xs">
            <label className="flex items-center gap-2.5 rounded-lg bg-white p-2.5 border border-slate-200/80 cursor-pointer shadow-2xs hover:border-blue-300">
              <input
                type="checkbox"
                checked={shuffleQuestions}
                onChange={(e) => setShuffleQuestions(e.target.checked)}
                className="size-4 rounded text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="font-bold text-slate-800">Acak Urutan Soal</span>
                <p className="text-[10.5px] text-slate-500">Urutan soal berbeda tiap siswa</p>
              </div>
            </label>

            <label className="flex items-center gap-2.5 rounded-lg bg-white p-2.5 border border-slate-200/80 cursor-pointer shadow-2xs hover:border-blue-300">
              <input
                type="checkbox"
                checked={shuffleOptions}
                onChange={(e) => setShuffleOptions(e.target.checked)}
                className="size-4 rounded text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="font-bold text-slate-800">Acak Opsi Pilihan (A-E)</span>
                <p className="text-[10.5px] text-slate-500">Opsi jawaban PG diacak</p>
              </div>
            </label>

            <label className="flex items-center gap-2.5 rounded-lg bg-white p-2.5 border border-slate-200/80 cursor-pointer shadow-2xs hover:border-blue-300">
              <input
                type="checkbox"
                checked={showResult}
                onChange={(e) => setShowResult(e.target.checked)}
                className="size-4 rounded text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="font-bold text-slate-800">Buka Hasil ke Siswa</span>
                <p className="text-[10.5px] text-slate-500">Siswa dapat melihat skor akhir</p>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* SECTION 2: PEMILIHAN & PENATAAN BUTIR SOAL */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
        {/* Header Bar Soal */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900">Pilih Butir Soal Ujian</h2>
              <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-black text-blue-800">
                {selectedQuestions.length} Butir Terpilih
              </span>
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-black text-emerald-800">
                Total {totalPoints} Poin
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Pilih dari bank soal yang berstatus published untuk mapel ini.
            </p>
          </div>

          {/* Quick Selector Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
              <input
                type="number"
                min="1"
                max={filteredQuestions.length}
                value={randomCount}
                onChange={(e) => setRandomCount(e.target.value)}
                placeholder="Jml"
                className="h-7 w-14 rounded-lg border border-slate-200 bg-white px-2 text-center text-xs font-bold text-slate-900"
              />
              <button
                type="button"
                onClick={selectRandomQuestions}
                disabled={!randomCount || Number(randomCount) <= 0}
                className="inline-flex h-7 items-center gap-1 rounded-lg bg-indigo-600 px-2.5 text-xs font-bold text-white shadow-2xs hover:bg-indigo-700 disabled:opacity-40"
              >
                <Dices className="size-3.5" />
                <span>Pilih Acak</span>
              </button>
            </div>

            <button
              type="button"
              onClick={toggleFiltered}
              className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50"
            >
              {allFilteredSelected ? "Batal Pilih Hasil Filter" : "Pilih Semua Filter"}
            </button>

            {selectedQuestions.length > 0 ? (
              <button
                type="button"
                onClick={clearCurrentSelection}
                className="h-9 rounded-xl border border-rose-200 bg-rose-50 px-3 text-xs font-bold text-rose-700 shadow-2xs hover:bg-rose-100"
              >
                Kosongkan Pilihan
              </button>
            ) : null}
          </div>
        </div>

        {/* View Mode Switcher: All Questions vs Selected Questions */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-0.5 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`rounded-lg px-3 py-1.5 transition-all ${
                activeTab === "all"
                  ? "bg-white text-blue-700 shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Semua Soal Bank ({subjectQuestions.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("selected")}
              className={`rounded-lg px-3 py-1.5 transition-all ${
                activeTab === "selected"
                  ? "bg-white text-blue-700 shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Soal Terpilih ({selectedQuestions.length})
            </button>
          </div>

          <span className="text-xs text-slate-500">
            Menampilkan <strong className="text-slate-900">{activeTab === "all" ? filteredQuestions.length : selectedQuestions.length}</strong> soal
          </span>
        </div>

        {/* Filter Bar (Only on Tab All) */}
        {activeTab === "all" ? (
          <div className="grid gap-2.5 sm:grid-cols-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari teks soal..."
                className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
              />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
            >
              <option value="">Semua Tipe Soal</option>
              <option value="multiple_choice">Pilihan Ganda (PG)</option>
              <option value="essay">Esai / Uraian</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
            >
              <option value="">Semua Kategori / Bab</option>
              {categoryOptions.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {/* Questions List Container */}
        <div className="max-h-[520px] overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100">
          {(activeTab === "all" ? filteredQuestions : selectedQuestions).length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500">
              <BookOpen className="mx-auto size-8 text-slate-300 mb-2" />
              <p className="font-semibold text-slate-700">
                {activeTab === "all"
                  ? "Tidak ada butir soal ditemukan untuk mapel dan filter ini."
                  : "Belum ada butir soal yang dipilih ke dalam paket ini."}
              </p>
              <p className="mt-0.5 text-slate-400">
                {activeTab === "all"
                  ? "Pastikan Anda sudah membuat soal berstatus published di Bank Soal."
                  : "Silakan pilih soal dari tab 'Semua Soal Bank' di atas."}
              </p>
            </div>
          ) : (
            (activeTab === "all" ? filteredQuestions : selectedQuestions).map((question, idx) => {
              const isSelected = selectedSet.has(question.id);
              const category = firstRelation(question.question_categories);

              return (
                <div
                  key={question.id}
                  onClick={() => toggleQuestion(question.id)}
                  className={`flex items-start gap-3 p-3.5 transition-colors cursor-pointer select-none ${
                    isSelected ? "bg-blue-50/50 hover:bg-blue-50/80" : "bg-white hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleQuestion(question.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="mt-0.5 size-4 rounded text-blue-600 focus:ring-blue-500 shrink-0"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-[10.5px]">
                      <span className="font-bold text-slate-400">#{idx + 1}</span>
                      <span
                        className={`rounded px-1.5 py-0.5 font-bold uppercase tracking-wider ${
                          question.type === "multiple_choice"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-purple-100 text-purple-800"
                        }`}
                      >
                        {question.type === "multiple_choice" ? "Pilihan Ganda" : "Esai"}
                      </span>
                      {category?.name ? (
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 font-medium text-slate-600">
                          {category.name}
                        </span>
                      ) : null}
                      <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                        {Number(question.point ?? 1)} Poin
                      </span>
                      {question.question_attachments && question.question_attachments.length > 0 ? (
                        <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 font-bold text-amber-700">
                          <ImageIcon className="size-3" />
                          <span>{question.question_attachments.length} Media</span>
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-1.5 line-clamp-2 text-xs font-medium text-slate-800">
                      <QuestionMathRenderer content={question.content} />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewQuestion(question);
                    }}
                    className="shrink-0 rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 shadow-2xs hover:bg-slate-50 hover:text-slate-900"
                    title="Pratinjau soal"
                  >
                    <Eye className="size-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* STICKY BOTTOM ACTION FOOTER */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 p-3.5 backdrop-blur-md shadow-lg sm:left-64">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/exams/packages"
              className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 active:scale-95"
            >
              <ArrowLeft className="size-4" />
              <span>Kembali</span>
            </Link>

            <div className="hidden sm:block">
              <p className="text-xs font-bold text-slate-900 line-clamp-1">
                {title || "Paket Ujian Baru"}
              </p>
              <p className="text-[11px] text-slate-500">
                {selectedQuestions.length} Soal • Total {totalPoints} Poin
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <DraftSubmitButton
              onClick={() => {
                if (statusInputRef.current) {
                  statusInputRef.current.value = "draft";
                }
              }}
            />

            <PublishSubmitButton
              onClick={() => {
                if (statusInputRef.current) {
                  statusInputRef.current.value = "published";
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Quick Question Preview Modal */}
      {previewQuestion ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-5 shadow-2xl space-y-4 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3 shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                    {previewQuestion.type === "multiple_choice" ? "Pilihan Ganda" : "Esai"}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    {Number(previewQuestion.point ?? 1)} Poin
                  </span>
                </div>
                <h3 className="mt-1 text-sm font-bold text-slate-900">
                  Pratinjau Butir Soal
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewQuestion(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto pr-1 text-xs text-slate-800 leading-relaxed flex-1">
              {/* Stimulus if exists */}
              {(() => {
                const stimulus = firstRelation(previewQuestion.question_stimuli);
                if (!stimulus) return null;
                return (
                  <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-3.5 space-y-2">
                    <div className="font-bold text-blue-900 text-xs">
                      {stimulus.title || "Stimulus Bacaan"}
                    </div>
                    {stimulus.content ? (
                      <QuestionMathRenderer
                        content={stimulus.content}
                        className="text-slate-700"
                      />
                    ) : null}
                    {stimulus.media_url ? (
                      <QuestionMediaPreview
                        mediaType={stimulus.media_type}
                        url={stimulus.media_url}
                        title={stimulus.title}
                        className="mt-2"
                      />
                    ) : null}
                  </div>
                );
              })()}

              {/* Question Content */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                <QuestionMathRenderer
                  content={previewQuestion.content}
                  className="text-xs leading-relaxed text-slate-900 font-medium"
                />
              </div>

              {/* Question Attachments (Images / Photos) */}
              {previewQuestion.question_attachments && previewQuestion.question_attachments.length > 0 ? (
                <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-2">
                  <div className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                    <ImageIcon className="size-3.5 text-blue-600" />
                    <span>Gambar / Media Lampiran Soal:</span>
                  </div>
                  <div className="grid gap-2">
                    {[...previewQuestion.question_attachments]
                      .sort((a, b) => a.order_number - b.order_number)
                      .map((att) => (
                        <QuestionMediaPreview
                          key={att.id}
                          mediaType={att.media_type}
                          url={att.url}
                          title={att.file_name}
                          caption={att.caption}
                        />
                      ))}
                  </div>
                </div>
              ) : null}

              {/* Multiple Choice Options */}
              {previewQuestion.type === "multiple_choice" &&
              previewQuestion.question_options &&
              previewQuestion.question_options.length > 0 ? (
                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-slate-700">Pilihan Jawaban:</div>
                  <div className="grid gap-2">
                    {[...previewQuestion.question_options]
                      .sort((a, b) => a.order_number - b.order_number)
                      .map((opt) => (
                        <div
                          key={opt.id || opt.option_label}
                          className={cn(
                            "flex items-start gap-2.5 rounded-xl border p-2.5 text-xs transition",
                            opt.is_correct
                              ? "border-emerald-300 bg-emerald-50/60 text-emerald-950 font-medium ring-1 ring-emerald-300"
                              : "border-slate-200 bg-white text-slate-700",
                          )}
                        >
                          <span
                            className={cn(
                              "flex size-5.5 items-center justify-center rounded-lg text-[11px] font-bold shrink-0 mt-0.5",
                              opt.is_correct
                                ? "bg-emerald-600 text-white"
                                : "bg-slate-100 text-slate-700",
                            )}
                          >
                            {opt.option_label}
                          </span>
                          <div className="flex-1 pt-0.5">
                            <QuestionMathRenderer content={opt.option_text} />
                          </div>
                          {opt.is_correct ? (
                            <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 shrink-0">
                              Kunci Benar
                            </span>
                          ) : null}
                        </div>
                      ))}
                  </div>
                </div>
              ) : null}

              {/* Explanation */}
              {previewQuestion.explanation ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-1">
                  <div className="text-[11px] font-bold text-slate-700">Pembahasan / Penjelasan:</div>
                  <QuestionMathRenderer
                    content={previewQuestion.explanation}
                    className="text-slate-600 text-xs"
                  />
                </div>
              ) : null}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100 shrink-0">
              <button
                type="button"
                onClick={() => setPreviewQuestion(null)}
                className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 shadow-2xs"
              >
                Tutup Pratinjau
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </form>
  );
}

function DraftSubmitButton({ onClick }: { onClick: () => void }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      onClick={onClick}
      className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
    >
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin text-slate-500" />
          <span>Menyimpan Draf...</span>
        </>
      ) : (
        <>
          <Save className="size-4 text-slate-500" />
          <span>Simpan Draf</span>
        </>
      )}
    </button>
  );
}

function PublishSubmitButton({ onClick }: { onClick: () => void }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      onClick={onClick}
      className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-blue-600 px-5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
    >
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin text-white" />
          <span>Menerbitkan Paket...</span>
        </>
      ) : (
        <>
          <Send className="size-4" />
          <span>Terbitkan Paket Ujian</span>
        </>
      )}
    </button>
  );
}
