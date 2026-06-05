import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { ConfirmSubmitButton } from "@/components/dashboard/confirm-submit-button";
import { ActionsMenu } from "@/components/dashboard/actions-menu";
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
  updateExamPackageQuestionPointsAction,
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

type PackageQuestion = {
  id?: string | null;
  question_id?: string | null;
  point_override?: number | string | null;
  questions?: {
    id?: string | null;
    subject_id?: string | null;
    type?: string | null;
    difficulty?: string | null;
    point?: number | string | null;
    status?: string | null;
    is_active?: boolean | null;
    deleted_at?: string | null;
  } | Array<{
    id?: string | null;
    subject_id?: string | null;
    type?: string | null;
    difficulty?: string | null;
    point?: number | string | null;
    status?: string | null;
    is_active?: boolean | null;
    deleted_at?: string | null;
  }> | null;
};

type ExamPackageWithQuestions = {
  subject_id?: string | null;
  total_questions?: number | string | null;
  total_points?: number | string | null;
  exam_package_questions?: PackageQuestion[] | null;
};

function getPackageReadiness(examPackage: ExamPackageWithQuestions) {
  const packageQuestions = examPackage.exam_package_questions ?? [];
  const questions = packageQuestions
    .map((item) => {
      const question = firstRelation(item.questions);

      return question
        ? {
            ...question,
            effectivePoint: Number(item.point_override ?? question.point ?? 0),
          }
        : null;
    })
    .filter(Boolean);
  const multipleChoice = questions.filter(
    (question) => question?.type === "multiple_choice",
  ).length;
  const essay = questions.filter((question) => question?.type === "essay").length;
  const easy = questions.filter((question) => question?.difficulty === "easy").length;
  const medium = questions.filter(
    (question) => question?.difficulty === "medium",
  ).length;
  const hard = questions.filter((question) => question?.difficulty === "hard").length;
  const invalidQuestions = questions.filter(
    (question) =>
      question?.status !== "published" ||
      !question?.is_active ||
      Boolean(question?.deleted_at) ||
      question?.subject_id !== examPackage.subject_id ||
      Number(question?.effectivePoint ?? 0) <= 0,
  ).length;
  const missingRelations = packageQuestions.length - questions.length;
  const totalQuestionMismatch =
    Number(examPackage.total_questions ?? 0) !== packageQuestions.length;
  const warnings = [
    packageQuestions.length === 0 ? "Belum ada soal" : "",
    missingRelations > 0 ? `${missingRelations} relasi soal invalid` : "",
    invalidQuestions > 0 ? `${invalidQuestions} soal tidak siap` : "",
    totalQuestionMismatch ? "Jumlah soal tidak sinkron" : "",
    getPackageTotalPoints(examPackage) <= 0 ? "Total poin belum valid" : "",
  ].filter(Boolean);

  return {
    ready: warnings.length === 0,
    warnings,
    total: packageQuestions.length,
    multipleChoice,
    essay,
    easy,
    medium,
    hard,
    totalPoints: getPackageTotalPoints(examPackage),
  };
}

function getPackageTotalPoints(examPackage: ExamPackageWithQuestions) {
  const packageQuestions = examPackage.exam_package_questions ?? [];

  if (packageQuestions.length === 0) {
    return Number(examPackage.total_points ?? 0);
  }

  return packageQuestions.reduce((total, item) => {
    const question = firstRelation(item.questions);

    return total + Number(item.point_override ?? question?.point ?? 0);
  }, 0);
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
  const packageReadiness = packages.map((examPackage) =>
    getPackageReadiness(examPackage),
  );
  const readyPackages = packageReadiness.filter((item) => item.ready).length;
  const publishedPackages = packages.filter(
    (examPackage) => examPackage.status === "published",
  ).length;
  const totalQuestionsInPackages = packageReadiness.reduce(
    (total, item) => total + item.total,
    0,
  );
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

      <section className="grid gap-4 md:grid-cols-4">
        <DashboardCard
          title="Total Paket"
          value={String(packages.length)}
          description="Paket sesuai filter saat ini."
        />
        <DashboardCard
          title="Ready"
          value={String(readyPackages)}
          description="Paket yang lolos readiness dasar."
        />
        <DashboardCard
          title="Published"
          value={String(publishedPackages)}
          description="Paket yang sudah bisa dipakai jadwal."
        />
        <DashboardCard
          title="Total Soal"
          value={String(totalQuestionsInPackages)}
          description="Jumlah relasi soal dalam paket."
        />
      </section>

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
              {(() => {
                const readiness = getPackageReadiness(examPackage);

                return (
                  <div className="mt-3 space-y-2">
                    <span
                      className={
                        readiness.ready
                          ? "rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700"
                          : "rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700"
                      }
                    >
                      {readiness.ready ? "Ready publish" : "Perlu dicek"}
                    </span>
                    {readiness.warnings.length > 0 ? (
                      <ul className="space-y-1 text-xs text-amber-700">
                        {readiness.warnings.map((warning) => (
                          <li key={warning}>{warning}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                );
              })()}
            </td>
            <td className="px-4 py-3">
              {examPackage.subjects
                ? `${examPackage.subjects.code} - ${examPackage.subjects.name}`
                : "-"}
            </td>
            <td className="px-4 py-3">
              {examPackage.duration_minutes} menit
            </td>
            <td className="px-4 py-3">
              {(() => {
                const readiness = getPackageReadiness(examPackage);

                return (
                  <div className="space-y-1 text-xs">
                    <div className="text-sm">{examPackage.total_questions}</div>
                    <div className="text-muted-foreground">
                      PG {readiness.multipleChoice} / Essay {readiness.essay}
                    </div>
                    <div className="text-muted-foreground">
                      E {readiness.easy} / M {readiness.medium} / H{" "}
                      {readiness.hard}
                    </div>
                  </div>
                );
              })()}
            </td>
            <td className="px-4 py-3">
              <div>{getPackageReadiness(examPackage).totalPoints}</div>
              <form
                action={updateExamPackageQuestionPointsAction}
                className="mt-2 flex max-w-44 items-center gap-2"
              >
                <input type="hidden" name="id" value={examPackage.id} />
                <input
                  name="point_override"
                  type="number"
                  min="0.01"
                  step="0.01"
                  defaultValue="1"
                  aria-label="Bobot semua soal"
                  className="w-20 rounded-md border px-2 py-1 text-xs"
                />
                <ConfirmSubmitButton
                  confirmMessage="Ubah bobot semua soal dalam paket ini? Bobot asli bank soal tidak ikut berubah."
                  loadingText="Menyimpan..."
                >
                  Set
                </ConfirmSubmitButton>
              </form>
            </td>
            <td className="px-4 py-3">
              <StatusPill value={examPackage.status} />
            </td>
            <td className="px-4 py-3">
              <StatusBadge active={Boolean(examPackage.is_active)} />
            </td>
            <td className="px-4 py-3">
              <ActionsMenu>
                <a
                  href={`/dashboard/exams/packages?edit=${examPackage.id}&subject_id=${examPackage.subject_id}`}
                  className="block rounded-md border px-3 py-1.5 text-center text-xs hover:bg-muted"
                >
                  Edit
                </a>
                {["draft", "published", "archived"].map((status) => (
                  <form key={status} action={updateExamPackageStatusAction}>
                    <input type="hidden" name="id" value={examPackage.id} />
                    <input type="hidden" name="status" value={status} />
                    <ConfirmSubmitButton
                      confirmMessage={`Ubah status paket menjadi ${status}?`}
                      className="w-full"
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
                    className="w-full"
                  >
                    {examPackage.is_active ? "Nonaktifkan" : "Aktifkan"}
                  </ConfirmSubmitButton>
                </form>
                <form action={archiveExamPackageAction}>
                  <input type="hidden" name="id" value={examPackage.id} />
                  <ConfirmSubmitButton
                    confirmMessage="Arsipkan paket ujian ini?"
                    variant="danger"
                    className="w-full"
                  >
                    Arsipkan
                  </ConfirmSubmitButton>
                </form>
              </ActionsMenu>
            </td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}
