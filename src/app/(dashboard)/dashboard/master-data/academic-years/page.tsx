export const dynamic = "force-dynamic";

import Link from "next/link";

import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import {
  TableActionLink,
  TableActions,
  TableActionSubmit,
} from "@/components/dashboard/table-actions";
import { ActionToast } from "@/components/master-data/action-toast";
import { SemesterToggleButton } from "@/components/master-data/semester-toggle-button";
import { StatusBadge } from "@/components/master-data/status-badge";
import {
  deleteAcademicYearAction,
  toggleAcademicYearAction,
  toggleSemesterAction,
} from "@/lib/actions/master-data-actions";
import { requirePermission } from "@/lib/auth/require-permission";
import {
  getAcademicYears,
  getSemesters,
} from "@/lib/master-data/queries";

type PageProps = {
  searchParams: Promise<{ q?: string; status?: string; message?: string }>;
};

export default async function AcademicYearsPage({ searchParams }: PageProps) {
  await requirePermission("academic_years.view");
  const params = await searchParams;
  const [academicYears, allAcademicYears, semesters] = await Promise.all([
    getAcademicYears(params.q),
    getAcademicYears(),
    getSemesters(),
  ]);

  const rows = academicYears.filter((year) =>
    params.status ? String(Boolean(year.is_active)) === params.status : true,
  );
  const activeAcademicYear = allAcademicYears.find((y) => y.is_active) ?? null;
  const activeSemester = semesters.find((s) => Boolean(s.is_active)) ?? null;

  return (
    <div className="space-y-6">
      <ActionToast status={params.status} message={params.message} />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <DashboardPageHeader
          title="Tahun Ajaran & Semester"
          description="Atur periode akademik aktif. Semester yang aktif menentukan jadwal ujian dan kelas yang berjalan."
        />
        <Link
          href="/dashboard/master-data/academic-years/create"
          className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          <span>+ Tambah Tahun Ajaran</span>
        </Link>
      </div>

      {/* Summary Cards */}
      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">Tahun Ajaran Aktif</div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-lg font-bold text-[#0F172A]">{activeAcademicYear?.name ?? "Belum Diatur"}</span>
            <StatusBadge active={Boolean(activeAcademicYear)} />
          </div>
        </div>

        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">Semester Aktif</div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-lg font-bold text-[#0F172A]">{activeSemester ? `Semester ${activeSemester.name}` : "Belum Diatur"}</span>
            <StatusBadge active={Boolean(activeSemester)} />
          </div>
        </div>

        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">Total Tahun Ajaran</div>
          <div className="mt-2">
            <span className="text-lg font-bold text-[#0F172A]">{allAcademicYears.length} Periode</span>
          </div>
        </div>
      </section>

      {/* Filter & Search */}
      <form className="grid gap-3 rounded-xl border border-[#E2E8F0] bg-white p-3 shadow-sm md:grid-cols-[1.5fr_1fr_auto]">
        <input
          name="q"
          defaultValue={params.q ?? ""}
          placeholder="Cari tahun ajaran (contoh: 2025/2026)"
          className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
        />
        <select
          name="status"
          defaultValue={params.status ?? ""}
          className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
        >
          <option value="">Semua Status</option>
          <option value="true">Aktif</option>
          <option value="false">Nonaktif</option>
        </select>
        <div className="flex gap-2">
          <Link
            href="/dashboard/master-data/academic-years"
            className="rounded-xl border border-[#E2E8F0] px-4 py-2 text-sm font-medium hover:bg-[#F8FAFC]"
          >
            Reset
          </Link>
          <button
            type="submit"
            className="rounded-xl bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Filter
          </button>
        </div>
      </form>

      {/* Desktop Table */}
      <div className="hidden rounded-xl border border-[#E2E8F0] bg-white shadow-sm md:block">
        <table className="w-full table-fixed text-left text-sm">
          <thead className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-xs font-semibold uppercase text-[#64748B]">
            <tr className="h-11">
              <th className="px-4 py-2">Tahun Ajaran</th>
              <th className="w-80 px-4 py-2">Pilih Semester Aktif</th>
              <th className="w-32 px-4 py-2">Status</th>
              <th className="w-44 px-4 py-2 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0]">
            {rows.map((year) => {
              const yearSemesters = semesters.filter((s) => s.academic_year_id === year.id);

              return (
                <tr key={year.id} className="h-16 hover:bg-[#F8FAFC]/80">
                  <td className="px-4 py-3 font-semibold text-[#0F172A]">
                    {year.name}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {yearSemesters.length ? (
                        yearSemesters.map((s) => (
                          <form key={s.id} action={toggleSemesterAction}>
                            <input type="hidden" name="redirect_path" value="/dashboard/master-data/academic-years" />
                            <input type="hidden" name="id" value={s.id} />
                            <input type="hidden" name="academic_year_id" value={s.academic_year_id} />
                            <input type="hidden" name="is_active" value={s.is_active ? "false" : "true"} />
                            <SemesterToggleButton
                              name={`Semester ${s.name}`}
                              isActive={Boolean(s.is_active)}
                            />
                          </form>
                        ))
                      ) : (
                        <span className="text-xs text-[#94A3B8]">Belum ada semester</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge active={Boolean(year.is_active)} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <TableActions>
                      <TableActionLink href={`/dashboard/master-data/academic-years/${year.id}/edit`} icon="pencil">
                        Edit
                      </TableActionLink>
                      <form action={toggleAcademicYearAction}>
                        <input type="hidden" name="id" value={year.id} />
                        <input type="hidden" name="school_id" value={year.school_id} />
                        <input type="hidden" name="is_active" value={year.is_active ? "false" : "true"} />
                        <TableActionSubmit
                          icon="power"
                          confirmMessage={`${year.is_active ? "Nonaktifkan" : "Aktifkan"} tahun ajaran ${year.name}?`}
                        >
                          {year.is_active ? "Nonaktifkan" : "Aktifkan"}
                        </TableActionSubmit>
                      </form>
                      <form action={deleteAcademicYearAction}>
                        <input type="hidden" name="id" value={year.id} />
                        <TableActionSubmit
                          icon="trash"
                          confirmMessage={`Hapus tahun ajaran ${year.name} beserta semesternya? Tindakan ini tidak dapat dibatalkan.`}
                        >
                          Hapus
                        </TableActionSubmit>
                      </form>
                    </TableActions>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="Belum ada tahun ajaran"
              description="Tambahkan tahun ajaran baru untuk memulai konfigurasi akademik."
              actionHref="/dashboard/master-data/academic-years/create"
              actionLabel="Tambah Tahun Ajaran"
            />
          </div>
        ) : null}
      </div>

      {/* Mobile Card List */}
      <div className="grid gap-3 md:hidden">
        {rows.length ? (
          rows.map((year) => {
            const yearSemesters = semesters.filter((s) => s.academic_year_id === year.id);

            return (
              <article key={year.id} className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-base text-[#0F172A]">{year.name}</div>
                  <StatusBadge active={Boolean(year.is_active)} />
                </div>

                <div className="space-y-1.5">
                  <div className="text-xs font-medium text-[#64748B]">Semester:</div>
                  <div className="flex flex-wrap gap-2">
                    {yearSemesters.map((s) => (
                      <form key={s.id} action={toggleSemesterAction}>
                        <input type="hidden" name="redirect_path" value="/dashboard/master-data/academic-years" />
                        <input type="hidden" name="id" value={s.id} />
                        <input type="hidden" name="academic_year_id" value={s.academic_year_id} />
                        <input type="hidden" name="is_active" value={s.is_active ? "false" : "true"} />
                        <SemesterToggleButton
                          name={`Semester ${s.name}`}
                          isActive={Boolean(s.is_active)}
                        />
                      </form>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-[#E2E8F0]">
                  <TableActions>
                    <TableActionLink href={`/dashboard/master-data/academic-years/${year.id}/edit`} icon="pencil">
                      Edit
                    </TableActionLink>
                    <form action={toggleAcademicYearAction}>
                      <input type="hidden" name="id" value={year.id} />
                      <input type="hidden" name="school_id" value={year.school_id} />
                      <input type="hidden" name="is_active" value={year.is_active ? "false" : "true"} />
                      <TableActionSubmit
                        icon="power"
                        confirmMessage={`${year.is_active ? "Nonaktifkan" : "Aktifkan"} tahun ajaran ${year.name}?`}
                      >
                        {year.is_active ? "Nonaktifkan" : "Aktifkan"}
                      </TableActionSubmit>
                    </form>
                    <form action={deleteAcademicYearAction}>
                      <input type="hidden" name="id" value={year.id} />
                      <TableActionSubmit
                        icon="trash"
                        confirmMessage={`Hapus tahun ajaran ${year.name}?`}
                      >
                        Hapus
                      </TableActionSubmit>
                    </form>
                  </TableActions>
                </div>
              </article>
            );
          })
        ) : (
          <div className="rounded-xl border border-[#E2E8F0] bg-white p-8">
            <EmptyState
              title="Belum ada tahun ajaran"
              description="Tambahkan tahun ajaran baru untuk memulai konfigurasi akademik."
              actionHref="/dashboard/master-data/academic-years/create"
              actionLabel="Tambah Tahun Ajaran"
            />
          </div>
        )}
      </div>
    </div>
  );
}
