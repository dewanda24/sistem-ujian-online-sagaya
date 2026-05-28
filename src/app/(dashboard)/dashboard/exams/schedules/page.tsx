import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { ConfirmSubmitButton } from "@/components/dashboard/confirm-submit-button";
import { EmptyState } from "@/components/dashboard/empty-state";
import { StatusPill } from "@/components/dashboard/status-pill";
import { ActionToast } from "@/components/master-data/action-toast";
import { DataTable } from "@/components/master-data/data-table";
import { FormSection } from "@/components/master-data/form-section";
import { StatusBadge } from "@/components/master-data/status-badge";
import {
  archiveExamScheduleAction,
  regenerateExamTokenAction,
  saveExamScheduleAction,
  toggleExamScheduleActiveAction,
  updateExamScheduleStatusAction,
} from "@/features/exams/actions";
import {
  getAcademicYearSelectOptions,
  getDefaultSchoolId,
  getExamPackageOptions,
  getExamScheduleClassIds,
  getExamSchedules,
  getScopedClassOptions,
  getSemesterOptions,
} from "@/features/exams/queries";
import { requirePermission } from "@/lib/auth/require-permission";

type PageProps = {
  searchParams: Promise<{
    q?: string;
    status?: string;
    package_id?: string;
    edit?: string;
    notice?: string;
    message?: string;
  }>;
};

function toDatetimeLocal(value?: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60000;

  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export default async function ExamSchedulesPage({ searchParams }: PageProps) {
  await requirePermission("exam_schedules.view");
  const params = await searchParams;
  const filters = {
    q: params.q,
    status: params.status,
    package_id: params.package_id,
  };
  const [
    schoolId,
    packages,
    academicYears,
    semesters,
    classes,
    schedules,
  ] = await Promise.all([
    getDefaultSchoolId(),
    getExamPackageOptions(),
    getAcademicYearSelectOptions(),
    getSemesterOptions(),
    getScopedClassOptions(),
    getExamSchedules(filters),
  ]);
  const editable = schedules.find((schedule) => schedule.id === params.edit);
  const selectedClassIds = await getExamScheduleClassIds(editable?.id);
  const selectedClassSet = new Set(selectedClassIds);

  return (
    <div className="space-y-6">
      <ActionToast status={params.notice} message={params.message} />
      <DashboardPageHeader
        title="Jadwal Ujian"
        description="Atur jadwal ujian, target kelas, token masuk, dan kontrol sesi ujian."
      />

      <FormSection
        title={editable ? "Edit Jadwal Ujian" : "Tambah Jadwal Ujian"}
        description="Gunakan paket ujian published, pilih tahun ajaran, rentang waktu, dan kelas target."
      >
        <form action={saveExamScheduleAction} className="grid gap-4">
          <input type="hidden" name="id" defaultValue={editable?.id ?? ""} />
          <input type="hidden" name="school_id" value={schoolId ?? ""} />

          <div className="grid gap-4 md:grid-cols-3">
            <input
              name="title"
              defaultValue={editable?.title ?? ""}
              placeholder="Judul jadwal ujian"
              className="rounded-md border px-3 py-2 text-sm"
              required
            />
            <select
              name="exam_package_id"
              defaultValue={editable?.exam_package_id ?? packages[0]?.value ?? ""}
              className="rounded-md border px-3 py-2 text-sm"
              required
            >
              {packages.map((examPackage) => (
                <option key={examPackage.value} value={examPackage.value}>
                  {examPackage.label}
                </option>
              ))}
            </select>
            <select
              name="academic_year_id"
              defaultValue={
                editable?.academic_year_id ?? academicYears[0]?.value ?? ""
              }
              className="rounded-md border px-3 py-2 text-sm"
              required
            >
              {academicYears.map((academicYear) => (
                <option key={academicYear.value} value={academicYear.value}>
                  {academicYear.label}
                </option>
              ))}
            </select>
            <select
              name="semester_id"
              defaultValue={editable?.semester_id ?? ""}
              className="rounded-md border px-3 py-2 text-sm"
            >
              <option value="">Tanpa semester</option>
              {semesters.map((semester) => (
                <option key={semester.value} value={semester.value}>
                  {semester.label}
                </option>
              ))}
            </select>
            <input
              name="start_at"
              type="datetime-local"
              defaultValue={toDatetimeLocal(editable?.start_at)}
              className="rounded-md border px-3 py-2 text-sm"
              required
            />
            <input
              name="end_at"
              type="datetime-local"
              defaultValue={toDatetimeLocal(editable?.end_at)}
              className="rounded-md border px-3 py-2 text-sm"
              required
            />
            <select
              name="status"
              defaultValue={
                editable?.status === "active"
                  ? "active"
                  : editable?.status === "scheduled"
                    ? "scheduled"
                    : "draft"
              }
              className="rounded-md border px-3 py-2 text-sm"
            >
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="active">Active</option>
            </select>
          </div>

          <div className="grid gap-3 rounded-lg border bg-background p-4 md:grid-cols-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                name="token_required"
                type="checkbox"
                defaultChecked={Boolean(editable?.token_required)}
              />
              Token required nanti
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
            <h3 className="text-sm font-semibold">Target Kelas</h3>
            <div className="mt-4 grid gap-2 md:grid-cols-2">
              {classes.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Belum ada kelas yang tersedia untuk scope user ini.
                </p>
              ) : (
                classes.map((classItem) => (
                  <label
                    key={classItem.value}
                    className="flex items-center gap-2 rounded-md border p-3 text-sm"
                  >
                    <input
                      name="class_ids"
                      type="checkbox"
                      value={classItem.value}
                      defaultChecked={selectedClassSet.has(classItem.value)}
                    />
                    {classItem.label}
                  </label>
                ))
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
              Simpan Jadwal
            </button>
          </div>
        </form>
      </FormSection>

      <form className="grid gap-3 rounded-lg border bg-card p-4 md:grid-cols-4">
        <input
          name="q"
          defaultValue={params.q ?? ""}
          placeholder="Cari jadwal"
          className="rounded-md border px-3 py-2 text-sm"
        />
        <select
          name="package_id"
          defaultValue={params.package_id ?? ""}
          className="rounded-md border px-3 py-2 text-sm"
        >
          <option value="">Semua paket</option>
          {packages.map((examPackage) => (
            <option key={examPackage.value} value={examPackage.value}>
              {examPackage.label}
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
          <option value="scheduled">Scheduled</option>
          <option value="active">Active</option>
          <option value="finished">Finished</option>
          <option value="cancelled">Cancelled</option>
          <option value="archived">Archived</option>
        </select>
        <button className="rounded-md border px-4 py-2 text-sm hover:bg-muted">
          Filter
        </button>
      </form>

      <DataTable
        columns={[
          "Jadwal",
          "Paket",
          "Waktu",
          "Token",
          "Kelas",
          "Status",
          "Aktif",
          "Aksi",
        ]}
        isEmpty={schedules.length === 0}
        empty={
          <EmptyState
            title="Belum ada jadwal ujian"
            description="Buat jadwal dari paket ujian published."
          />
        }
      >
        {schedules.map((schedule) => (
          <tr key={schedule.id} className="align-top">
            <td className="px-4 py-3 font-medium">{schedule.title}</td>
            <td className="px-4 py-3">
              {schedule.exam_packages?.title ?? "-"}
              <div className="mt-1 text-xs text-muted-foreground">
                {schedule.exam_packages?.subjects?.code ?? ""}
              </div>
            </td>
            <td className="px-4 py-3">
              <div>{formatDateTime(schedule.start_at)}</div>
              <div className="text-xs text-muted-foreground">
                sampai {formatDateTime(schedule.end_at)}
              </div>
            </td>
            <td className="px-4 py-3">
              {schedule.token_required ? (
                <div>
                  <code className="rounded bg-muted px-2 py-1 text-xs">
                    {schedule.access_token ?? "Belum ada"}
                  </code>
                  <div className="mt-1 text-xs text-muted-foreground">
                    wajib token
                  </div>
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">Tidak wajib</span>
              )}
            </td>
            <td className="px-4 py-3">
              {schedule.exam_schedule_classes
                ?.map((item: { classes?: { name?: string } | { name?: string }[] | null }) =>
                  firstRelation(item.classes)?.name,
                )
                .filter(Boolean)
                .join(", ") || "-"}
            </td>
            <td className="px-4 py-3">
              <StatusPill value={schedule.status} />
            </td>
            <td className="px-4 py-3">
              <StatusBadge active={Boolean(schedule.is_active)} />
            </td>
            <td className="px-4 py-3">
              <div className="flex flex-wrap gap-2">
                <a
                  href={`/dashboard/exams/schedules?edit=${schedule.id}`}
                  className="rounded-md border px-3 py-1.5 text-xs hover:bg-muted"
                >
                  Edit
                </a>
                {[
                  "draft",
                  "scheduled",
                  "active",
                  "finished",
                  "cancelled",
                  "archived",
                ].map((status) => (
                  <form key={status} action={updateExamScheduleStatusAction}>
                    <input type="hidden" name="id" value={schedule.id} />
                    <input type="hidden" name="status" value={status} />
                    <ConfirmSubmitButton
                      confirmMessage={`Ubah status jadwal menjadi ${status}?`}
                    >
                      {status}
                    </ConfirmSubmitButton>
                  </form>
                ))}
                <form action={toggleExamScheduleActiveAction}>
                  <input type="hidden" name="id" value={schedule.id} />
                  <input
                    type="hidden"
                    name="is_active"
                    value={schedule.is_active ? "false" : "true"}
                  />
                  <ConfirmSubmitButton
                    confirmMessage={
                      schedule.is_active
                        ? "Nonaktifkan jadwal ujian ini?"
                        : "Aktifkan jadwal ujian ini?"
                    }
                  >
                    {schedule.is_active ? "Nonaktifkan" : "Aktifkan"}
                  </ConfirmSubmitButton>
                </form>
                <form action={regenerateExamTokenAction}>
                  <input type="hidden" name="id" value={schedule.id} />
                  <ConfirmSubmitButton confirmMessage="Buat token baru? Token lama tidak bisa dipakai lagi.">
                    Token Baru
                  </ConfirmSubmitButton>
                </form>
                <form action={archiveExamScheduleAction}>
                  <input type="hidden" name="id" value={schedule.id} />
                  <ConfirmSubmitButton
                    confirmMessage="Arsipkan jadwal ujian ini?"
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
