import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { ConfirmSubmitButton } from "@/components/dashboard/confirm-submit-button";
import { EmptyState } from "@/components/dashboard/empty-state";
import { StatusPill } from "@/components/dashboard/status-pill";
import { ActionToast } from "@/components/master-data/action-toast";
import { DataTable } from "@/components/master-data/data-table";
import { FormSection } from "@/components/master-data/form-section";
import { StatusBadge } from "@/components/master-data/status-badge";
import {
  archiveExamPackageAction,
  saveExamPackageAction,
  toggleExamPackageActiveAction,
  updateExamPackageStatusAction,
} from "@/features/exams/actions";
import {
  getDefaultSchoolId,
  getExamPackageQuestionIds,
  getExamPackages,
  getPublishedQuestionOptions,
  getScopedSubjectOptions,
} from "@/features/exams/queries";
import { requirePermission } from "@/lib/auth/require-permission";

type PageProps = {
  searchParams: Promise<{
    q?: string;
    subject_id?: string;
    status?: string;
    edit?: string;
    notice?: string;
    message?: string;
  }>;
};

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export default async function ExamPackagesPage({ searchParams }: PageProps) {
  await requirePermission("exam_packages.view");
  const params = await searchParams;
  const filters = {
    q: params.q,
    subject_id: params.subject_id,
    status: params.status,
  };
  const [subjects, schoolId, packages] = await Promise.all([
    getScopedSubjectOptions(),
    getDefaultSchoolId(),
    getExamPackages(filters),
  ]);
  const editable = packages.find((examPackage) => examPackage.id === params.edit);
  const selectedSubjectId =
    editable?.subject_id ?? params.subject_id ?? subjects[0]?.value ?? "";
  const [questions, selectedQuestionIds] = await Promise.all([
    getPublishedQuestionOptions(selectedSubjectId),
    getExamPackageQuestionIds(editable?.id),
  ]);
  const selectedQuestionSet = new Set(selectedQuestionIds);

  return (
    <div className="space-y-6">
      <ActionToast status={params.notice} message={params.message} />
      <DashboardPageHeader
        title="Paket Ujian"
        description="Susun paket dari soal published. Guru hanya melihat mapel dan soal yang ditugaskan."
      />

      <FormSection
        title={editable ? "Edit Paket Ujian" : "Tambah Paket Ujian"}
        description="Pilih mapel, durasi, status awal, dan soal yang akan masuk paket."
      >
        <form action={saveExamPackageAction} className="grid gap-4">
          <input type="hidden" name="id" defaultValue={editable?.id ?? ""} />
          <input type="hidden" name="school_id" value={schoolId ?? ""} />

          <div className="grid gap-4 md:grid-cols-3">
            <input
              name="title"
              defaultValue={editable?.title ?? ""}
              placeholder="Judul paket ujian"
              className="rounded-md border px-3 py-2 text-sm"
              required
            />
            <select
              name="subject_id"
              defaultValue={selectedSubjectId}
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
              name="duration_minutes"
              type="number"
              min="1"
              defaultValue={editable?.duration_minutes ?? 60}
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
            name="description"
            defaultValue={editable?.description ?? ""}
            placeholder="Deskripsi paket ujian"
            className="min-h-24 rounded-md border px-3 py-2 text-sm"
          />

          <div className="grid gap-3 rounded-lg border bg-background p-4 md:grid-cols-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                name="shuffle_questions"
                type="checkbox"
                defaultChecked={Boolean(editable?.shuffle_questions)}
              />
              Acak soal
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                name="shuffle_options"
                type="checkbox"
                defaultChecked={Boolean(editable?.shuffle_options)}
              />
              Acak opsi
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                name="show_result"
                type="checkbox"
                defaultChecked={Boolean(editable?.show_result)}
              />
              Tampilkan hasil
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                name="is_active"
                type="checkbox"
                defaultChecked={editable?.is_active ?? true}
              />
              Aktif
            </label>
          </div>

          <div className="rounded-lg border bg-background p-4">
            <h3 className="text-sm font-semibold">Soal Published</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Daftar mengikuti mapel terpilih saat halaman dimuat. Gunakan
              filter mapel di URL/list untuk mengganti konteks.
            </p>
            <div className="mt-4 grid max-h-80 gap-2 overflow-auto pr-2">
              {questions.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Belum ada soal published untuk mapel ini.
                </p>
              ) : (
                questions.map((question) => (
                  // Published questions are scoped server-side by subject and role.
                  <label
                    key={question.id}
                    className="flex gap-3 rounded-md border p-3 text-sm"
                  >
                    <input
                      name="question_ids"
                      type="checkbox"
                      value={question.id}
                      defaultChecked={selectedQuestionSet.has(question.id)}
                    />
                    <span>
                      <span className="line-clamp-2 font-medium">
                        {question.content}
                      </span>
                      <span className="mt-1 block text-xs text-muted-foreground">
                        {firstRelation(question.subjects)?.code} | {question.type} |{" "}
                        {question.difficulty} | {question.point} poin
                      </span>
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
              Simpan Paket
            </button>
          </div>
        </form>
      </FormSection>

      <form className="grid gap-3 rounded-lg border bg-card p-4 md:grid-cols-4">
        <input
          name="q"
          defaultValue={params.q ?? ""}
          placeholder="Cari paket"
          className="rounded-md border px-3 py-2 text-sm"
        />
        <select
          name="subject_id"
          defaultValue={params.subject_id ?? ""}
          className="rounded-md border px-3 py-2 text-sm"
        >
          <option value="">Semua mapel</option>
          {subjects.map((subject) => (
            <option key={subject.value} value={subject.value}>
              {subject.label}
            </option>
          ))}
        </select>
        <select
          name="status"
          defaultValue={params.status ?? ""}
          className="rounded-md border px-3 py-2 text-sm"
        >
          <option value="">Semua status</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
        <button className="rounded-md border px-4 py-2 text-sm hover:bg-muted">
          Filter
        </button>
      </form>

      <DataTable
        columns={[
          "Paket",
          "Mapel",
          "Durasi",
          "Soal",
          "Poin",
          "Status",
          "Aktif",
          "Aksi",
        ]}
        isEmpty={packages.length === 0}
        empty={
          <EmptyState
            title="Belum ada paket ujian"
            description="Buat paket ujian dari soal published terlebih dahulu."
          />
        }
      >
        {packages.map((examPackage) => (
          <tr key={examPackage.id} className="align-top">
            <td className="px-4 py-3">
              <div className="font-medium">{examPackage.title}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                {examPackage.description || "-"}
              </div>
            </td>
            <td className="px-4 py-3">
              {examPackage.subjects
                ? `${examPackage.subjects.code} - ${examPackage.subjects.name}`
                : "-"}
            </td>
            <td className="px-4 py-3">
              {examPackage.duration_minutes} menit
            </td>
            <td className="px-4 py-3">{examPackage.total_questions}</td>
            <td className="px-4 py-3">{examPackage.total_points}</td>
            <td className="px-4 py-3">
              <StatusPill value={examPackage.status} />
            </td>
            <td className="px-4 py-3">
              <StatusBadge active={Boolean(examPackage.is_active)} />
            </td>
            <td className="px-4 py-3">
              <div className="flex flex-wrap gap-2">
                <a
                  href={`/dashboard/exams/packages?edit=${examPackage.id}&subject_id=${examPackage.subject_id}`}
                  className="rounded-md border px-3 py-1.5 text-xs hover:bg-muted"
                >
                  Edit
                </a>
                {["draft", "published", "archived"].map((status) => (
                  <form key={status} action={updateExamPackageStatusAction}>
                    <input type="hidden" name="id" value={examPackage.id} />
                    <input type="hidden" name="status" value={status} />
                    <ConfirmSubmitButton
                      confirmMessage={`Ubah status paket menjadi ${status}?`}
                    >
                      {status}
                    </ConfirmSubmitButton>
                  </form>
                ))}
                <form action={toggleExamPackageActiveAction}>
                  <input type="hidden" name="id" value={examPackage.id} />
                  <input
                    type="hidden"
                    name="is_active"
                    value={examPackage.is_active ? "false" : "true"}
                  />
                  <ConfirmSubmitButton
                    confirmMessage={
                      examPackage.is_active
                        ? "Nonaktifkan paket ujian ini?"
                        : "Aktifkan paket ujian ini?"
                    }
                  >
                    {examPackage.is_active ? "Nonaktifkan" : "Aktifkan"}
                  </ConfirmSubmitButton>
                </form>
                <form action={archiveExamPackageAction}>
                  <input type="hidden" name="id" value={examPackage.id} />
                  <ConfirmSubmitButton
                    confirmMessage="Arsipkan paket ujian ini?"
                    variant="danger"
                  >
                    Arsipkan
                  </ConfirmSubmitButton>
                </form>
              </div>
            </td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}
