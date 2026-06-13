"use client";

import { useMemo, useRef, useState } from "react";
import { Eye, Save, Send } from "lucide-react";

import { saveExamPackageAction } from "@/features/exams/actions";
import { cn } from "@/lib/utils";

type SubjectOption = {
  value: string;
  label: string;
};

type QuestionOption = {
  id: string;
  content: string | null;
  point: number | string | null;
  type: string | null;
  difficulty?: string | null;
  subject_id: string | null;
  subjects?: { code?: string | null; name?: string | null } | Array<{ code?: string | null; name?: string | null }> | null;
  question_categories?: { id?: string | null; name?: string | null } | Array<{ id?: string | null; name?: string | null }> | null;
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

const steps = ["Informasi", "Pilih Soal", "Pengaturan", "Review"] as const;

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
  const [step, setStep] = useState(0);
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
    Boolean(editable?.shuffle_questions),
  );
  const [shuffleOptions, setShuffleOptions] = useState(
    Boolean(editable?.shuffle_options),
  );
  const [showResult, setShowResult] = useState(Boolean(editable?.show_result));
  const [isActive, setIsActive] = useState(editable?.is_active ?? true);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>(selectedQuestionIds);
  const [previewQuestion, setPreviewQuestion] = useState<QuestionOption | null>(null);
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

    return Array.from(map.entries()).map(([value, label]) => ({ value, label }));
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
  const selectedQuestions = questions.filter((question) => selectedSet.has(question.id));
  const selectedForCurrentSubject = selectedQuestions.filter(
    (question) => question.subject_id === subjectId,
  );
  const totalPoints = selectedForCurrentSubject.reduce(
    (total, question) => total + Number(question.point ?? 0),
    0,
  );
  const selectedSubjectLabel =
    subjects.find((subject) => subject.value === subjectId)?.label ?? "-";
  const allFilteredSelected =
    filteredQuestions.length > 0 &&
    filteredQuestions.every((question) => selectedSet.has(question.id));

  function toggleQuestion(id: string) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
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

  function validate() {
    const nextErrors: string[] = [];

    if (!title.trim()) nextErrors.push("Judul paket wajib diisi.");
    if (!subjectId) nextErrors.push("Mapel wajib dipilih.");
    if (!Number(durationMinutes) || Number(durationMinutes) <= 0) {
      nextErrors.push("Durasi wajib lebih dari 0 menit.");
    }
    if (selectedForCurrentSubject.length === 0) {
      nextErrors.push("Pilih minimal satu soal published.");
    }

    setErrors(nextErrors);
    return nextErrors.length === 0;
  }

  return (
    <form
      action={saveExamPackageAction}
      className="grid gap-5"
      onSubmit={(event) => {
        if (!validate()) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" defaultValue={editable?.id ?? ""} />
      <input type="hidden" name="school_id" value={schoolId} />
      <input ref={statusInputRef} type="hidden" name="status" value={status} />
      {selectedForCurrentSubject.map((question) => (
        <input key={question.id} type="hidden" name="question_ids" value={question.id} />
      ))}

      {errors.length > 0 ? (
        <div className="rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 p-3 text-sm text-[#EF4444]">
          <div className="font-medium">Periksa lagi sebelum menyimpan:</div>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="rounded-xl border border-[#E2E8F0] bg-white p-3 shadow-sm">
        <div className="grid gap-2 sm:grid-cols-4">
          {steps.map((label, index) => (
            <button
              key={label}
              type="button"
              onClick={() => setStep(index)}
              className={cn(
                "rounded-xl border px-3 py-2 text-left text-sm transition",
                step === index
                  ? "border-[#2563EB] bg-[#2563EB] text-white"
                  : "border-[#E2E8F0] bg-white text-[#64748B] hover:bg-[#F8FAFC]",
              )}
            >
              <span className="block text-xs opacity-80">Step {index + 1}</span>
              <span className="font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>

      <section className={step === 0 ? "rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm" : "hidden"}>
        <h2 className="text-base font-semibold text-[#0F172A]">Informasi Paket</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            name="title"
            placeholder="Judul paket ujian"
            className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm"
          />
          <select
            value={subjectId}
            onChange={(event) => {
              setSubjectId(event.target.value);
              setCategoryFilter("");
            }}
            name="subject_id"
            className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm"
          >
            {subjects.map((subject) => (
              <option key={subject.value} value={subject.value}>
                {subject.label}
              </option>
            ))}
          </select>
          <input
            value={durationMinutes}
            onChange={(event) => setDurationMinutes(event.target.value)}
            name="duration_minutes"
            type="number"
            min="1"
            className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm"
          />
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            name="description"
            placeholder="Deskripsi paket ujian"
            className="min-h-24 rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm md:col-span-2"
          />
        </div>
      </section>

      <section className={step === 1 ? "rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm" : "hidden"}>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-base font-semibold text-[#0F172A]">Pilih Soal</h2>
            <p className="mt-1 text-sm text-[#64748B]">
              {selectedForCurrentSubject.length} soal dipilih
            </p>
          </div>
          <button
            type="button"
            onClick={toggleFiltered}
            className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm hover:bg-[#F8FAFC]"
          >
            {allFilteredSelected ? "Batalkan hasil filter" : "Select all hasil filter"}
          </button>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari soal"
            className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm"
          />
          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm"
          >
            <option value="">Semua tipe</option>
            <option value="multiple_choice">Pilihan ganda</option>
            <option value="essay">Essay</option>
          </select>
          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm"
          >
            <option value="">Semua kategori</option>
            {categoryOptions.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 max-h-[460px] overflow-auto rounded-xl border border-[#E2E8F0]">
          {filteredQuestions.length === 0 ? (
            <div className="p-6 text-sm text-[#64748B]">
              Belum ada soal published untuk filter ini.
            </div>
          ) : (
            filteredQuestions.map((question) => (
              <div
                key={question.id}
                className="grid min-h-12 grid-cols-[auto_1fr_auto_auto] items-center gap-3 border-b border-[#E2E8F0] px-3 py-2 text-sm last:border-b-0 hover:bg-[#F8FAFC]"
              >
                <input
                  type="checkbox"
                  checked={selectedSet.has(question.id)}
                  onChange={() => toggleQuestion(question.id)}
                />
                <div className="min-w-0">
                  <div className="line-clamp-1 font-medium text-[#0F172A]">
                    {question.content || "-"}
                  </div>
                </div>
                <span className="rounded-md bg-[#F8FAFC] px-2 py-1 text-xs text-[#64748B] ring-1 ring-[#E2E8F0]">
                  {question.type === "multiple_choice" ? "PG" : "Essay"}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#64748B]">
                    {Number(question.point ?? 0)} poin
                  </span>
                  <button
                    type="button"
                    onClick={() => setPreviewQuestion(question)}
                    className="inline-flex h-7 items-center gap-1 rounded-xl border border-[#E2E8F0] px-2 text-xs"
                  >
                    <Eye className="size-3.5" />
                    Pratinjau
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className={step === 2 ? "rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm" : "hidden"}>
        <h2 className="text-base font-semibold text-[#0F172A]">Pengaturan</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <Toggle label="Acak soal" checked={shuffleQuestions} onChange={setShuffleQuestions} name="shuffle_questions" />
          <Toggle label="Acak opsi" checked={shuffleOptions} onChange={setShuffleOptions} name="shuffle_options" />
          <Toggle label="Tampilkan hasil" checked={showResult} onChange={setShowResult} name="show_result" />
          <Toggle label="Aktif" checked={isActive} onChange={setIsActive} name="is_active" />
        </div>
      </section>

      <section className={step === 3 ? "rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm" : "hidden"}>
        <h2 className="text-base font-semibold text-[#0F172A]">Review & Simpan</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <Summary label="Nama Paket" value={title || "-"} />
          <Summary label="Mapel" value={selectedSubjectLabel} />
          <Summary label="Durasi" value={`${Number(durationMinutes || 0)} menit`} />
          <Summary label="Jumlah Soal" value={`${selectedForCurrentSubject.length} soal`} />
          <Summary label="Total Poin" value={`${totalPoints} poin`} />
          <Summary label="Status" value={status} />
        </div>
      </section>

      <div className="flex flex-col gap-3 rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setStep((current) => Math.max(0, current - 1))}
            disabled={step === 0}
            className="rounded-xl border border-[#E2E8F0] px-4 py-2 text-sm disabled:opacity-50"
          >
            Sebelumnya
          </button>
          <button
            type="button"
            onClick={() => setStep((current) => Math.min(steps.length - 1, current + 1))}
            disabled={step === steps.length - 1}
            className="rounded-xl border border-[#E2E8F0] px-4 py-2 text-sm disabled:opacity-50"
          >
            Berikutnya
          </button>
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            onClick={() => {
              setStatus("draft");
              if (statusInputRef.current) statusInputRef.current.value = "draft";
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-[#E2E8F0] px-4 py-2 text-sm font-medium hover:bg-[#F8FAFC]"
          >
            <Save className="size-4" />
            Simpan Draft
          </button>
          <button
            type="submit"
            onClick={() => {
              setStatus("published");
              if (statusInputRef.current) statusInputRef.current.value = "published";
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-4 py-2 text-sm font-medium text-white hover:bg-[#1D4ED8]"
          >
            <Send className="size-4" />
            Publish Paket
          </button>
        </div>
      </div>

      {previewQuestion ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
          <div className="max-h-[88vh] w-full max-w-2xl overflow-auto rounded-xl bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-[#0F172A]">Pratinjau Soal</h2>
              <button
                type="button"
                onClick={() => setPreviewQuestion(null)}
                className="rounded-xl border border-[#E2E8F0] px-3 py-1.5 text-sm"
              >
                Tutup
              </button>
            </div>
            <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 text-sm leading-7">
              {previewQuestion.content || "-"}
            </div>
          </div>
        </div>
      ) : null}
    </form>
  );
}

function Toggle({
  label,
  checked,
  onChange,
  name,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  name: string;
}) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-xl border border-[#E2E8F0] p-3 text-sm">
      <span className="font-medium text-[#0F172A]">{label}</span>
      <input
        name={name}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3">
      <div className="text-xs text-[#64748B]">{label}</div>
      <div className="mt-1 line-clamp-1 font-semibold text-[#0F172A]">
        {value}
      </div>
    </div>
  );
}
