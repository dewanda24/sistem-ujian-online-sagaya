import Link from "next/link";

import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import {
  TableActionLink,
  TableActions,
  TableActionSubmit,
} from "@/components/dashboard/table-actions";
import { ActionToast } from "@/components/master-data/action-toast";
import { StatusBadge } from "@/components/master-data/status-badge";
import {
  deleteClassAction,
  toggleClassAction,
} from "@/lib/actions/master-data-actions";
import { requirePermission } from "@/lib/auth/require-permission";
import { getClasses } from "@/lib/master-data/queries";

type PageProps = {
  searchParams: Promise<{ q?: string; status?: string; message?: string }>;
};

export default async function ClassesPage({ searchParams }: PageProps) {
  await requirePermission("classes.view");
  const params = await searchParams;
  const classes = (await getClasses(params.q)).filter((item) =>
    params.status ? String(Boolean(item.is_active)) === params.status : true,
  );

  return (
    <div className="space-y-5">
      <ActionToast status={params.status} message={params.message} />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <DashboardPageHeader title="Kelas" description="Kelola kelas, wali kelas, dan jumlah siswa aktif." />
        <Link href="/dashboard/master-data/classes/create" className="rounded-xl bg-[#2563EB] px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700">Tambah Kelas</Link>
      </div>

      <form className="grid gap-3 rounded-xl border border-[#E2E8F0] bg-white p-3 shadow-sm md:grid-cols-[1.5fr_1fr_auto]">
        <input name="q" defaultValue={params.q ?? ""} placeholder="Cari kelas" className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm" />
        <select name="status" defaultValue={params.status ?? ""} className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm">
          <option value="">Semua status</option>
          <option value="true">Aktif</option>
          <option value="false">Nonaktif</option>
        </select>
        <div className="flex gap-2">
          <Link href="/dashboard/master-data/classes" className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm hover:bg-[#F8FAFC]">Reset</Link>
          <button className="rounded-xl bg-[#2563EB] px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Filter</button>
        </div>
      </form>

      <div className="hidden rounded-xl border border-[#E2E8F0] bg-white shadow-sm md:block">
        <table className="w-full table-fixed text-left text-sm">
          <thead className="border-b border-[#E2E8F0] text-xs uppercase text-[#64748B]">
            <tr className="h-10">
              <th className="px-3 py-2 font-medium">Nama Kelas</th>
              <th className="w-48 px-3 py-2 font-medium">Wali Kelas</th>
              <th className="w-32 px-3 py-2 font-medium">Jumlah Siswa</th>
              <th className="w-28 px-3 py-2 font-medium">Status</th>
              <th className="w-40 px-3 py-2 font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0]">
            {classes.map((classItem) => {
              const homeroomProfile = Array.isArray(classItem.users?.user_profiles)
                ? classItem.users?.user_profiles[0]
                : classItem.users?.user_profiles;
              const members = Array.isArray(classItem.class_members) ? classItem.class_members : [];
              const activeMembers = members.filter((member: { left_at?: string | null }) => !member.left_at);

              return (
                <tr key={classItem.id} className="h-14 hover:bg-[#F8FAFC]">
                  <td className="min-w-0 px-3 py-2">
                    <div className="line-clamp-1 font-medium text-[#0F172A]">{classItem.name}</div>
                    <div className="line-clamp-1 text-xs text-[#64748B]">{classItem.academic_years?.name ?? "-"}</div>
                  </td>
                  <td className="truncate px-3 py-2">{homeroomProfile?.full_name ?? classItem.users?.username ?? "-"}</td>
                  <td className="px-3 py-2">{activeMembers.length} siswa</td>
                  <td className="px-3 py-2"><StatusBadge active={Boolean(classItem.is_active)} /></td>
                  <td className="px-3 py-2">
                    <TableActions>
                      <TableActionLink href={`/dashboard/master-data/classes/${classItem.id}/edit`} icon="pencil">Edit</TableActionLink>
                      <form action={toggleClassAction}>
                        <input type="hidden" name="id" value={classItem.id} />
                        <input type="hidden" name="is_active" value={classItem.is_active ? "false" : "true"} />
                        <TableActionSubmit icon="power" confirmMessage={`${classItem.is_active ? "Nonaktifkan" : "Aktifkan"} kelas ${classItem.name}?`}>
                          {classItem.is_active ? "Nonaktifkan" : "Aktifkan"}
                        </TableActionSubmit>
                      </form>
                      <form action={deleteClassAction}>
                        <input type="hidden" name="id" value={classItem.id} />
                        <TableActionSubmit icon="trash" tone="danger" confirmMessage={`Hapus kelas ${classItem.name}? Tindakan ini tidak dapat dibatalkan.`}>
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
      </div>

      <div className="grid gap-2 md:hidden">
        {classes.length ? classes.map((classItem) => {
          const members = Array.isArray(classItem.class_members) ? classItem.class_members : [];
          const activeMembers = members.filter((member: { left_at?: string | null }) => !member.left_at);
          return (
            <article key={classItem.id} className="max-h-[120px] rounded-xl border border-[#E2E8F0] bg-white p-3 shadow-sm">
              <div className="line-clamp-1 text-sm font-medium text-[#0F172A]">{classItem.name}</div>
              <div className="mt-1 flex items-center gap-2 text-xs text-[#64748B]">
                <span>{activeMembers.length} siswa</span>
                <StatusBadge active={Boolean(classItem.is_active)} />
              </div>
              <div className="mt-2">
                <TableActions>
                  <TableActionLink href={`/dashboard/master-data/classes/${classItem.id}/edit`} icon="pencil">Edit</TableActionLink>
                  <form action={toggleClassAction}>
                    <input type="hidden" name="id" value={classItem.id} />
                    <input type="hidden" name="is_active" value={classItem.is_active ? "false" : "true"} />
                    <TableActionSubmit icon="power" confirmMessage={`${classItem.is_active ? "Nonaktifkan" : "Aktifkan"} kelas ${classItem.name}?`}>
                      {classItem.is_active ? "Nonaktifkan" : "Aktifkan"}
                    </TableActionSubmit>
                  </form>
                  <form action={deleteClassAction}>
                    <input type="hidden" name="id" value={classItem.id} />
                    <TableActionSubmit icon="trash" tone="danger" confirmMessage={`Hapus kelas ${classItem.name}? Tindakan ini tidak dapat dibatalkan.`}>
                      Hapus
                    </TableActionSubmit>
                  </form>
                </TableActions>
              </div>
            </article>
          );
        }) : <div className="rounded-xl border border-[#E2E8F0] bg-white p-8"><EmptyState title="Belum ada kelas" description="Tambahkan kelas pertama untuk mulai mengelompokkan siswa." actionHref="/dashboard/master-data/classes/create" actionLabel="Tambah Kelas" /></div>}
      </div>
    </div>
  );
}
