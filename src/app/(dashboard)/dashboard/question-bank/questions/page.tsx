import Link from "next/link";

import { ConfirmLinkButton } from "@/components/dashboard/confirm-link-button";
import { ConfirmSubmitButton } from "@/components/dashboard/confirm-submit-button";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { ActionToast } from "@/components/master-data/action-toast";
import { DataTable } from "@/components/master-data/data-table";
import { FormSection } from "@/components/master-data/form-section";
import { StatusBadge } from "@/components/master-data/status-badge";
import {
  publishAllQuestionsAction,
  toggleQuestionActiveAction,
  updateQuestionStatusAction,
} from "@/features/question-bank/actions";
import { QuestionBankFilters } from "@/features/question-bank/components/question-bank-filters";
import { QuestionForm } from "@/features/question-bank/components/question-form";
import { QuestionPreview } from "@/features/question-bank/components/question-preview";
import { QuestionStatusBadge } from "@/features/question-bank/components/question-status-badge";
import {
  getDefaultSchoolId,
  getQuestionCategoryOptions,
  getQuestionStimulusOptions,
  getQuestions,
  getScopedSubjectOptions,
} from "@/features/question-bank/queries";
import { requirePermission } from "@/lib/auth/require-permission";
import { hasPermission } from "@/lib/auth/has-permission";

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

export default async function QuestionsPage({ searchParams }: PageProps) {
  const user = await requirePermission("question_bank.view");
  const params = await searchParams;
  const canUseImportCenter = hasPermission(user, "import_export.view");
  const filters = {
    q: params.q,
    subject_id: params.subject_id,
    category_id: params.category_id,
    type: params.type,
    difficulty: params.difficulty,
    status: params.status,
  };
  const exportParams = new URLSearchParams();

  for (const [key, value] of Object.entries(filters)) {
    if (value) {
      exportParams.set(key, value);
    }
  }

  const exportHref = `/api/question-bank/export${
    exportParams.size > 0 ? `?${exportParams.toString()}` : ""
  }`;
  const [subjects, schoolId, categories, stimuli, questions] =
    await Promise.all([
      getScopedSubjectOptions(),
      getDefaultSchoolId(),
      getQuestionCategoryOptions(params.subject_id),
      getQuestionStimulusOptions(params.subject_id),
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
        title="Import / Export Bank Soal"
        description={
          canUseImportCenter
            ? "Import resmi Bank Soal untuk admin dipusatkan melalui Import Center."
            : "Akses langsung untuk import guru dan export CSV sesuai filter daftar soal."
        }
      >
        <div className="flex flex-wrap gap-2">
          {canUseImportCenter ? (
            <Link
              href="/dashboard/import-export"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
            >
              Import melalui Import Center
            </Link>
          ) : (
            <>
              <Link
                href="/dashboard/question-bank/import-word"
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
              >
                Import Word
              </Link>
              <Link
                href="/dashboard/question-bank/import-excel"
                className="rounded-md border px-4 py-2 text-sm font-medium transition hover:bg-muted"
              >
                Import Excel/CSV
              </Link>
            </>
          )}
          <Link
            href="/api/templates/questions-word"
            className="rounded-md border px-4 py-2 text-sm font-medium transition hover:bg-muted"
          >
            Template Word
          </Link>
          <Link
            href="/api/templates/questions-excel"
            className="rounded-md border px-4 py-2 text-sm font-medium transition hover:bg-muted"
          >
            Template Excel
          </Link>
          <ConfirmLinkButton
            href={exportHref}
            confirmMessage="Export bank soal sesuai filter saat ini ke CSV?"
            variant="outline"
          >
            Export CSV
          </ConfirmLinkButton>
        </div>
      </FormSection>

      <FormSection
        title={editable ? "Edit Soal" : "Tambah Soal"}
        description="Simpan dari form ini akan menjadi draft. Gunakan tombol Publish di daftar soal setelah soal siap."
      >
        <QuestionForm
          editable={editable}
          schoolId={schoolId ?? ""}
          subjects={subjects}
          categories={categories}
          stimuli={stimuli}
          defaultSubjectId={params.subject_id}
          defaultCategoryId={params.category_id}
        />
      </FormSection>

      <QuestionBankFilters
        subjects={subjects}
        categories={categories}
        defaults={filters}
        includeQuestionFilters
      />

      <FormSection
        title="Aksi Massal"
        description="Publish semua soal draft yang sudah valid dan aktif sesuai akses mapel akun ini."
      >
        <form action={publishAllQuestionsAction}>
          <ConfirmSubmitButton
            confirmMessage="Publish semua soal draft yang valid dan aktif? Soal yang belum lengkap atau nonaktif akan dilewati."
            loadingText="Mem-publish..."
            variant="default"
          >
            Publish Semua Draft
          </ConfirmSubmitButton>
        </form>
      </FormSection>

      <DataTable
        columns={[
          "Soal",
          "Mapel",
          "Kategori",
          "Tipe",
          "Difficulty",
          "Poin",
          "Versi",
          "Media",
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
            <td className="px-4 py-3">v{question.current_version ?? 1}</td>
            <td className="px-4 py-3">
              {question.stimulus_id ? "Stimulus" : ""}
              {question.question_attachments?.length ? (
                <div className="text-xs text-muted-foreground">
                  {question.question_attachments.length} media
                </div>
              ) : question.stimulus_id ? null : (
                "-"
              )}
            </td>
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
                  <ConfirmSubmitButton confirmMessage="Publish soal ini? Pastikan pertanyaan, opsi, dan jawaban benar sudah siap digunakan di paket ujian.">
                    Publish
                  </ConfirmSubmitButton>
                </form>
                <form action={updateQuestionStatusAction}>
                  <input type="hidden" name="id" value={question.id} />
                  <input type="hidden" name="status" value="draft" />
                  <ConfirmSubmitButton confirmMessage="Ubah status soal ini menjadi draft?">
                    Draft
                  </ConfirmSubmitButton>
                </form>
                <form action={updateQuestionStatusAction}>
                  <input type="hidden" name="id" value={question.id} />
                  <input type="hidden" name="status" value="archived" />
                  <ConfirmSubmitButton
                    confirmMessage="Arsipkan soal ini? Soal yang diarsipkan tidak tampil sebagai soal aktif untuk dipakai."
                    variant="danger"
                  >
                    Archive
                  </ConfirmSubmitButton>
                </form>
                <form action={toggleQuestionActiveAction}>
                  <input type="hidden" name="id" value={question.id} />
                  <input
                    type="hidden"
                    name="is_active"
                    value={question.is_active ? "false" : "true"}
                  />
                  {question.is_active ? (
                    <ConfirmSubmitButton confirmMessage="Nonaktifkan soal ini? Soal nonaktif tidak bisa dipublish dan tidak disarankan dipakai dalam paket ujian.">
                      Nonaktifkan
                    </ConfirmSubmitButton>
                  ) : (
                    <ConfirmSubmitButton confirmMessage="Aktifkan soal ini kembali?">
                      Aktifkan
                    </ConfirmSubmitButton>
                  )}
                </form>
              </div>
            </td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}
