import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { ActionToast } from "@/components/master-data/action-toast";
import { DataTable } from "@/components/master-data/data-table";
import { FormSection } from "@/components/master-data/form-section";
import { StatusBadge } from "@/components/master-data/status-badge";
import {
  saveQuestionAction,
  toggleQuestionActiveAction,
  updateQuestionStatusAction,
} from "@/features/question-bank/actions";
import { QuestionBankFilters } from "@/features/question-bank/components/question-bank-filters";
import { QuestionPreview } from "@/features/question-bank/components/question-preview";
import { QuestionStatusBadge } from "@/features/question-bank/components/question-status-badge";
import {
  getDefaultSchoolId,
  getQuestionCategoryOptions,
  getQuestions,
  getScopedSubjectOptions,
} from "@/features/question-bank/queries";
import { requirePermission } from "@/lib/auth/require-permission";

type PageProps = {
  searchParams: Promise<{
    q?: string;
    subject_id?: string;
    category_id?: string;
    type?: string;
    difficulty?: string;
    status?: string;
    edit?: string;
    notice?: string;
    message?: string;
  }>;
};

function optionValue(
  question:
    | {
        question_options?: Array<{
          option_label: string;
          option_text: string;
          is_correct: boolean;
          order_number: number;
        }> | null;
      }
    | null
    | undefined,
  label: string,
) {
  const option = question?.question_options?.find(
    (item) => item.option_label === label,
  );

  return option?.option_text ?? "";
}

function correctOption(
  question:
    | {
        question_options?: Array<{
          option_label: string;
          is_correct: boolean;
        }> | null;
      }
    | null
    | undefined,
) {
  return (
    question?.question_options?.find((option) => option.is_correct)
      ?.option_label ?? "A"
  );
}

export default async function QuestionsPage({ searchParams }: PageProps) {
  await requirePermission("question_bank.view");
  const params = await searchParams;
  const filters = {
    q: params.q,
    subject_id: params.subject_id,
    category_id: params.category_id,
    type: params.type,
    difficulty: params.difficulty,
    status: params.status,
  };
  const [subjects, schoolId, categories, questions] = await Promise.all([
    getScopedSubjectOptions(),
    getDefaultSchoolId(),
    getQuestionCategoryOptions(params.subject_id),
    getQuestions(filters),
  ]);
  const editable = questions.find((question) => question.id === params.edit);

  return (
    <div className="space-y-6">
      <ActionToast status={params.notice} message={params.message} />
      <DashboardPageHeader
        title="Semua Soal"
        description="Kelola soal pilihan ganda dan essay. Target kelas tidak disimpan di soal; targeting akan dilakukan pada paket dan jadwal ujian."
      />

      <FormSection
        title={editable ? "Edit Soal" : "Tambah Soal"}
        description="Untuk pilihan ganda, isi minimal dua opsi dan pilih tepat satu jawaban benar. Essay tidak membuat question_options."
      >
        <form action={saveQuestionAction} className="grid gap-4">
          <input type="hidden" name="id" defaultValue={editable?.id ?? ""} />
          <input type="hidden" name="school_id" value={schoolId ?? ""} />

          <div className="grid gap-4 md:grid-cols-3">
            <select
              name="subject_id"
              defaultValue={
                editable?.subject_id ?? params.subject_id ?? subjects[0]?.value ?? ""
              }
              className="rounded-md border px-3 py-2 text-sm"
              required
            >
              {subjects.map((subject) => (
                <option key={subject.value} value={subject.value}>
                  {subject.label}
                </option>
              ))}
            </select>
            <select
              name="category_id"
              defaultValue={editable?.category_id ?? params.category_id ?? ""}
              className="rounded-md border px-3 py-2 text-sm"
            >
              <option value="">Tanpa kategori</option>
              {categories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
            <select
              name="type"
              defaultValue={editable?.type ?? "multiple_choice"}
              className="rounded-md border px-3 py-2 text-sm"
            >
              <option value="multiple_choice">Pilihan ganda</option>
              <option value="essay">Essay</option>
            </select>
            <select
              name="difficulty"
              defaultValue={editable?.difficulty ?? "medium"}
              className="rounded-md border px-3 py-2 text-sm"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
            <input
              name="point"
              type="number"
              min="0.01"
              step="0.01"
              defaultValue={editable?.point ?? 1}
              className="rounded-md border px-3 py-2 text-sm"
              required
            />
            <select
              name="status"
              defaultValue={
                editable?.status === "published" ? "published" : "draft"
              }
              className="rounded-md border px-3 py-2 text-sm"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>

          <textarea
            name="content"
            defaultValue={editable?.content ?? ""}
            placeholder="Tulis konten soal"
            className="min-h-32 rounded-md border px-3 py-2 text-sm"
            required
          />

          <div className="rounded-lg border bg-background p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold">Opsi Pilihan Ganda</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Untuk soal essay, opsi ini akan diabaikan.
                </p>
              </div>
              <select
                name="correct_option"
                defaultValue={correctOption(editable)}
                className="rounded-md border px-3 py-2 text-sm"
              >
                {["A", "B", "C", "D"].map((label) => (
                  <option key={label} value={label}>
                    Jawaban {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {["A", "B", "C", "D"].map((label) => (
                <label key={label} className="flex gap-2 text-sm">
                  <span className="mt-2 font-semibold">{label}</span>
                  <textarea
                    name={`option_${label}`}
                    defaultValue={optionValue(editable, label)}
                    placeholder={`Opsi ${label}`}
                    className="min-h-20 flex-1 rounded-md border px-3 py-2 text-sm"
                  />
                </label>
              ))}
            </div>
          </div>

          <textarea
            name="explanation"
            defaultValue={editable?.explanation ?? ""}
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

          <div className="flex justify-end">
            <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
              Simpan Soal
            </button>
          </div>
        </form>
      </FormSection>

      <QuestionBankFilters
        subjects={subjects}
        categories={categories}
        defaults={filters}
        includeQuestionFilters
      />

      <DataTable
        columns={[
          "Soal",
          "Mapel",
          "Kategori",
          "Tipe",
          "Difficulty",
          "Poin",
          "Status",
          "Aktif",
          "Aksi",
        ]}
        isEmpty={questions.length === 0}
        empty={
          <EmptyState
            title="Belum ada soal"
            description="Tambahkan soal pilihan ganda atau essay untuk mapel yang tersedia."
          />
        }
      >
        {questions.map((question) => (
          <tr key={question.id} className="align-top">
            <td className="max-w-sm px-4 py-3">
              <div className="line-clamp-3 whitespace-pre-wrap font-medium">
                {question.content}
              </div>
              <div className="mt-3">
                <QuestionPreview question={question} />
              </div>
            </td>
            <td className="px-4 py-3">
              {question.subjects
                ? `${question.subjects.code} - ${question.subjects.name}`
                : "-"}
            </td>
            <td className="px-4 py-3">
              {question.question_categories?.name ?? "-"}
            </td>
            <td className="px-4 py-3">
              {question.type === "multiple_choice" ? "PG" : "Essay"}
            </td>
            <td className="px-4 py-3">{question.difficulty}</td>
            <td className="px-4 py-3">{question.point}</td>
            <td className="px-4 py-3">
              <QuestionStatusBadge status={question.status} />
            </td>
            <td className="px-4 py-3">
              <StatusBadge active={Boolean(question.is_active)} />
            </td>
            <td className="px-4 py-3">
              <div className="flex flex-wrap gap-2">
                <a
                  href={`/dashboard/question-bank/questions?edit=${question.id}`}
                  className="rounded-md border px-3 py-1.5 text-xs hover:bg-muted"
                >
                  Edit
                </a>
                <form action={updateQuestionStatusAction}>
                  <input type="hidden" name="id" value={question.id} />
                  <input type="hidden" name="status" value="published" />
                  <button className="rounded-md border px-3 py-1.5 text-xs hover:bg-muted">
                    Publish
                  </button>
                </form>
                <form action={updateQuestionStatusAction}>
                  <input type="hidden" name="id" value={question.id} />
                  <input type="hidden" name="status" value="draft" />
                  <button className="rounded-md border px-3 py-1.5 text-xs hover:bg-muted">
                    Draft
                  </button>
                </form>
                <form action={updateQuestionStatusAction}>
                  <input type="hidden" name="id" value={question.id} />
                  <input type="hidden" name="status" value="archived" />
                  <button className="rounded-md border px-3 py-1.5 text-xs hover:bg-muted">
                    Archive
                  </button>
                </form>
                <form action={toggleQuestionActiveAction}>
                  <input type="hidden" name="id" value={question.id} />
                  <input
                    type="hidden"
                    name="is_active"
                    value={question.is_active ? "false" : "true"}
                  />
                  <button className="rounded-md border px-3 py-1.5 text-xs hover:bg-muted">
                    {question.is_active ? "Nonaktifkan" : "Aktifkan"}
                  </button>
                </form>
              </div>
            </td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}
