"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";

import { saveQuestionAction } from "@/features/question-bank/actions";
import { QuestionMathRenderer } from "@/features/question-bank/components/question-math-renderer";
import { QuestionMediaPreview } from "@/features/question-bank/components/question-media-preview";
import type { SelectOption } from "@/lib/master-data/queries";

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
};

const labels = ["A", "B", "C", "D"] as const;
type StimulusMode = "none" | "existing" | "new";

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

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <fieldset className="rounded-lg border bg-background p-4">
      <legend className="px-1 text-sm font-semibold">{title}</legend>
      {description ? (
        <p className="mb-3 mt-1 text-xs leading-5 text-muted-foreground">
          {description}
        </p>
      ) : null}
      {children}
    </fieldset>
  );
}

function ErrorList({ errors }: { errors: string[] }) {
  if (errors.length === 0) {
    return null;
  }

  return (
    <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
      <div className="font-medium">Periksa lagi sebelum menyimpan:</div>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        {errors.map((error) => (
          <li key={error}>{error}</li>
        ))}
      </ul>
    </div>
  );
}

function MathHelper() {
  const examples = [
    "$$x^2 + 5x + 6 = 0$$",
    "\\frac{a}{b}",
    "\\sqrt{x}",
    "\\sum_{i=1}^{n}",
    "\\pi",
  ];

  return (
    <div className="rounded-md border border-dashed bg-muted/40 p-3 text-sm">
      <div className="font-medium">Contoh rumus yang bisa dipakai</div>
      <div className="mt-2 grid gap-2 md:grid-cols-2">
        {examples.map((example) => (
          <code
            key={example}
            className="rounded-md border bg-background px-2 py-1 text-xs"
          >
            {example}
          </code>
        ))}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Salin contoh, tempel di pertanyaan/opsi/pembahasan, lalu ubah sesuai
        kebutuhan.
      </p>
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
}: QuestionFormProps) {
  const attachment = firstAttachment(editable);
  const initialType = editable?.type ?? "multiple_choice";
  const initialSubjectId =
    editable?.subject_id ?? defaultSubjectId ?? subjects[0]?.value ?? "";
  const initialCorrectOption = correctOption(editable);

  const [subjectId, setSubjectId] = useState(initialSubjectId);
  const [type, setType] = useState(initialType);
  const [content, setContent] = useState(editable?.content ?? "");
  const [explanation, setExplanation] = useState(editable?.explanation ?? "");
  const [point, setPoint] = useState(String(editable?.point ?? "1"));
  const [correct, setCorrect] = useState(initialCorrectOption);
  const [options, setOptions] = useState<Record<string, string>>({
    A: optionValue(editable, "A"),
    B: optionValue(editable, "B"),
    C: optionValue(editable, "C"),
    D: optionValue(editable, "D"),
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
  const [attachmentCaption, setAttachmentCaption] = useState(
    attachment?.caption ?? "",
  );
  const [errors, setErrors] = useState<string[]>([]);
  const [showMathHelper, setShowMathHelper] = useState(false);

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
  const selectedStimulusLabel =
    filteredStimuli.find((stimulus) => stimulus.value === stimulusId)?.label ??
    (editable?.stimulus_id === stimulusId ? editable?.question_stimuli?.title : "");
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

  function validate() {
    const nextErrors: string[] = [];

    if (!subjectId) {
      nextErrors.push("Mapel wajib dipilih.");
    }

    if (!content.trim()) {
      nextErrors.push("Pertanyaan wajib diisi.");
    }

    if (!Number(point) || Number(point) <= 0) {
      nextErrors.push("Poin wajib lebih dari 0.");
    }

    if (isMultipleChoice) {
      const emptyLabels = labels.filter((label) => !options[label].trim());

      if (emptyLabels.length > 0) {
        nextErrors.push("Pilihan ganda wajib mengisi opsi A, B, C, dan D.");
      }

      if (!correct) {
        nextErrors.push("Pilih satu jawaban benar.");
      }
    }

    if (stimulusMode === "existing" && !stimulusId) {
      nextErrors.push("Pilih stimulus yang akan digunakan.");
    }

    if (
      stimulusMode === "new" &&
      (!newStimulusTitle.trim() ||
        (!newStimulusContent.trim() && !newStimulusMediaUrl.trim()))
    ) {
      nextErrors.push(
        "Stimulus baru wajib memiliki judul dan isi bacaan atau URL media.",
      );
    }

    setErrors(nextErrors);
    return nextErrors.length === 0;
  }

  return (
    <form
      action={saveQuestionAction}
      className="grid gap-4"
      onSubmit={(event) => {
        if (!validate()) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" defaultValue={editable?.id ?? ""} />
      <input type="hidden" name="school_id" value={schoolId} />
      <input type="hidden" name="status" value="draft" />

      <ErrorList errors={errors} />

      <Section
        title="Informasi Soal"
        description="Pilih mapel, kategori, tipe soal, tingkat kesulitan, dan poin."
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Mapel</span>
            <select
              name="subject_id"
              value={subjectId}
              onChange={(event) => {
                setSubjectId(event.target.value);
                setStimulusId("");
                setStimulusMode("none");
              }}
              className="rounded-md border px-3 py-2 text-sm"
              required
            >
              <option value="">Pilih mapel</option>
              {subjects.map((subject) => (
                <option key={subject.value} value={subject.value}>
                  {subject.label}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Kategori</span>
            <select
              name="category_id"
              defaultValue={editable?.category_id ?? defaultCategoryId ?? ""}
              className="rounded-md border px-3 py-2 text-sm"
            >
              <option value="">Tanpa kategori</option>
              {filteredCategories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Tipe Soal</span>
            <select
              name="type"
              value={type}
              onChange={(event) => setType(event.target.value)}
              className="rounded-md border px-3 py-2 text-sm"
            >
              <option value="multiple_choice">Pilihan ganda</option>
              <option value="essay">Essay</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Difficulty</span>
            <select
              name="difficulty"
              defaultValue={editable?.difficulty ?? "medium"}
              className="rounded-md border px-3 py-2 text-sm"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Poin</span>
            <input
              name="point"
              type="number"
              min="0.01"
              step="0.01"
              value={point}
              onChange={(event) => setPoint(event.target.value)}
              className="rounded-md border px-3 py-2 text-sm"
              required
            />
          </label>
        </div>
      </Section>

      <Section title="Pertanyaan" description="Tulis pertanyaan dengan jelas.">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setShowMathHelper((current) => !current)}
            className="rounded-md border px-3 py-1.5 text-xs hover:bg-muted"
          >
            Tambah Rumus
          </button>
          <span className="text-xs text-muted-foreground">
            Mendukung contoh seperti $$x^2$$, \frac{"{a}"}{"{b}"}, dan \sqrt
            {"{x}"}.
          </span>
        </div>
        {showMathHelper ? <MathHelper /> : null}
        <textarea
          name="content"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Tulis konten soal"
          className="min-h-36 w-full rounded-md border px-3 py-2 text-sm"
          required
        />
      </Section>

      {isMultipleChoice ? (
        <Section
          title="Pilihan Jawaban"
          description="Isi semua opsi A-D dan pilih satu jawaban benar."
        >
          <div className="mb-3 grid gap-1 text-sm md:max-w-xs">
            <span className="font-medium">Jawaban benar</span>
            <select
              name="correct_option"
              value={correct}
              onChange={(event) => setCorrect(event.target.value)}
              className="rounded-md border px-3 py-2 text-sm"
              required
            >
              <option value="">Pilih jawaban benar</option>
              {labels.map((label) => (
                <option key={label} value={label}>
                  Jawaban {label}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {labels.map((label) => (
              <label key={label} className="flex gap-2 text-sm">
                <span className="mt-2 w-5 font-semibold">{label}</span>
                <textarea
                  name={`option_${label}`}
                  value={options[label]}
                  onChange={(event) =>
                    setOptions((current) => ({
                      ...current,
                      [label]: event.target.value,
                    }))
                  }
                  placeholder={`Opsi ${label}`}
                  className="min-h-20 flex-1 rounded-md border px-3 py-2 text-sm"
                  required
                />
              </label>
            ))}
          </div>
        </Section>
      ) : null}

      <Section
        title="Stimulus / Bacaan / Pengantar Soal"
        description="Opsional. Gunakan untuk soal berbasis bacaan, gambar, audio, video, atau pengantar bersama."
      >
        <details className="rounded-md border bg-card p-3">
          <summary className="cursor-pointer text-sm font-medium">
            Atur stimulus
          </summary>
          <input type="hidden" name="stimulus_mode" value={stimulusMode} />
          <div className="mt-4 grid gap-4">
            <div className="grid gap-2 text-sm md:grid-cols-3">
              {[
                ["none", "Tanpa stimulus"],
                ["existing", "Pilih stimulus yang sudah ada"],
                ["new", "Buat stimulus baru"],
              ].map(([value, label]) => (
                <label
                  key={value}
                  className="flex items-center gap-2 rounded-md border px-3 py-2"
                >
                  <input
                    type="radio"
                    name="stimulus_mode_choice"
                    value={value}
                    checked={stimulusMode === value}
                    onChange={() => {
                      const nextMode = value as StimulusMode;

                      setStimulusMode(nextMode);
                      if (nextMode !== "existing") {
                        setStimulusId("");
                      }
                    }}
                  />
                  {label}
                </label>
              ))}
            </div>

            {stimulusMode === "existing" ? (
              <div className="grid gap-3">
                <label className="grid gap-1 text-sm">
                  <span className="font-medium">Stimulus yang sudah ada</span>
                  <select
                    name="stimulus_id"
                    value={stimulusId}
                    onChange={(event) => setStimulusId(event.target.value)}
                    className="rounded-md border px-3 py-2 text-sm"
                    required
                  >
                    <option value="">Pilih stimulus</option>
                    {filteredStimuli.map((stimulus) => (
                      <option key={stimulus.value} value={stimulus.value}>
                        {stimulus.label}
                      </option>
                    ))}
                  </select>
                </label>
                {selectedStimulus ? (
                  <div className="rounded-md border border-dashed p-3 text-sm">
                    <div className="font-medium">{selectedStimulus.label}</div>
                    <QuestionMathRenderer
                      content={selectedStimulus.content}
                      className="mt-2 text-muted-foreground"
                    />
                    <QuestionMediaPreview
                      mediaType={selectedStimulus.media_type}
                      url={selectedStimulus.media_url}
                      title={selectedStimulus.label}
                      className="mt-3"
                    />
                  </div>
                ) : null}
              </div>
            ) : null}

            {stimulusMode === "new" ? (
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  name="new_stimulus_title"
                  value={newStimulusTitle}
                  onChange={(event) => setNewStimulusTitle(event.target.value)}
                  placeholder="Judul stimulus baru"
                  className="rounded-md border px-3 py-2 text-sm"
                  required
                />
                <select
                  name="new_stimulus_media_type"
                  value={newStimulusMediaType}
                  onChange={(event) => setNewStimulusMediaType(event.target.value)}
                  className="rounded-md border px-3 py-2 text-sm"
                >
                  <option value="">Text</option>
                  <option value="image">Image</option>
                  <option value="audio">Audio</option>
                  <option value="video">Video</option>
                  <option value="file">File/PDF</option>
                  <option value="link">Link</option>
                </select>
                <input
                  name="new_stimulus_media_url"
                  value={newStimulusMediaUrl}
                  onChange={(event) => setNewStimulusMediaUrl(event.target.value)}
                  placeholder="URL media stimulus"
                  className="rounded-md border px-3 py-2 text-sm md:col-span-2"
                />
                <textarea
                  name="new_stimulus_content"
                  value={newStimulusContent}
                  onChange={(event) => setNewStimulusContent(event.target.value)}
                  placeholder="Teks stimulus atau bacaan"
                  className="min-h-24 rounded-md border px-3 py-2 text-sm md:col-span-2"
                />
              </div>
            ) : null}
          </div>
        </details>
      </Section>

      <Section title="Media" description="Tambahkan satu link media pendukung soal.">
        <div className="grid gap-3 md:grid-cols-2">
          <select
            name="attachment_media_type"
            value={attachmentMediaType}
            onChange={(event) => setAttachmentMediaType(event.target.value)}
            className="rounded-md border px-3 py-2 text-sm"
          >
            <option value="image">Image</option>
            <option value="audio">Audio</option>
            <option value="video">Video</option>
            <option value="file">File/PDF</option>
            <option value="link">Link</option>
          </select>
          <input
            name="attachment_file_name"
            defaultValue={attachment?.file_name ?? ""}
            placeholder="Nama file/link"
            className="rounded-md border px-3 py-2 text-sm"
          />
          <input
            name="attachment_url"
            value={attachmentUrl}
            onChange={(event) => setAttachmentUrl(event.target.value)}
            placeholder="https://..."
            className="rounded-md border px-3 py-2 text-sm md:col-span-2"
          />
          <input
            name="attachment_caption"
            value={attachmentCaption}
            onChange={(event) => setAttachmentCaption(event.target.value)}
            placeholder="Caption media"
            className="rounded-md border px-3 py-2 text-sm md:col-span-2"
          />
        </div>
      </Section>

      <Section title="Pengaturan Lanjutan">
        <div className="grid gap-3">
          <textarea
            name="explanation"
            value={explanation}
            onChange={(event) => setExplanation(event.target.value)}
            placeholder="Pembahasan atau catatan koreksi"
            className="min-h-24 rounded-md border px-3 py-2 text-sm"
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              name="is_active"
              type="checkbox"
              defaultChecked={editable?.is_active ?? true}
            />
            Aktif
          </label>
        </div>
      </Section>

      <Section
        title="Preview Soal"
        description="Preview ini mengikuti isi form sebelum guru menyimpan."
      >
        <div className="space-y-3 rounded-md border bg-card p-4 text-sm">
          {stimulusMode !== "none" &&
          (selectedStimulusLabel || newStimulusTitle || newStimulusContent) ? (
            <div className="rounded-md border border-dashed p-3">
              <div className="font-medium">
                {newStimulusTitle || selectedStimulusLabel || "Stimulus/Bacaan"}
              </div>
              {stimulusMode === "new" && newStimulusContent ? (
                <QuestionMathRenderer
                  content={newStimulusContent}
                  className="mt-2 text-muted-foreground"
                />
              ) : selectedStimulus?.content ? (
                <QuestionMathRenderer
                  content={selectedStimulus.content}
                  className="mt-2 text-muted-foreground"
                />
              ) : null}
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
                title={newStimulusTitle || selectedStimulusLabel}
                className="mt-3"
              />
            </div>
          ) : null}

          {content ? (
            <QuestionMathRenderer content={content} className="leading-7" />
          ) : (
            <div className="text-muted-foreground">
              Pertanyaan akan tampil di sini.
            </div>
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
              {labels.map((label) => (
                <div
                  key={label}
                  className="flex gap-2 rounded-md border px-3 py-2"
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
                    <span className="text-xs font-medium text-emerald-700">
                      Benar
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-md bg-muted p-3 text-muted-foreground">
              Soal essay tidak memakai pilihan jawaban.
            </div>
          )}

          {explanation ? (
            <div className="rounded-md bg-muted p-3 text-muted-foreground">
              <QuestionMathRenderer content={explanation} />
            </div>
          ) : null}
        </div>
      </Section>

      <div className="flex justify-end">
        <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
          {editable ? "Simpan sebagai Draft" : "Simpan Draft"}
        </button>
      </div>
    </form>
  );
}
