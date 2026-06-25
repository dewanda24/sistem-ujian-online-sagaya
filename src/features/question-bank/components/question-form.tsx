"use client";

import { useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Eye, Save, Send, Upload } from "lucide-react";

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

const mathTemplates = [
  { label: "Pecahan", value: "\\frac{3}{4}" },
  { label: "Akar", value: "\\sqrt{16}=4" },
  { label: "Pangkat", value: "x^{2}+2x+1" },
  { label: "Persamaan", value: "2x+5=17" },
  { label: "Limit", value: "\\lim_{x \\to 2}(x^2)=4" },
  { label: "Integral", value: "\\int_{0}^{1} x^2\\,dx" },
] as const;

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
    <section className="rounded-lg border border-[#E2E8F0] bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-[#0F172A]">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm leading-6 text-[#64748B]">{description}</p>
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
    <details className="rounded-lg border border-[#E2E8F0] bg-white p-4 shadow-sm">
      <summary className="cursor-pointer text-sm font-semibold text-[#0F172A]">
        {title}
      </summary>
      <div className="mt-4">{children}</div>
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
      <span className="font-medium">{label}</span>
      {children}
    </label>
  );
}

function KesalahanList({ errors }: { errors: string[] }) {
  if (errors.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-[#EF4444]/30 bg-[#EF4444]/10 p-3 text-sm text-[#EF4444]">
      <div className="font-medium">Periksa lagi sebelum menyimpan:</div>
      <ul className="mt-2 list-disc space-y-1 pl-5">
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
  const selectedStimulus =
    filteredStimuli.find((stimulus) => stimulus.value === stimulusId) ??
    (editable?.stimulus_id === stimulusId
      ? {
          value: stimulusId,
          label: editable.question_stimuli?.title ?? "Stimulus",
          content: editable.question_stimuli?.content,
          media_url: editable.question_stimuli?.media_url,
          media_type: editable.question_stimuli?.media_type,
        }
      : null);
  const isMultipleChoice = type === "multiple_choice";

  function setSubmitStatus(status: "draft" | "published") {
    if (statusInputRef.current) {
      statusInputRef.current.value = status;
    }
  }

  function validate() {
    const nextKesalahans: string[] = [];

    if (!subjectId) nextKesalahans.push("Mapel wajib dipilih.");
    if (!content.trim()) nextKesalahans.push("Pertanyaan wajib diisi.");
    const parsedPoint = Number(point);

    if (!Number.isInteger(parsedPoint) || parsedPoint <= 0) {
      nextKesalahans.push("Poin wajib berupa bilangan bulat seperti 1, 2, atau 3.");
    }

    if (isMultipleChoice) {
      const emptyLabels = requiredLabels.filter((label) => !options[label].trim());
      if (emptyLabels.length > 0) {
        nextKesalahans.push("Pilihan ganda wajib mengisi opsi A, B, C, dan D.");
      }
      if (!correct) nextKesalahans.push("Pilih satu jawaban benar.");
      if (correct === "E" && !options.E.trim()) {
        nextKesalahans.push("Opsi E wajib diisi jika dipilih sebagai jawaban benar.");
      }
    }

    if (stimulusMode === "existing" && !stimulusId) {
      nextKesalahans.push("Pilih stimulus yang akan digunakan.");
    }

    if (
      stimulusMode === "new" &&
      (!newStimulusTitle.trim() ||
        (!newStimulusContent.trim() && !newStimulusMediaUrl.trim()))
    ) {
      nextKesalahans.push(
        "Stimulus baru wajib memiliki judul dan isi bacaan atau URL media.",
      );
    }

    setKesalahans(nextKesalahans);
    return nextKesalahans.length === 0;
  }

  function insertMathTemplate(template: string) {
    setContent((current) => `${current}${current ? "\n" : ""}$$${template}$$`);
  }

  async function uploadMedia(file: File, target: UploadTarget) {
    const payload = new FormData();

    payload.set("file", file);
    setUploadState({
      target,
      status: "uploading",
      message: "Mengupload media...",
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
      setAttachmentMediaType(result.media_type ?? "file");
      setAttachmentFileName(result.file_name ?? file.name);
    } else {
      setNewStimulusMediaUrl(result.url);
      setNewStimulusMediaType(result.media_type ?? "file");
    }

    setUploadState({
      target,
      status: "done",
      message: "Media berhasil diupload.",
    });
  }

  return (
    <form
      action={saveQuestionAction}
      className="grid gap-5"
      onSubmit={(event) => {
        if (!validate()) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" defaultValue={editable?.id ?? ""} />
      <input type="hidden" name="school_id" value={schoolId} />
      <input ref={statusInputRef} type="hidden" name="status" defaultValue="draft" />
      <input type="hidden" name="stimulus_mode" value={stimulusMode} />

      <KesalahanList errors={errors} />

      <Panel title="Informasi Soal">
        <div className="grid gap-4 md:grid-cols-3">
          <FieldLabel label="Mapel">
            <select
              name="subject_id"
              value={subjectId}
              onChange={(event) => {
                setSubjectId(event.target.value);
                setStimulusId("");
                setStimulusMode("none");
              }}
              className="rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm"
            >
              <option value="">Pilih mapel</option>
              {subjects.map((subject) => (
                <option key={subject.value} value={subject.value}>
                  {subject.label}
                </option>
              ))}
            </select>
          </FieldLabel>
          <FieldLabel label="Kategori">
            <select
              name="category_id"
              defaultValue={editable?.category_id ?? defaultCategoryId ?? ""}
              className="rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm"
            >
              <option value="">Tanpa kategori</option>
              {filteredCategories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </FieldLabel>
          <FieldLabel label="Tipe Soal">
            <select
              name="type"
              value={type}
              onChange={(event) => setType(event.target.value)}
              className="rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm"
            >
              <option value="multiple_choice">Pilihan ganda</option>
              <option value="essay">Essay</option>
            </select>
          </FieldLabel>
        </div>
      </Panel>

      <Panel title="Soal">
        <div className="grid gap-5">
          <div>
            <div className="mb-3 flex flex-wrap gap-2">
              {mathTemplates.map((template) => (
                <button
                  key={template.label}
                  type="button"
                  onClick={() => insertMathTemplate(template.value)}
                  className="rounded-lg border border-[#E2E8F0] px-3 py-1.5 text-xs text-[#0F172A] hover:bg-[#F8FAFC]"
                >
                  {template.label}
                </button>
              ))}
            </div>
            <textarea
              name="content"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="Tulis pertanyaan soal di sini."
              className="min-h-64 w-full rounded-lg border border-[#E2E8F0] px-4 py-3 text-sm leading-7"
            />
            <div className="mt-3 rounded-lg border border-dashed border-[#E2E8F0] bg-[#F8FAFC] p-4 text-sm">
              <div className="mb-2 font-medium text-[#0F172A]">Pratinjau matematika</div>
              {content ? (
                <QuestionMathRenderer content={content} className="leading-7" />
              ) : (
                <p className="text-[#64748B]">Pratinjau muncul saat konten soal diisi.</p>
              )}
            </div>
          </div>

          {isMultipleChoice ? (
            <div className="grid gap-4">
              <FieldLabel label="Jawaban Benar">
                <select
                  name="correct_option"
                  value={correct}
                  onChange={(event) => setCorrect(event.target.value)}
                  className="max-w-sm rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm"
                >
                  <option value="">Pilih jawaban benar</option>
                  {labels.map((label) => (
                    <option key={label} value={label}>
                      Jawaban {label}
                    </option>
                  ))}
                </select>
              </FieldLabel>
              <div className="grid gap-3 md:grid-cols-2">
                {labels.map((label) => (
                  <label key={label} className="flex gap-3 text-sm">
                    <span className="mt-3 w-6 font-semibold text-[#2563EB]">
                      {label}
                    </span>
                    <textarea
                      name={`option_${label}`}
                      value={options[label]}
                      onChange={(event) =>
                        setOptions((current) => ({
                          ...current,
                          [label]: event.target.value,
                        }))
                      }
                      placeholder={`Opsi ${label}${label === "E" ? " (opsional)" : ""}`}
                      className="min-h-24 flex-1 rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm"
                    />
                  </label>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-4 text-sm text-[#64748B]">
              Soal essay tidak membutuhkan pilihan jawaban. Tambahkan pembahasan di
              pengaturan tambahan bila diperlukan.
            </div>
          )}
        </div>
      </Panel>

      <Accordion title="Pengaturan Tambahan">
        <div className="grid gap-6">
          <div className="grid gap-4 md:grid-cols-3">
            <FieldLabel label="Difficulty">
              <select
                name="difficulty"
                defaultValue={editable?.difficulty ?? "medium"}
                className="rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm"
              >
                <option value="easy">Mudah</option>
                <option value="medium">Sedang</option>
                <option value="hard">Sulit</option>
              </select>
            </FieldLabel>
            <FieldLabel label="Poin">
              <input
                name="point"
                type="number"
                min="1"
                step="1"
                inputMode="numeric"
                value={point}
                onChange={(event) => setPoint(event.target.value)}
                className="rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm"
              />
            </FieldLabel>
            <FieldLabel label="Tag">
              <input
                name="tags"
                placeholder="Opsional"
                className="rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm"
              />
            </FieldLabel>
          </div>

          <div className="grid gap-4 border-t border-[#E2E8F0] pt-5">
            <div className="font-medium text-[#0F172A]">Stimulus</div>
            <div className="grid gap-2 text-sm md:grid-cols-3">
              {[
                ["none", "Tanpa stimulus"],
                ["existing", "Pilih stimulus"],
                ["new", "Buat stimulus baru"],
              ].map(([value, label]) => (
                <label
                  key={value}
                  className="flex items-center gap-2 rounded-lg border border-[#E2E8F0] px-3 py-2"
                >
                  <input
                    type="radio"
                    name="stimulus_mode_choice"
                    value={value}
                    checked={stimulusMode === value}
                    onChange={() => {
                      const nextMode = value as StimulusMode;
                      setStimulusMode(nextMode);
                      if (nextMode !== "existing") setStimulusId("");
                    }}
                  />
                  {label}
                </label>
              ))}
            </div>

            {stimulusMode === "existing" ? (
              <FieldLabel label="Stimulus">
                <select
                  name="stimulus_id"
                  value={stimulusId}
                  onChange={(event) => setStimulusId(event.target.value)}
                  className="rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm"
                >
                  <option value="">Pilih stimulus</option>
                  {filteredStimuli.map((stimulus) => (
                    <option key={stimulus.value} value={stimulus.value}>
                      {stimulus.label}
                    </option>
                  ))}
                </select>
              </FieldLabel>
            ) : null}

            {stimulusMode === "new" ? (
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  name="new_stimulus_title"
                  value={newStimulusTitle}
                  onChange={(event) => setNewStimulusTitle(event.target.value)}
                  placeholder="Judul stimulus baru"
                  className="rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm"
                />
                <select
                  name="new_stimulus_media_type"
                  value={newStimulusMediaType}
                  onChange={(event) => setNewStimulusMediaType(event.target.value)}
                  className="rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm"
                >
                  <option value="">Text</option>
                  <option value="image">Image</option>
                  <option value="audio">Audio</option>
                  <option value="video">Video</option>
                  <option value="file">File/PDF</option>
                  <option value="link">Link</option>
                </select>
                <input
                  type="hidden"
                  name="new_stimulus_media_url"
                  value={newStimulusMediaUrl}
                  readOnly
                />
                <div className="grid gap-2 rounded-lg border border-[#E2E8F0] p-3 text-sm md:col-span-2">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <span className="font-medium text-[#0F172A]">Media stimulus</span>
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#E2E8F0] px-3 py-2 text-xs hover:bg-[#F8FAFC]">
                      <Upload className="size-4" />
                      Upload media
                      <input
                        type="file"
                        accept="image/*,audio/*,video/*,application/pdf"
                        className="hidden"
                        onChange={(event) => {
                          const file = event.target.files?.[0];

                          if (file) void uploadMedia(file, "stimulus");
                          event.currentTarget.value = "";
                        }}
                      />
                    </label>
                  </div>
                  {newStimulusMediaUrl ? (
                    <QuestionMediaPreview
                      mediaType={newStimulusMediaType}
                      url={newStimulusMediaUrl}
                      title={newStimulusTitle || "Media stimulus"}
                    />
                  ) : (
                    <p className="text-[#64748B]">Belum ada media stimulus.</p>
                  )}
                  {uploadState?.target === "stimulus" ? (
                    <p
                      className={cn(
                        "text-xs",
                        uploadState.status === "error"
                          ? "text-[#EF4444]"
                          : "text-[#64748B]",
                      )}
                    >
                      {uploadState.message}
                    </p>
                  ) : null}
                </div>
                <textarea
                  name="new_stimulus_content"
                  value={newStimulusContent}
                  onChange={(event) => setNewStimulusContent(event.target.value)}
                  placeholder="Teks stimulus atau bacaan"
                  className="min-h-28 rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm md:col-span-2"
                />
              </div>
            ) : null}
          </div>

          <div className="grid gap-3 border-t border-[#E2E8F0] pt-5 md:grid-cols-2">
            <div className="font-medium text-[#0F172A] md:col-span-2">Media Soal</div>
            <select
              name="attachment_media_type"
              value={attachmentMediaType}
              onChange={(event) => setAttachmentMediaType(event.target.value)}
              className="rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm"
            >
              <option value="image">Gambar</option>
              <option value="audio">Audio</option>
              <option value="video">Video</option>
              <option value="file">File/PDF</option>
              <option value="link">Link</option>
            </select>
            <input
              name="attachment_file_name"
              value={attachmentFileName}
              onChange={(event) => setAttachmentFileName(event.target.value)}
              placeholder="Nama file/link"
              className="rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm"
            />
            <input
              type="hidden"
              name="attachment_url"
              value={attachmentUrl}
              readOnly
            />
            <div className="grid gap-2 rounded-lg border border-[#E2E8F0] p-3 text-sm md:col-span-2">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <span className="font-medium text-[#0F172A]">Lampiran soal</span>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#E2E8F0] px-3 py-2 text-xs hover:bg-[#F8FAFC]">
                  <Upload className="size-4" />
                  Upload media
                  <input
                    type="file"
                    accept="image/*,audio/*,video/*,application/pdf"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];

                      if (file) void uploadMedia(file, "attachment");
                      event.currentTarget.value = "";
                    }}
                  />
                </label>
              </div>
              {attachmentUrl ? (
                <QuestionMediaPreview
                  mediaType={attachmentMediaType}
                  url={attachmentUrl}
                  title={attachment?.file_name ?? "Media soal"}
                  caption={attachmentCaption}
                />
              ) : (
                <p className="text-[#64748B]">Belum ada media soal.</p>
              )}
              {uploadState?.target === "attachment" ? (
                <p
                  className={cn(
                    "text-xs",
                    uploadState.status === "error"
                      ? "text-[#EF4444]"
                      : "text-[#64748B]",
                  )}
                >
                  {uploadState.message}
                </p>
              ) : null}
            </div>
            <input
              name="attachment_caption"
              value={attachmentCaption}
              onChange={(event) => setAttachmentCaption(event.target.value)}
              placeholder="Caption media"
              className="rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm md:col-span-2"
            />
          </div>

          <div className="grid gap-4 border-t border-[#E2E8F0] pt-5">
            <FieldLabel label="Pembahasan">
              <textarea
                name="explanation"
                value={explanation}
                onChange={(event) => setExplanation(event.target.value)}
                placeholder="Pembahasan atau catatan koreksi"
                className="min-h-32 rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm"
              />
            </FieldLabel>
            <label className="flex items-center gap-2 text-sm">
              <input
                name="is_active"
                type="checkbox"
                defaultChecked={editable?.is_active ?? true}
              />
              Status Aktif
            </label>
          </div>
        </div>
      </Accordion>

      <div className="sticky bottom-4 z-10 flex flex-col gap-3 rounded-lg border border-[#E2E8F0] bg-white p-4 shadow-lg sm:flex-row sm:items-center sm:justify-between">
        <a
          href="/dashboard/question-bank/questions"
          className="inline-flex items-center justify-center rounded-lg border border-[#E2E8F0] px-4 py-2 text-sm text-[#0F172A] transition hover:bg-[#F8FAFC]"
        >
          Batal
        </a>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#E2E8F0] px-4 py-2 text-sm text-[#0F172A] transition hover:bg-[#F8FAFC]"
          >
            <Eye className="size-4" />
            Pratinjau
          </button>
          <button
            onClick={() => setSubmitStatus("draft")}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#1D4ED8]"
          >
            <Save className="size-4" />
            Simpan Draft
          </button>
          {canPublish ? (
            <button
              onClick={() => setSubmitStatus("published")}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#16A34A] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#15803D]"
            >
              <Send className="size-4" />
              Terbitkan
            </button>
          ) : null}
        </div>
      </div>

      {showPreview ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
          <div className="max-h-[88vh] w-full max-w-3xl overflow-auto rounded-xl bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-[#0F172A]">Pratinjau Soal</h2>
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className="rounded-xl border border-[#E2E8F0] px-3 py-1.5 text-sm"
              >
                Tutup
              </button>
            </div>
            <div className="space-y-4 text-sm">
              {stimulusMode !== "none" ? (
                <div className="rounded-xl border border-dashed border-[#E2E8F0] p-4">
                  <div className="font-medium">
                    {newStimulusTitle || selectedStimulus?.label || "Stimulus/Bacaan"}
                  </div>
                  <QuestionMathRenderer
                    content={
                      stimulusMode === "new"
                        ? newStimulusContent
                        : selectedStimulus?.content
                    }
                    className="mt-2 text-[#64748B]"
                  />
                  <QuestionMediaPreview
                    mediaType={
                      stimulusMode === "new"
                        ? newStimulusMediaType
                        : selectedStimulus?.media_type
                    }
                    url={
                      stimulusMode === "new"
                        ? newStimulusMediaUrl
                        : selectedStimulus?.media_url
                    }
                    title={newStimulusTitle || selectedStimulus?.label}
                    className="mt-3"
                  />
                </div>
              ) : null}
              {content ? (
                <QuestionMathRenderer content={content} className="leading-7" />
              ) : (
                <div className="text-[#64748B]">Pertanyaan akan tampil di sini.</div>
              )}
              {attachmentUrl ? (
                <QuestionMediaPreview
                  mediaType={attachmentMediaType}
                  url={attachmentUrl}
                  caption={attachmentCaption}
                />
              ) : null}
              {isMultipleChoice ? (
                <div className="grid gap-2">
                  {labels
                    .filter((label) => label !== "E" || options.E.trim())
                    .map((label) => (
                      <div
                        key={label}
                        className="flex gap-2 rounded-xl border border-[#E2E8F0] px-3 py-2"
                      >
                        <span className="font-semibold">{label}.</span>
                        <span className="flex-1">
                          {options[label] ? (
                            <QuestionMathRenderer content={options[label]} />
                          ) : (
                            `Opsi ${label}`
                          )}
                        </span>
                        {correct === label ? (
                          <span className="text-xs font-medium text-[#22C55E]">
                            Benar
                          </span>
                        ) : null}
                      </div>
                    ))}
                </div>
              ) : (
                <div className="rounded-xl bg-[#F8FAFC] p-3 text-[#64748B]">
                  Soal essay tidak memakai pilihan jawaban.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </form>
  );
}
