import Link from "next/link";

import { ConfirmSubmitButton } from "@/components/dashboard/confirm-submit-button";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { SubmitButton } from "@/components/dashboard/submit-button";
import { ActionToast } from "@/components/master-data/action-toast";
import { StatusBadge } from "@/components/master-data/status-badge";
import {
  saveAcademicYearAction,
  saveSemesterAction,
  toggleAcademicYearAction,
  toggleSemesterAction,
} from "@/lib/actions/master-data-actions";
import { requirePermission } from "@/lib/auth/require-permission";
import {
  getAcademicYears,
  getSchoolOptions,
  getSemesters,
  type SelectOption,
} from "@/lib/master-data/queries";

type PageProps = {
  searchParams: Promise<{ q?: string; status?: string; message?: string }>;
};

export default async function AcademicYearsPage({ searchParams }: PageProps) {
  await requirePermission("academic_years.view");
  const params = await searchParams;
  const [academicYears, allAcademicYears, semesters, schools] = await Promise.all([
    getAcademicYears(params.q),
    getAcademicYears(),
    getSemesters(),
    getSchoolOptions(),
  ]);
  const rows = academicYears.filter((year) =>
    params.status ? String(Boolean(year.is_active)) === params.status : true,
  );
  const activeAcademicYear =
    allAcademicYears.find((academicYear) => academicYear.is_active) ?? null;
  const activeSemester =
    semesters.find((semester) => Boolean(semester.is_active)) ?? null;

  return (
    <div className="space-y-5">
      <ActionToast status={params.status} message={params.message} />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <DashboardPageHeader title="Tahun Ajaran & Semester" description="Kelola periode akademik aktif dalam satu tempat." />
      </div>

      <section className="grid gap-3 md:grid-cols-3">
        <AcademicSummaryItem label="Tahun ajaran aktif" value={activeAcademicYear?.name ?? "Belum ada"} active={Boolean(activeAcademicYear)} />
        <AcademicSummaryItem label="Semester aktif" value={activeSemester?.name ?? "Belum ada"} active={Boolean(activeSemester)} />
        <AcademicSummaryItem label="Total periode" value={`${allAcademicYears.length} tahun ajaran / ${semesters.length} semester`} active={allAcademicYears.length > 0} />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <QuickAcademicYearForm schools={schools} />
        <QuickSemesterForm academicYears={allAcademicYears} />
      </section>

      <form className="grid gap-3 rounded-xl border border-[#E2E8F0] bg-white p-3 shadow-sm md:grid-cols-[1.5fr_1fr_auto]">
        <input name="q" defaultValue={params.q ?? ""} placeholder="Cari tahun ajaran" className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm" />
        <select name="status" defaultValue={params.status ?? ""} className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm">
          <option value="">Semua status</option>
          <option value="true">Aktif</option>
          <option value="false">Nonaktif</option>
        </select>
        <div className="flex gap-2">
          <Link href="/dashboard/master-data/academic-years" className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm hover:bg-[#F8FAFC]">Reset</Link>
          <button className="rounded-xl bg-[#2563EB] px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Filter</button>
        </div>
      </form>

      <div className="hidden rounded-xl border border-[#E2E8F0] bg-white shadow-sm md:block">
        <table className="w-full table-fixed text-left text-sm">
          <thead className="border-b border-[#E2E8F0] text-xs uppercase text-[#64748B]">
            <tr className="h-10">
              <th className="px-3 py-2 font-medium">Tahun Ajaran</th>
              <th className="w-48 px-3 py-2 font-medium">Semester</th>
              <th className="w-28 px-3 py-2 font-medium">Status</th>
              <th className="w-36 px-3 py-2 font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0]">
            {rows.map((year) => {
              const yearSemesters = semesters.filter((semester) => semester.academic_year_id === year.id);
              const activeSemester = yearSemesters.find((semester) => semester.is_active);

              return (
                <tr key={year.id} className="h-14 hover:bg-[#F8FAFC]">
                  <td className="min-w-0 px-3 py-2">
                    <div className="line-clamp-1 font-medium text-[#0F172A]">{year.name}</div>
                    <div className="line-clamp-1 text-xs text-[#64748B]">{year.start_date || "-"} - {year.end_date || "-"}</div>
                  </td>
                  <td className="truncate px-3 py-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {yearSemesters.length ? (
                        yearSemesters.map((semester) => (
                          <span
                            key={semester.id}
                            className={
                              semester.is_active
                                ? "rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200"
                                : "rounded-md bg-[#F8FAFC] px-2 py-1 text-xs text-[#64748B] ring-1 ring-[#E2E8F0]"
                            }
                          >
                            {semester.name}
                            {semester.is_active ? " aktif" : ""}
                          </span>
                        ))
                      ) : (
                        <span className="text-[#64748B]">Belum ada</span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2"><StatusBadge active={Boolean(year.is_active)} /></td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Link href={`/dashboard/master-data/academic-years/${year.id}/edit`} className="rounded-lg border border-[#E2E8F0] px-2 py-1 text-xs hover:bg-[#F8FAFC]">Edit</Link>
                      <form action={toggleAcademicYearAction}>
                        <input type="hidden" name="id" value={year.id} />
                        <input type="hidden" name="school_id" value={year.school_id} />
                        <input type="hidden" name="is_active" value={year.is_active ? "false" : "true"} />
                        <ConfirmSubmitButton confirmMessage={`${year.is_active ? "Nonaktifkan" : "Aktifkan"} ${year.name}?`} className="h-7 rounded-lg px-2 text-xs">
                          {year.is_active ? "Nonaktifkan" : "Aktifkan"}
                        </ConfirmSubmitButton>
                      </form>
                      {activeSemester ? (
                        <form action={toggleSemesterAction}>
                          <input type="hidden" name="redirect_path" value="/dashboard/master-data/academic-years" />
                          <input type="hidden" name="id" value={activeSemester.id} />
                          <input type="hidden" name="academic_year_id" value={activeSemester.academic_year_id} />
                          <input type="hidden" name="is_active" value="false" />
                          <ConfirmSubmitButton confirmMessage={`Nonaktifkan semester ${activeSemester.name}?`} className="h-7 rounded-lg px-2 text-xs">
                            Nonaktifkan Semester
                          </ConfirmSubmitButton>
                        </form>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length === 0 ? <div className="p-8"><EmptyState title="Belum ada tahun ajaran" description="Tambahkan tahun ajaran sebelum membuat kelas." actionHref="/dashboard/master-data/academic-years/create" actionLabel="Tambah Tahun Ajaran" /></div> : null}
      </div>

      <div className="grid gap-2 md:hidden">
        {rows.length ? rows.map((year) => {
          const yearSemesters = semesters.filter((semester) => semester.academic_year_id === year.id);
          const activeSemester = yearSemesters.find((semester) => semester.is_active);

          return (
            <article key={year.id} className="max-h-[120px] rounded-xl border border-[#E2E8F0] bg-white p-3 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="line-clamp-1 text-sm font-medium text-[#0F172A]">{year.name}</div>
                  <div className="mt-0.5 line-clamp-1 text-xs text-[#64748B]">
                    {activeSemester
                      ? `${activeSemester.name} aktif`
                      : yearSemesters.map((item) => item.name).join(", ") || "Belum ada semester"}
                  </div>
                </div>
                <StatusBadge active={Boolean(year.is_active)} />
              </div>
              <div className="mt-2 flex items-center gap-1.5">
                <Link href={`/dashboard/master-data/academic-years/${year.id}/edit`} className="rounded-lg border border-[#E2E8F0] px-2 py-1 text-xs hover:bg-[#F8FAFC]">Edit</Link>
              </div>
            </article>
          );
        }) : (
          <div className="rounded-xl border border-[#E2E8F0] bg-white p-8">
            <EmptyState title="Belum ada tahun ajaran" description="Tambahkan tahun ajaran sebelum membuat kelas." actionHref="/dashboard/master-data/academic-years/create" actionLabel="Tambah Tahun Ajaran" />
          </div>
        )}
      </div>
    </div>
  );
}

function SchoolField({ schools }: { schools: SelectOption[] }) {
  if (schools.length <= 1) {
    return <input type="hidden" name="school_id" value={schools[0]?.value ?? ""} />;
  }

  return (
    <select
      name="school_id"
      defaultValue={schools[0]?.value ?? ""}
      className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm"
      required
    >
      {schools.map((school) => (
        <option key={school.value} value={school.value}>
          {school.label}
        </option>
      ))}
    </select>
  );
}

function AcademicSummaryItem({
  label,
  value,
  active,
}: {
  label: string;
  value: string;
  active: boolean;
}) {
  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm">
      <div className="text-xs font-medium uppercase text-[#64748B]">{label}</div>
      <div className="mt-2 flex items-center justify-between gap-3">
        <div className="min-w-0 truncate text-base font-semibold text-[#0F172A]">{value}</div>
        <StatusBadge active={active} />
      </div>
    </div>
  );
}

function QuickAcademicYearForm({ schools }: { schools: SelectOption[] }) {
  return (
    <form action={saveAcademicYearAction} className="grid gap-3 rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm md:grid-cols-2">
      <input type="hidden" name="redirect_path" value="/dashboard/master-data/academic-years" />
      <div className="md:col-span-2">
        <h2 className="text-sm font-semibold text-[#0F172A]">Tambah Tahun Ajaran</h2>
      </div>
      <input type="hidden" name="id" value="" />
      <SchoolField schools={schools} />
      <input name="name" placeholder="2025/2026" className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm" required />
      <input name="starts_at" type="date" className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm" />
      <input name="ends_at" type="date" className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm" />
      <label className="flex items-center gap-2 text-sm text-[#0F172A]">
        <input name="is_active" type="checkbox" defaultChecked />
        Jadikan aktif
      </label>
      <div className="flex justify-end md:col-span-2">
        <SubmitButton loadingText="Menyimpan...">Simpan Tahun Ajaran</SubmitButton>
      </div>
    </form>
  );
}

function QuickSemesterForm({ academicYears }: { academicYears: Array<{ id: string; name: string; is_active?: boolean | null }> }) {
  const defaultAcademicYear =
    academicYears.find((academicYear) => academicYear.is_active)?.id ??
    academicYears[0]?.id ??
    "";

  return (
    <form action={saveSemesterAction} className="grid gap-3 rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm md:grid-cols-2">
      <input type="hidden" name="redirect_path" value="/dashboard/master-data/academic-years" />
      <div className="md:col-span-2">
        <h2 className="text-sm font-semibold text-[#0F172A]">Tambah Semester</h2>
      </div>
      <input type="hidden" name="id" value="" />
      <select
        name="academic_year_id"
        defaultValue={defaultAcademicYear}
        className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm"
        required
      >
        {academicYears.map((academicYear) => (
          <option key={academicYear.id} value={academicYear.id}>
            {academicYear.name}
          </option>
        ))}
      </select>
      <input name="name" defaultValue="Ganjil" placeholder="Ganjil" className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm" required />
      <input name="code" defaultValue="ganjil" placeholder="ganjil" className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm" required />
      <label className="flex items-center gap-2 text-sm text-[#0F172A]">
        <input name="is_active" type="checkbox" defaultChecked />
        Jadikan aktif
      </label>
      <div className="flex justify-end md:col-span-2">
        <SubmitButton loadingText="Menyimpan..." disabled={academicYears.length === 0}>
          Simpan Semester
        </SubmitButton>
      </div>
      {academicYears.length === 0 ? (
        <p className="text-xs text-[#64748B] md:col-span-2">
          Buat tahun ajaran terlebih dahulu sebelum menambahkan semester.
        </p>
      ) : null}
    </form>
  );
}
