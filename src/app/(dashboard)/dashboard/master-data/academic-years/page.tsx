import Link from "next/link";

import { ConfirmSubmitButton } from "@/components/dashboard/confirm-submit-button";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { ActionToast } from "@/components/master-data/action-toast";
import { StatusBadge } from "@/components/master-data/status-badge";
import { toggleAcademicYearAction } from "@/lib/actions/master-data-actions";
import { requirePermission } from "@/lib/auth/require-permission";
import { getAcademicYears, getSemesters } from "@/lib/master-data/queries";

type PageProps = {
  searchParams: Promise<{ q?: string; status?: string; message?: string }>;
};

export default async function AcademicYearsPage({ searchParams }: PageProps) {
  await requirePermission("academic_years.view");
  const params = await searchParams;
  const [academicYears, semesters] = await Promise.all([
    getAcademicYears(params.q),
    getSemesters(),
  ]);
  const rows = academicYears.filter((year) =>
    params.status ? String(Boolean(year.is_active)) === params.status : true,
  );

  return (
    <div className="space-y-5">
      <ActionToast status={params.status} message={params.message} />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <DashboardPageHeader title="Tahun Ajaran" description="Kelola tahun ajaran dan semester dalam satu tempat." />
        <Link href="/dashboard/master-data/academic-years/create" className="rounded-xl bg-[#2563EB] px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700">Tambah Tahun Ajaran</Link>
      </div>

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

      <div className="rounded-xl border border-[#E2E8F0] bg-white shadow-sm">
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
                    {activeSemester?.name ?? (yearSemesters.map((item) => item.name).join(", ") || "-")}
                  </td>
                  <td className="px-3 py-2"><StatusBadge active={Boolean(year.is_active)} /></td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      <Link href={`/dashboard/master-data/academic-years/${year.id}/edit`} className="rounded-lg border border-[#E2E8F0] px-2 py-1 text-xs hover:bg-[#F8FAFC]">Edit</Link>
                      <form action={toggleAcademicYearAction}>
                        <input type="hidden" name="id" value={year.id} />
                        <input type="hidden" name="school_id" value={year.school_id} />
                        <input type="hidden" name="is_active" value={year.is_active ? "false" : "true"} />
                        <ConfirmSubmitButton confirmMessage={`${year.is_active ? "Nonaktifkan" : "Aktifkan"} ${year.name}?`} className="h-7 rounded-lg px-2 text-xs">
                          {year.is_active ? "Nonaktifkan" : "Aktifkan"}
                        </ConfirmSubmitButton>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length === 0 ? <div className="p-8"><EmptyState title="Belum ada tahun ajaran" description="Tambahkan tahun ajaran sebelum membuat kelas." /></div> : null}
      </div>
    </div>
  );
}
