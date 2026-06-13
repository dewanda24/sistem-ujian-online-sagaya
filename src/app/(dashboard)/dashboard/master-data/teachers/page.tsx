import Link from "next/link";

import { ConfirmSubmitButton } from "@/components/dashboard/confirm-submit-button";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { ActionToast } from "@/components/master-data/action-toast";
import { StatusBadge } from "@/components/master-data/status-badge";
import { toggleUserStatusAction } from "@/lib/actions/master-data-actions";
import { requirePermission } from "@/lib/auth/require-permission";
import { getTeacherAssignmentCounts, getUsersByRole } from "@/lib/master-data/queries";

type PageProps = {
  searchParams: Promise<{ q?: string; status?: string; message?: string }>;
};

function getProfile(user: {
  user_profiles?:
    | { full_name?: string | null; nip?: string | null }
    | Array<{ full_name?: string | null; nip?: string | null }>
    | null;
}) {
  return Array.isArray(user.user_profiles) ? user.user_profiles[0] : user.user_profiles;
}

export default async function TeachersPage({ searchParams }: PageProps) {
  await requirePermission("teachers.view");
  const params = await searchParams;
  const teachers = await getUsersByRole("teacher", params.q);
  const assignmentCounts = await getTeacherAssignmentCounts(teachers.map((teacher) => teacher.id));
  const rows = teachers.filter((teacher) => (params.status ? teacher.status === params.status : true));

  return (
    <div className="space-y-5">
      <ActionToast status={params.status} message={params.message} />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <DashboardPageHeader title="Guru" description="Kelola data guru dan status pengawas secara ringkas." />
        <Link href="/dashboard/master-data/teachers/create" className="rounded-xl bg-[#2563EB] px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700">Tambah Guru</Link>
      </div>

      <form className="grid gap-3 rounded-xl border border-[#E2E8F0] bg-white p-3 shadow-sm md:grid-cols-[1.5fr_1fr_auto]">
        <input name="q" defaultValue={params.q ?? ""} placeholder="Cari guru" className="min-w-0 rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm" />
        <select name="status" defaultValue={params.status ?? ""} className="min-w-0 rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm">
          <option value="">Semua status</option>
          <option value="active">Aktif</option>
          <option value="inactive">Tidak Aktif</option>
        </select>
        <div className="flex gap-2">
          <Link href="/dashboard/master-data/teachers" className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm hover:bg-[#F8FAFC]">Reset</Link>
          <button className="rounded-xl bg-[#2563EB] px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Filter</button>
        </div>
      </form>

      <div className="hidden rounded-xl border border-[#E2E8F0] bg-white shadow-sm md:block">
        <table className="w-full table-fixed text-left text-sm">
          <thead className="border-b border-[#E2E8F0] text-xs uppercase text-[#64748B]">
            <tr className="h-10">
              <th className="px-3 py-2 font-medium">Nama</th>
              <th className="w-36 px-3 py-2 font-medium">Mata Pelajaran</th>
              <th className="w-28 px-3 py-2 font-medium">Status</th>
              <th className="w-28 px-3 py-2 font-medium">Pengawas</th>
              <th className="w-40 px-3 py-2 font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0]">
            {rows.map((teacher) => {
              const profile = getProfile(teacher);
              const name = profile?.full_name ?? teacher.username;

              return (
                <tr key={teacher.id} className="h-14 hover:bg-[#F8FAFC]">
                  <td className="min-w-0 px-3 py-2">
                    <div className="line-clamp-1 font-medium text-[#0F172A]">{name}</div>
                    <div className="line-clamp-1 text-xs text-[#64748B]">{profile?.nip ?? teacher.email}</div>
                  </td>
                  <td className="px-3 py-2 text-[#0F172A]">{assignmentCounts.get(teacher.id) ?? 0} mata pelajaran</td>
                  <td className="px-3 py-2"><StatusBadge active={teacher.status === "active"} /></td>
                  <td className="px-3 py-2"><span className="rounded-md bg-slate-100 px-2 py-1 text-xs text-[#64748B]">Tidak</span></td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      <Link href={`/dashboard/master-data/teachers/${teacher.id}/edit`} className="rounded-lg border border-[#E2E8F0] px-2 py-1 text-xs hover:bg-[#F8FAFC]">Edit</Link>
                      <form action={toggleUserStatusAction}>
                        <input type="hidden" name="target" value="teachers" />
                        <input type="hidden" name="id" value={teacher.id} />
                        <input type="hidden" name="status" value={teacher.status === "active" ? "inactive" : "active"} />
                        <ConfirmSubmitButton confirmMessage={`${teacher.status === "active" ? "Nonaktifkan" : "Aktifkan"} ${name}?`} className="h-7 rounded-lg px-2 text-xs">
                          {teacher.status === "active" ? "Nonaktifkan" : "Aktifkan"}
                        </ConfirmSubmitButton>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="grid gap-2 md:hidden">
        {rows.length ? rows.map((teacher) => {
          const profile = getProfile(teacher);
          return (
            <article key={teacher.id} className="max-h-[120px] rounded-xl border border-[#E2E8F0] bg-white p-3 shadow-sm">
              <div className="line-clamp-1 text-sm font-medium text-[#0F172A]">{profile?.full_name ?? teacher.username}</div>
              <div className="mt-1 flex items-center gap-2 text-xs text-[#64748B]">
                <span>{assignmentCounts.get(teacher.id) ?? 0} mata pelajaran</span>
                <StatusBadge active={teacher.status === "active"} />
              </div>
              <Link href={`/dashboard/master-data/teachers/${teacher.id}/edit`} className="mt-2 inline-flex rounded-lg border border-[#E2E8F0] px-2 py-1 text-xs">Edit</Link>
            </article>
          );
        }) : <div className="rounded-xl border border-[#E2E8F0] bg-white p-8"><EmptyState title="Belum ada guru" description="Tambahkan guru pertama atau import data guru." actionHref="/dashboard/master-data/teachers/create" actionLabel="Tambah Guru" /></div>}
      </div>
    </div>
  );
}
