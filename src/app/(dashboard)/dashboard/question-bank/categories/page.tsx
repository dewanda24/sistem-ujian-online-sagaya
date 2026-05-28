import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { ActionToast } from "@/components/master-data/action-toast";
import { DataTable } from "@/components/master-data/data-table";
import { FormSection } from "@/components/master-data/form-section";
import { StatusBadge } from "@/components/master-data/status-badge";
import {
  deleteQuestionCategoryAction,
  saveQuestionCategoryAction,
  toggleQuestionCategoryAction,
} from "@/features/question-bank/actions";
import { QuestionBankFilters } from "@/features/question-bank/components/question-bank-filters";
import {
  getDefaultSchoolId,
  getQuestionCategories,
  getScopedSubjectOptions,
} from "@/features/question-bank/queries";
import { requirePermission } from "@/lib/auth/require-permission";

type PageProps = {
  searchParams: Promise<{
    q?: string;
    subject_id?: string;
    edit?: string;
    notice?: string;
    message?: string;
  }>;
};

export default async function QuestionCategoriesPage({
  searchParams,
}: PageProps) {
  await requirePermission("question_bank.view");
  const params = await searchParams;
  const [subjects, schoolId, categories] = await Promise.all([
    getScopedSubjectOptions(),
    getDefaultSchoolId(),
    getQuestionCategories({
      q: params.q,
      subject_id: params.subject_id,
    }),
  ]);
  const editable = categories.find((category) => category.id === params.edit);

  return (
    <div className="space-y-6">
      <ActionToast status={params.notice} message={params.message} />
      <DashboardPageHeader
        title="Kategori Soal"
        description="Kelola kategori soal per mata pelajaran. Guru hanya melihat mapel yang ditugaskan melalui teacher_subjects."
      />

      <FormSection
        title={editable ? "Edit Kategori" : "Tambah Kategori"}
        description="Kategori membantu filter bank soal saat menyusun paket ujian nanti."
      >
        <form
          action={saveQuestionCategoryAction}
          className="grid gap-4 md:grid-cols-2"
        >
          <input type="hidden" name="id" defaultValue={editable?.id ?? ""} />
          <input type="hidden" name="school_id" value={schoolId ?? ""} />
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
          <input
            name="name"
            defaultValue={editable?.name ?? ""}
            placeholder="Contoh: Aljabar"
            className="rounded-md border px-3 py-2 text-sm"
            required
          />
          <textarea
            name="description"
            defaultValue={editable?.description ?? ""}
            placeholder="Deskripsi kategori"
            className="min-h-20 rounded-md border px-3 py-2 text-sm md:col-span-2"
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              name="is_active"
              type="checkbox"
              defaultChecked={editable?.is_active ?? true}
            />
            Aktif
          </label>
          <div className="flex justify-end md:col-span-2">
            <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
              Simpan Kategori
            </button>
          </div>
        </form>
      </FormSection>

      <QuestionBankFilters
        subjects={subjects}
        defaults={{
          q: params.q,
          subject_id: params.subject_id,
        }}
      />

      <DataTable
        columns={["Kategori", "Mapel", "Deskripsi", "Status", "Aksi"]}
        isEmpty={categories.length === 0}
        empty={
          <EmptyState
            title="Belum ada kategori"
            description="Tambahkan kategori soal untuk mapel yang tersedia."
          />
        }
      >
        {categories.map((category) => (
          <tr key={category.id}>
            <td className="px-4 py-3 font-medium">{category.name}</td>
            <td className="px-4 py-3">
              {category.subjects
                ? `${category.subjects.code} - ${category.subjects.name}`
                : "-"}
            </td>
            <td className="px-4 py-3 text-muted-foreground">
              {category.description || "-"}
            </td>
            <td className="px-4 py-3">
              <StatusBadge active={Boolean(category.is_active)} />
            </td>
            <td className="px-4 py-3">
              <div className="flex flex-wrap gap-2">
                <a
                  href={`/dashboard/question-bank/categories?edit=${category.id}`}
                  className="rounded-md border px-3 py-1.5 text-xs hover:bg-muted"
                >
                  Edit
                </a>
                <form action={toggleQuestionCategoryAction}>
                  <input type="hidden" name="id" value={category.id} />
                  <input
                    type="hidden"
                    name="is_active"
                    value={category.is_active ? "false" : "true"}
                  />
                  <button className="rounded-md border px-3 py-1.5 text-xs hover:bg-muted">
                    {category.is_active ? "Nonaktifkan" : "Aktifkan"}
                  </button>
                </form>
                <form action={deleteQuestionCategoryAction}>
                  <input type="hidden" name="id" value={category.id} />
                  <button className="rounded-md border px-3 py-1.5 text-xs text-destructive hover:bg-muted">
                    Arsipkan
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
