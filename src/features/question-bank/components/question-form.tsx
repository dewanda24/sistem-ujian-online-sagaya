"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import type { ReactNode } from "react";
import {
  Check,
  Eye,
  Image as ImageIcon,
  Loader2,
  Plus,
  RotateCcw,
  Save,
  Send,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import { saveQuestionAction } from "@/features/question-bank/actions";
import { QuestionMathRenderer } from "@/features/question-bank/components/question-math-renderer";
import { QuestionMediaPreview } from "@/features/question-bank/components/question-media-preview";
import type { SelectOption } from "@/lib/master-data/queries";
import { cn } from "@/lib/utils";

type QuestionFormOption = SelectOption & {
  subject_id?: string;
  content?: string | null;
  media_url?: string | null;
  media_type?: string | null;
};

type EditableQuestion = {
  id?: string | null;
  school_id?: string | null;
  subject_id?: string | null;
  category_id?: string | null;
  stimulus_id?: string | null;
  type?: string | null;
  difficulty?: string | null;
  content?: string | null;
  explanation?: string | null;
  point?: number | string | null;
  is_active?: boolean | null;
  question_stimuli?: {
    title?: string | null;
    content?: string | null;
    media_url?: string | null;
    media_type?: string | null;
  } | null;
  question_options?: Array<{
    option_label: string;
    option_text: string;
    is_correct: boolean;
    order_number: number;
  }> | null;
  question_attachments?: Array<{
    media_type: string;
    url: string;
    file_name?: string | null;
    caption?: string | null;
    order_number: number;
  }> | null;
};

type QuestionFormProps = {
  editable?: EditableQuestion | null;
  schoolId: string;
  subjects: SelectOption[];
  categories: QuestionFormOption[];
  stimuli: QuestionFormOption[];
  defaultSubjectId?: string;
  defaultCategoryId?: string;
  canPublish?: boolean;
};

const labels = ["A", "B", "C", "D", "E"] as const;
const requiredLabels = ["A", "B", "C", "D"] as const;
type StimulusMode = "none" | "existing" | "new";
type UploadTarget = "attachment" | "stimulus";
type UploadState = {
  target: UploadTarget;
  status: "uploading" | "error" | "done";
  message: string;
} | null;

function optionValue(question: EditableQuestion | null | undefined, label: string) {
  return (
    question?.question_options?.find((item) => item.option_label === label)
      ?.option_text ?? ""
  );
}

function correctOption(question: EditableQuestion | null | undefined) {
  return (
    question?.question_options?.find((option) => option.is_correct)
      ?.option_label ?? ""
  );
}

function firstAttachment(question: EditableQuestion | null | undefined) {
  return [...(question?.question_attachments ?? [])].sort(
    (a, b) => a.order_number - b.order_number,
  )[0];
}

function formatPointValue(point: EditableQuestion["point"]) {
  const numericPoint = Number(point ?? 1);

  if (!Number.isFinite(numericPoint) || numericPoint <= 0) {
    return "1";
  }

  return String(Math.round(numericPoint));
}

function Panel({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-xs sm:p-6">
      <div className="mb-4">
        <h2 className="text-base font-bold text-[#0F172A]">{title}</h2>
        {description ? (
          <p className="mt-0.5 text-xs text-[#64748B]">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function Accordion({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <details className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-xs group">
      <summary className="cursor-pointer text-sm font-bold text-[#0F172A] flex items-center justify-between">
        <span>{title}</span>
        <span className="text-xs text-[#64748B] font-normal group-open:hidden">Klik untuk melihat</span>
      </summary>
      <div className="mt-4 border-t border-[#E2E8F0] pt-4">{children}</div>
    </details>
  );
}

function FieldLabel({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-1.5 text-sm text-[#0F172A]">
      <span className="font-semibold text-xs text-[#475569]">{label}</span>
      {children}
    </label>
  );
}

function KesalahanList({ errors }: { errors: string[] }) {
  if (errors.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 p-4 text-xs text-[#EF4444]">
      <div className="font-bold">Periksa kembali sebelum menyimpan:</div>
      <ul className="mt-1.5 list-disc space-y-1 pl-5">
        {errors.map((error) => (
          <li key={error}>{error}</li>
        ))}
      </ul>
    </div>
  );
}

export function QuestionForm({
  editable,
  schoolId,
  subjects,
  categories,
  stimuli,
  defaultSubjectId,
  defaultCategoryId,
  canPublish = false,
}: QuestionFormProps) {
  const attachment = firstAttachment(editable);
  const initialSubjectId =
    editable?.subject_id ?? defaultSubjectId ?? subjects[0]?.value ?? "";
  const statusInputRef = useRef<HTMLInputElement>(null);
  const saveAndAddAnotherRef = useRef<HTMLInputElement>(null);
  const [subjectId, setSubjectId] = useState(initialSubjectId);
  const [type, setType] = useState(editable?.type ?? "multiple_choice");
  const [content, setContent] = useState(editable?.content ?? "");
  const [explanation, setExplanation] = useState(editable?.explanation ?? "");
  const [point, setPoint] = useState(formatPointValue(editable?.point));
  const [correct, setCorrect] = useState(correctOption(editable));
  const [options, setOptions] = useState<Record<string, string>>({
    A: optionValue(editable, "A"),
    B: optionValue(editable, "B"),
    C: optionValue(editable, "C"),
    D: optionValue(editable, "D"),
    E: optionValue(editable, "E"),
  });
  const [stimulusId, setStimulusId] = useState(editable?.stimulus_id ?? "");
  const [stimulusMode, setStimulusMode] = useState<StimulusMode>(
    editable?.stimulus_id ? "existing" : "none",
  );
  const [newStimulusTitle, setNewStimulusTitle] = useState("");
  const [newStimulusContent, setNewStimulusContent] = useState("");
  const [newStimulusMediaUrl, setNewStimulusMediaUrl] = useState("");
  const [newStimulusMediaType, setNewStimulusMediaType] = useState("");
  const [attachmentMediaType, setAttachmentMediaType] = useState(
    attachment?.media_type ?? "image",
  );
  const [attachmentUrl, setAttachmentUrl] = useState(attachment?.url ?? "");
  const [attachmentFileName, setAttachmentFileName] = useState(
    attachment?.file_name ?? "",
  );
  const [attachmentCaption, setAttachmentCaption] = useState(
    attachment?.caption ?? "",
  );
  const [errors, setKesalahans] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [uploadState, setUploadState] = useState<UploadState>(null);

  // Target input for inserting math formula: "content" or "A", "B", "C", "D", "E"
  const [mathTarget, setMathTarget] = useState<"content" | "A" | "B" | "C" | "D" | "E" | null>(null);

  // Visual Math Assistant Dialog State
  const [mathModal, setMathModal] = useState<
    "fraction" | "sqrt" | "power" | "matrix" | "system" | "degree" | null
  >(null);

  // Math builder temporary inputs
  const [mathInputs, setMathInputs] = useState({
    fracTop: "",
    fracBottom: "",
    sqrtVal: "",
    sqrtDegree: "",
    powerBase: "",
    powerExp: "",
    degreeVal: "45",
    m00: "a",
    m01: "b",
    m10: "c",
    m11: "d",
    sysEq1: "2x + y = 5",
    sysEq2: "x - y = 1",
  });

  // Auto-load draft for new questions
  useEffect(() => {
    if (editable?.id) return;
    const saved = localStorage.getItem("sagaya_question_draft");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.type) setType(parsed.type);
        if (parsed.content) setContent(parsed.content);
        if (parsed.explanation) setExplanation(parsed.explanation);
        if (parsed.options) setOptions(parsed.options);
        if (parsed.correct) setCorrect(parsed.correct);
      } catch (e) {
        // ignore parse error
      }
    }
  }, [editable?.id]);

  // Auto-save draft for new questions
  useEffect(() => {
    if (editable?.id) return;
    const draft = { type, content, explanation, options, correct };
    localStorage.setItem("sagaya_question_draft", JSON.stringify(draft));
  }, [type, content, explanation, options, correct, editable?.id]);

  const filteredCategories = useMemo(
    () =>
      categories.filter(
        (category) => !category.subject_id || category.subject_id === subjectId,
      ),
    [categories, subjectId],
  );
  const filteredStimuli = useMemo(
    () =>
      stimuli.filter(
        (stimulus) => !stimulus.subject_id || stimulus.subject_id === subjectId,
      ),
    [stimuli, subjectId],
  );

  const isMultipleChoice = type === "multiple_choice";

  function insertTextToTarget(insertedText: string) {
    if (!mathTarget) return;
    if (mathTarget === "content") {
      setContent((current) => {
        if (!current) return insertedText;
        return `${current} ${insertedText}`;
      });
    } else {
      setOptions((prev) => ({
        ...prev,
        [mathTarget]: prev[mathTarget] ? `${prev[mathTarget]} ${insertedText}` : insertedText,
      }));
    }
  }

  function handleInsertMathSymbol(symbol: string) {
    insertTextToTarget(`$${symbol}$`);
  }

  function handleApplyMathModal() {
    let result = "";
    if (mathModal === "fraction") {
      const top = mathInputs.fracTop.trim() || "a";
      const bot = mathInputs.fracBottom.trim() || "b";
      result = `$\\frac{${top}}{${bot}}$`;
    } else if (mathModal === "sqrt") {
      const val = mathInputs.sqrtVal.trim() || "x";
      if (mathInputs.sqrtDegree.trim()) {
        result = `$\\sqrt[${mathInputs.sqrtDegree.trim()}]{${val}}$`;
      } else {
        result = `$\\sqrt{${val}}$`;
      }
    } else if (mathModal === "power") {
      const base = mathInputs.powerBase.trim() || "x";
      const exp = mathInputs.powerExp.trim() || "2";
      result = `$${base}^{${exp}}$`;
    } else if (mathModal === "degree") {
      const deg = mathInputs.degreeVal.trim() || "45";
      result = `$${deg}^\\circ$`;
    } else if (mathModal === "matrix") {
      result = `$$\\begin{pmatrix} ${mathInputs.m00 || "a"} & ${mathInputs.m01 || "b"} \\\\ ${mathInputs.m10 || "c"} & ${mathInputs.m11 || "d"} \\end{pmatrix}$$`;
    } else if (mathModal === "system") {
      result = `$$\\begin{cases} ${mathInputs.sysEq1 || "2x + y = 5"} \\\\ ${mathInputs.sysEq2 || "x - y = 1"} \\end{cases}$$`;
    }

    if (result) {
      insertTextToTarget(result);
    }
    setMathModal(null);
  }

  function validate() {
    const nextKesalahans: string[] = [];

    if (!subjectId) nextKesalahans.push("Mata pelajaran wajib dipilih.");
    if (!content.trim()) nextKesalahans.push("Konten soal wajib diisi.");

    if (isMultipleChoice) {
      const filledOptions = requiredLabels.filter((label) => options[label]?.trim());
      if (filledOptions.length < 2) {
        nextKesalahans.push("Soal pilihan ganda wajib mengisi minimal opsi A dan B.");
      }
      if (!correct) {
        nextKesalahans.push("Pilih salah satu kunci jawaban yang benar.");
      }
    }

    setKesalahans(nextKesalahans);
    return nextKesalahans.length === 0;
  }

  async function uploadMedia(file: File, target: UploadTarget) {
    const payload = new FormData();
    payload.set("file", file);
    setUploadState({
      target,
      status: "uploading",
      message: "Mengupload media ke server...",
    });

    const response = await fetch("/api/question-bank/media", {
      method: "POST",
      body: payload,
    }).catch(() => null);
    const result = response ? await response.json().catch(() => null) : null;

    if (!response?.ok || !result?.url) {
      setUploadState({
        target,
        status: "error",
        message: result?.message ?? "Upload media gagal.",
      });
      return;
    }

    if (target === "attachment") {
      setAttachmentUrl(result.url);
      setAttachmentMediaType(result.media_type ?? "image");
      setAttachmentFileName(result.file_name ?? file.name);
    } else {
      setNewStimulusMediaUrl(result.url);
      setNewStimulusMediaType(result.media_type ?? "image");
    }

    setUploadState({
      target,
      status: "done",
      message: "Foto/media berhasil diupload!",
    });
  }

  const renderMathToolbar = (target: "content" | "A" | "B" | "C" | "D" | "E") => {
    if (mathTarget !== target) return null;
    return (
      <div className="mb-3 animate-in fade-in slide-in-from-top-1 duration-200">
        <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-blue-200/60 pb-2 mb-2.5">
            <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
              <span>📐</span>
              <span>Bantuan Rumus Matematika (Visual)</span>
            </span>
            <button type="button" onClick={() => setMathTarget(null)} className="text-slate-400 hover:text-slate-600">
              <X className="size-4" />
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5 mb-3">
            <button type="button" onClick={() => setMathModal("fraction")} className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-white px-2.5 py-1 text-xs font-semibold text-blue-800 shadow-xs hover:bg-blue-100 active:scale-95 transition"><span>➗</span> <span>Pecahan</span></button>
            <button type="button" onClick={() => setMathModal("sqrt")} className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-white px-2.5 py-1 text-xs font-semibold text-blue-800 shadow-xs hover:bg-blue-100 active:scale-95 transition"><span>√</span> <span>Bentuk Akar</span></button>
            <button type="button" onClick={() => setMathModal("power")} className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-white px-2.5 py-1 text-xs font-semibold text-blue-800 shadow-xs hover:bg-blue-100 active:scale-95 transition"><span>xⁿ</span> <span>Pangkat</span></button>
            <button type="button" onClick={() => setMathModal("degree")} className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-white px-2.5 py-1 text-xs font-semibold text-blue-800 shadow-xs hover:bg-blue-100 active:scale-95 transition"><span>°</span> <span>Derajat</span></button>
            <button type="button" onClick={() => setMathModal("matrix")} className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-white px-2.5 py-1 text-xs font-semibold text-blue-800 shadow-xs hover:bg-blue-100 active:scale-95 transition"><span>🔲</span> <span>Matriks 2x2</span></button>
            <button type="button" onClick={() => setMathModal("system")} className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-white px-2.5 py-1 text-xs font-semibold text-blue-800 shadow-xs hover:bg-blue-100 active:scale-95 transition"><span>📏</span> <span>Sistem Persamaan</span></button>
          </div>

          <div className="flex flex-wrap items-center gap-1">
            <span className="text-[11px] text-[#64748B] font-medium mr-1">Simbol Cepat:</span>
            {[
              { label: "×", val: "\\times" }, { label: "÷", val: "\\div" }, { label: "±", val: "\\pm" }, { label: "≤", val: "\\le" }, { label: "≥", val: "\\ge" }, { label: "≠", val: "\\neq" }, { label: "≈", val: "\\approx" }, { label: "°", val: "^\\circ" }, { label: "∠", val: "\\angle" }, { label: "△", val: "\\triangle" }, { label: "π", val: "\\pi" }, { label: "θ", val: "\\theta" }, { label: "α", val: "\\alpha" }, { label: "β", val: "\\beta" }, { label: "∞", val: "\\infty" }, { label: "∫", val: "\\int" }, { label: "lim", val: "\\lim" }
            ].map((sym) => (
              <button key={sym.label} type="button" onClick={() => handleInsertMathSymbol(sym.val)} className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-xs font-bold text-slate-800 shadow-2xs hover:bg-blue-50 active:scale-90 transition" title={`Sisipkan simbol ${sym.label}`}>
                {sym.label}
              </button>
            ))}
          </div>

          {mathModal && (
            <div className="mt-4 rounded-xl border-2 border-blue-400 bg-white p-4 shadow-md animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b pb-2 mb-3">
                <h4 className="text-xs font-bold text-blue-900">
                  {mathModal === "fraction" && "➗ Sisipkan Pecahan"}
                  {mathModal === "sqrt" && "√ Sisipkan Bentuk Akar"}
                  {mathModal === "power" && "xⁿ Sisipkan Pangkat"}
                  {mathModal === "degree" && "° Sisipkan Derajat / Sudut"}
                  {mathModal === "matrix" && "🔲 Sisipkan Matriks 2x2"}
                  {mathModal === "system" && "📏 Sisipkan Sistem Persamaan Linier"}
                </h4>
                <button type="button" onClick={() => setMathModal(null)} className="size-6 inline-flex items-center justify-center rounded-md hover:bg-slate-100">
                  <X className="size-4 text-slate-500" />
                </button>
              </div>

              {mathModal === "fraction" && (
                <div className="flex items-center gap-3">
                  <div className="grid gap-2">
                    <input placeholder="Pembilang (Atas), contoh: 3" value={mathInputs.fracTop} onChange={(e) => setMathInputs({ ...mathInputs, fracTop: e.target.value })} className="h-9 rounded-lg border border-slate-300 px-3 text-xs font-semibold" autoFocus />
                    <div className="border-b-2 border-slate-800" />
                    <input placeholder="Penyebut (Bawah), contoh: 4" value={mathInputs.fracBottom} onChange={(e) => setMathInputs({ ...mathInputs, fracBottom: e.target.value })} className="h-9 rounded-lg border border-slate-300 px-3 text-xs font-semibold" />
                  </div>
                </div>
              )}

              {mathModal === "sqrt" && (
                <div className="grid gap-2 sm:grid-cols-2">
                  <FieldLabel label="Angka di dalam akar">
                    <input placeholder="Contoh: 16 atau x + 4" value={mathInputs.sqrtVal} onChange={(e) => setMathInputs({ ...mathInputs, sqrtVal: e.target.value })} className="h-9 rounded-lg border border-slate-300 px-3 text-xs font-semibold" autoFocus />
                  </FieldLabel>
                  <FieldLabel label="Pangkat akar (Opsional)">
                    <input placeholder="Contoh: 3 untuk akar pangkat 3" value={mathInputs.sqrtDegree} onChange={(e) => setMathInputs({ ...mathInputs, sqrtDegree: e.target.value })} className="h-9 rounded-lg border border-slate-300 px-3 text-xs font-semibold" />
                  </FieldLabel>
                </div>
              )}

              {mathModal === "power" && (
                <div className="grid gap-2 sm:grid-cols-2">
                  <FieldLabel label="Angka / Variabel Dasar">
                    <input placeholder="Contoh: x atau 2" value={mathInputs.powerBase} onChange={(e) => setMathInputs({ ...mathInputs, powerBase: e.target.value })} className="h-9 rounded-lg border border-slate-300 px-3 text-xs font-semibold" autoFocus />
                  </FieldLabel>
                  <FieldLabel label="Nilai Pangkat">
                    <input placeholder="Contoh: 2 atau n+1" value={mathInputs.powerExp} onChange={(e) => setMathInputs({ ...mathInputs, powerExp: e.target.value })} className="h-9 rounded-lg border border-slate-300 px-3 text-xs font-semibold" />
                  </FieldLabel>
                </div>
              )}

              {mathModal === "degree" && (
                <div>
                  <FieldLabel label="Besar Sudut / Derajat">
                    <input placeholder="Contoh: 45 atau 90 atau 180" value={mathInputs.degreeVal} onChange={(e) => setMathInputs({ ...mathInputs, degreeVal: e.target.value })} className="h-9 max-w-xs rounded-lg border border-slate-300 px-3 text-xs font-semibold" autoFocus />
                  </FieldLabel>
                </div>
              )}

              {mathModal === "matrix" && (
                <div className="grid grid-cols-2 gap-2 max-w-xs p-2 border border-slate-200 rounded-xl bg-slate-50">
                  <input value={mathInputs.m00} onChange={(e) => setMathInputs({ ...mathInputs, m00: e.target.value })} className="h-8 rounded-md border border-slate-300 bg-white text-center text-xs font-bold" placeholder="Baris 1 Kolom 1" />
                  <input value={mathInputs.m01} onChange={(e) => setMathInputs({ ...mathInputs, m01: e.target.value })} className="h-8 rounded-md border border-slate-300 bg-white text-center text-xs font-bold" placeholder="Baris 1 Kolom 2" />
                  <input value={mathInputs.m10} onChange={(e) => setMathInputs({ ...mathInputs, m10: e.target.value })} className="h-8 rounded-md border border-slate-300 bg-white text-center text-xs font-bold" placeholder="Baris 2 Kolom 1" />
                  <input value={mathInputs.m11} onChange={(e) => setMathInputs({ ...mathInputs, m11: e.target.value })} className="h-8 rounded-md border border-slate-300 bg-white text-center text-xs font-bold" placeholder="Baris 2 Kolom 2" />
                </div>
              )}

              {mathModal === "system" && (
                <div className="grid gap-2">
                  <input value={mathInputs.sysEq1} onChange={(e) => setMathInputs({ ...mathInputs, sysEq1: e.target.value })} className="h-9 rounded-lg border border-slate-300 px-3 text-xs font-semibold" placeholder="Persamaan 1, misal: 2x + y = 5" />
                  <input value={mathInputs.sysEq2} onChange={(e) => setMathInputs({ ...mathInputs, sysEq2: e.target.value })} className="h-9 rounded-lg border border-slate-300 px-3 text-xs font-semibold" placeholder="Persamaan 2, misal: x - y = 1" />
                </div>
              )}

              <div className="mt-3 flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setMathModal(null)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">Batal</button>
                <button type="button" onClick={handleApplyMathModal} className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700">Sisipkan Rumus</button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <form
      action={saveQuestionAction}
      className="grid gap-6"
      onSubmit={(event) => {
        if (!validate()) {
          event.preventDefault();
        } else {
          localStorage.removeItem("sagaya_question_draft");
        }
      }}
    >
      <input type="hidden" name="id" defaultValue={editable?.id ?? ""} />
      <input type="hidden" name="school_id" value={schoolId} />
      <input ref={statusInputRef} type="hidden" name="status" defaultValue="draft" />
      <input type="hidden" name="stimulus_mode" value={stimulusMode} />

      {/* Hidden Media Attachments Inputs - Always Submitted */}
      <input type="hidden" name="attachment_url" value={attachmentUrl} />
      <input type="hidden" name="attachment_media_type" value={attachmentMediaType} />
      <input type="hidden" name="attachment_file_name" value={attachmentFileName} />
      <input type="hidden" name="attachment_caption" value={attachmentCaption} />

      <KesalahanList errors={errors} />

      {/* 1. Informasi Soal */}
      <Panel title="Informasi Mata Pelajaran & Tipe Soal">
        <div className="grid gap-4 md:grid-cols-3">
          <FieldLabel label="Mata Pelajaran">
            <select
              name="subject_id"
              value={subjectId}
              onChange={(event) => {
                setSubjectId(event.target.value);
                setStimulusId("");
                setStimulusMode("none");
              }}
              className="h-10 rounded-xl border border-[#CBD5E1] bg-white px-3 text-xs font-semibold outline-none focus:border-[#2563EB]"
            >
              <option value="">Pilih mapel</option>
              {subjects.map((subject) => (
                <option key={subject.value} value={subject.value}>
                  {subject.label}
                </option>
              ))}
            </select>
          </FieldLabel>

          <FieldLabel label="Kategori / Bab">
            <select
              name="category_id"
              defaultValue={editable?.category_id ?? defaultCategoryId ?? ""}
              className="h-10 rounded-xl border border-[#CBD5E1] bg-white px-3 text-xs font-semibold outline-none focus:border-[#2563EB]"
            >
              <option value="">Tanpa kategori (Umum)</option>
              {filteredCategories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </FieldLabel>

          <FieldLabel label="Bentuk Soal">
            <select
              name="type"
              value={type}
              onChange={(event) => setType(event.target.value)}
              className="h-10 rounded-xl border border-[#CBD5E1] bg-white px-3 text-xs font-semibold outline-none focus:border-[#2563EB]"
            >
              <option value="multiple_choice">Pilihan Ganda (A - E)</option>
              <option value="essay">Uraian / Essay</option>
            </select>
          </FieldLabel>
        </div>
      </Panel>

      {/* 2. Isi Soal + Visual Math Assistant + Prominent Image Upload */}
      <Panel
        title="Isi Soal & Lampiran Foto"
        description="Tulis pertanyaan soal, unggah gambar/diagram bila ada, atau gunakan bantuan rumus matematika visual."
      >
        <div className="space-y-4">
          {/* Question text textarea */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Teks Pertanyaan / Soal</span>
              <button
                type="button"
                onClick={() => setMathTarget(mathTarget === "content" ? null : "content")}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold transition",
                  mathTarget === "content" ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                )}
              >
                <span>∑</span> <span>Sisipkan Rumus</span>
              </button>
            </div>
            
            {renderMathToolbar("content")}
            
            <textarea
              name="content"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="Tulis pertanyaan soal di sini. Untuk rumus, gunakan bantuan di atas."
              className="min-h-48 w-full rounded-xl border border-[#CBD5E1] p-4 text-sm leading-relaxed outline-none transition focus:border-[#2563EB] focus:ring-3 focus:ring-blue-100"
            />

            {/* Live Math Preview for Question */}
            <div className="mt-2.5 rounded-xl border border-dashed border-slate-300 bg-slate-50/80 p-3.5 text-xs">
              <div className="mb-1.5 font-bold text-slate-800 flex items-center gap-1.5">
                <Eye className="size-3.5 text-blue-600" />
                <span>Pratinjau Tampilan Soal untuk Siswa:</span>
              </div>
              {content ? (
                <div className="rounded-lg bg-white p-3 border border-slate-200">
                  <QuestionMathRenderer content={content} className="leading-relaxed text-sm text-[#0F172A]" />
                </div>
              ) : (
                <p className="text-[#94A3B8] italic">Teks atau rumus yang Anda tulis akan langsung muncul di sini.</p>
              )}
            </div>
          </div>

          {/* PROMINENT IMAGE / FOTO LAMPIRAN SOAL */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-200 pb-2.5">
              <div className="flex items-center gap-2">
                <ImageIcon className="size-4 text-blue-600" />
                <span className="text-xs font-bold text-[#0F172A]">
                  Lampiran Foto / Diagram Soal (Opsional)
                </span>
              </div>

              {/* Upload button */}
              <label className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-white border border-slate-300 px-3 py-1.5 text-xs font-bold text-[#0F172A] shadow-xs hover:bg-slate-50 active:scale-95 transition">
                <Upload className="size-3.5 text-blue-600" />
                <span>{attachmentUrl ? "Ganti Foto" : "Unggah Foto / Diagram"}</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml,application/pdf"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void uploadMedia(file, "attachment");
                    event.currentTarget.value = "";
                  }}
                />
              </label>
            </div>

            {/* Image Preview & Caption */}
            {attachmentUrl ? (
              <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-3.5 animate-in fade-in duration-150">
                <div className="flex flex-col md:flex-row gap-4 items-start">
                  <div className="max-w-xs overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                    <QuestionMediaPreview
                      mediaType={attachmentMediaType}
                      url={attachmentUrl}
                      title={attachmentFileName || "Foto Soal"}
                      caption={attachmentCaption}
                    />
                  </div>

                  <div className="flex-1 space-y-2 w-full">
                    <FieldLabel label="Keterangan / Caption Gambar (Opsional)">
                      <input
                        value={attachmentCaption}
                        onChange={(e) => setAttachmentCaption(e.target.value)}
                        placeholder="Contoh: Gambar 1. Diagram jaring-jaring bangun ruang"
                        className="h-9 w-full rounded-lg border border-slate-300 px-3 text-xs font-medium"
                      />
                    </FieldLabel>

                    <div className="flex items-center gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setAttachmentUrl("");
                          setAttachmentFileName("");
                          setAttachmentCaption("");
                        }}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-bold text-red-600 hover:bg-red-100 active:scale-95 transition"
                      >
                        <Trash2 className="size-3.5" />
                        <span>Hapus Foto Ini</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center p-6 border-2 border-dashed border-slate-200 rounded-xl bg-white text-center">
                <p className="text-xs text-[#64748B]">
                  Tidak ada foto lampiran. Jika soal membutuhkan gambar/diagram/grafik, klik tombol <strong>Unggah Foto</strong> di atas.
                </p>
              </div>
            )}

            {uploadState?.target === "attachment" && (
              <p
                className={cn(
                  "text-xs font-semibold",
                  uploadState.status === "error" ? "text-red-600" : "text-blue-600",
                )}
              >
                {uploadState.message}
              </p>
            )}
          </div>

          {/* Multiple Choice Options A, B, C, D, E */}
          {isMultipleChoice ? (
            <div className="space-y-4 pt-4 border-t border-slate-200 mt-4">
              <input type="hidden" name="correct_option" value={correct} />
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pilihan Jawaban (A-E)</span>
              </div>
              
              <div className="grid gap-4">
                {labels.map((label) => {
                  const isCorrect = correct === label;
                  const optionText = options[label];

                  return (
                    <div
                      key={label}
                      className={cn(
                        "rounded-xl border p-4 transition space-y-3",
                        isCorrect
                          ? "border-emerald-300 bg-emerald-50/40 ring-1 ring-emerald-400"
                          : "border-slate-200 bg-white hover:border-slate-300",
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setCorrect(label)}
                            className={cn(
                              "flex size-7 items-center justify-center rounded-full border-2 transition active:scale-95",
                              isCorrect 
                                ? "border-emerald-500 bg-emerald-500 text-white" 
                                : "border-slate-300 bg-white text-transparent hover:border-emerald-400"
                            )}
                            title="Jadikan Kunci Jawaban"
                          >
                            <Check className="size-4" />
                          </button>
                          <span className="font-bold text-[#0F172A]">Opsi {label}</span>
                          {isCorrect && (
                            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                              Kunci Jawaban Benar
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => setMathTarget(mathTarget === label ? null : label)}
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold transition",
                            mathTarget === label ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                          )}
                        >
                          <span>∑</span> <span className="hidden sm:inline">Sisipkan Rumus</span>
                        </button>
                      </div>

                      {renderMathToolbar(label)}

                      <textarea
                        name={`option_${label}`}
                        value={optionText}
                        onChange={(event) =>
                          setOptions((current) => ({
                            ...current,
                            [label]: event.target.value,
                          }))
                        }
                        placeholder={`Tulis isi pilihan ${label}${label === "E" ? " (opsional)" : ""}`}
                        className="min-h-20 w-full rounded-lg border border-slate-200 bg-white p-3 text-sm outline-none focus:border-[#2563EB] focus:ring-3 focus:ring-blue-100 transition"
                      />

                      {/* Live preview for Option */}
                      {optionText.trim() ? (
                        <div className="rounded-lg bg-slate-50 p-3 border border-slate-200/80 text-sm">
                          <span className="text-[10px] font-semibold text-slate-500 block mb-1 uppercase tracking-wider">Preview:</span>
                          <QuestionMathRenderer content={optionText} />
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-[#64748B]">
              Soal bentuk essay/uraian tidak memerlukan pilihan ganda. Siswa akan mengetik jawaban langsung pada ruang ujian.
            </div>
          )}
        </div>
      </Panel>

      {/* 3. Pengaturan Tambahan (Bobot Poin, Tingkat Kesulitan, Pembahasan) */}
      <Accordion title="Pengaturan Tambahan (Tingkat Kesulitan, Poin, Pembahasan)">
        <div className="grid gap-4 md:grid-cols-3">
          <FieldLabel label="Tingkat Kesulitan">
            <select
              name="difficulty"
              defaultValue={editable?.difficulty ?? "medium"}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold"
            >
              <option value="easy">Mudah</option>
              <option value="medium">Sedang</option>
              <option value="hard">Sulit</option>
            </select>
          </FieldLabel>

          <FieldLabel label="Bobot Poin Soal">
            <input
              name="point"
              type="number"
              min="1"
              step="1"
              value={point}
              onChange={(event) => setPoint(event.target.value)}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold"
            />
          </FieldLabel>

          <FieldLabel label="Status Publikasi">
            <label className="flex items-center gap-2 pt-2 text-xs font-bold text-slate-700">
              <input
                name="is_active"
                type="checkbox"
                defaultChecked={editable?.is_active ?? true}
                className="size-4 rounded text-blue-600"
              />
              <span>Aktifkan Soal Ini</span>
            </label>
          </FieldLabel>

          <div className="md:col-span-3">
            <FieldLabel label="Pembahasan / Kunci Jawaban Lengkap (Opsional)">
              <textarea
                name="explanation"
                value={explanation}
                onChange={(event) => setExplanation(event.target.value)}
                placeholder="Catatan pembahasan atau langkah-langkah penyelesaian."
                className="min-h-24 w-full rounded-xl border border-slate-200 bg-white p-3 text-xs"
              />
            </FieldLabel>
          </div>
        </div>
      </Accordion>

      <input
        type="hidden"
        name="save_and_add_another"
        ref={saveAndAddAnotherRef}
        defaultValue="false"
      />

      {/* Action Footer Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E2E8F0] pt-5">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-[#0F172A] shadow-xs hover:bg-slate-50 active:scale-95"
        >
          Kembali
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="submit"
            onClick={() => {
              if (statusInputRef.current) {
                statusInputRef.current.value = "draft";
              }
              if (saveAndAddAnotherRef.current) {
                saveAndAddAnotherRef.current.value = "false";
              }
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-[#64748B] shadow-xs hover:bg-slate-50 active:scale-95 transition"
          >
            <Save className="size-4" />
            <span>Simpan Draf</span>
          </button>

          <button
            type="submit"
            onClick={() => {
              if (statusInputRef.current) {
                statusInputRef.current.value = "published";
              }
              if (saveAndAddAnotherRef.current) {
                saveAndAddAnotherRef.current.value = "true";
              }
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-blue-600 bg-blue-50 px-4 py-2.5 text-xs font-bold text-blue-700 shadow-xs hover:bg-blue-100 active:scale-95 transition"
            title="Simpan soal dan langsung buka formulir baru untuk soal berikutnya"
          >
            <Plus className="size-4" />
            <span>Simpan & Buat Lagi</span>
          </button>

          <button
            type="submit"
            onClick={() => {
              if (statusInputRef.current) {
                statusInputRef.current.value = "published";
              }
              if (saveAndAddAnotherRef.current) {
                saveAndAddAnotherRef.current.value = "false";
              }
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 active:scale-95 transition"
          >
            <Send className="size-4" />
            <span>Terbitkan Soal</span>
          </button>
        </div>
      </div>
    </form>
  );
}
