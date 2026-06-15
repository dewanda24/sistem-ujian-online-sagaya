import Link from "next/link";
import { Pencil, Power } from "lucide-react";

import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import {
  TableActionLink,
  TableActions,
  TableActionSubmit,
} from "@/components/dashboard/table-actions";
import { ActionToast } from "@/components/master-data/action-toast";
import { StatusBadge } from "@/components/master-data/status-badge";
import { toggleSubjectAction } from "@/lib/actions/master-data-actions";
import { requirePermission } from "@/lib/auth/require-permission";
import { getSubjects } from "@/lib/master-data/queries";

type PageProps = {
  searchParams: Promise<{ q?: string; status?: string; message?: string }>;
};

export default async function SubjectsPage({ searchParams }: PageProps) {
  await requirePermission("subjects.view");
  const params = await searchParams;
  const subjects = (await getSubjects(params.q)).filter((subject) =>
    params.status ? String(Boolean(subject.is_active)) === params.status : true,
  );

  return (
    <div className="space-y-5">
      <ActionToast status={params.status} message={params.message} />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <DashboardPageHeader title="Mata Pelajaran" description="Kelola kode dan nama mata pelajaran." />
        <Link href="/dashboard/master-data/subjects/create" className="rounded-xl bg-[#2563EB] px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700">Tambah Mata Pelajaran</Link>
      </div>

      <form className="grid gap-3 rounded-xl border border-[#E2E8F0] bg-white p-3 shadow-sm md:grid-cols-[1.5fr_1fr_auto]">
        <input name="q" defaultValue={params.q ?? ""} placeholder="Cari mata pelajaran" className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm" />
        <select name="status" defaultValue={params.status ?? ""} className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm">
          <option value="">Semua status</option>
          <option value="true">Aktif</option>
          <option value="false">Nonaktif</option>
        </select>
        <div className="flex gap-2">
          <Link href="/dashboard/master-data/subjects" className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm hover:bg-[#F8FAFC]">Reset</Link>
          <button className="rounded-xl bg-[#2563EB] px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Filter</button>
        </div>
      </form>

      <div className="hidden rounded-xl border border-[#E2E8F0] bg-white shadow-sm md:block">
        <table className="w-full table-fixed text-left text-sm">
          <thead className="border-b border-[#E2E8F0] text-xs uppercase text-[#64748B]">
            <tr className="h-10">
              <th className="px-3 py-2 font-medium">Nama Mata Pelajaran</th>
              <th className="w-32 px-3 py-2 font-medium">Kode</th>
              <th className="w-28 px-3 py-2 font-medium">Status</th>
              <th className="w-36 px-3 py-2 font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0]">
            {subjects.map((subject) => (
              <tr key={subject.id} className="h-14 hover:bg-[#F8FAFC]">
                <td className="min-w-0 px-3 py-2"><div className="line-clamp-1 font-medium text-[#0F172A]">{subject.name}</div></td>
                <td className="truncate px-3 py-2">{subject.code}</td>
                <td className="px-3 py-2"><StatusBadge active={Boolean(subject.is_active)} /></td>
                <td className="px-3 py-2">
                  <TableActions>
                    <TableActionLink href={`/dashboard/master-data/subjects/${subject.id}/edit`} icon={Pencil}>Edit</TableActionLink>
                    <form action={toggleSubjectAction}>
                      <input type="hidden" name="id" value={subject.id} />
                      <input type="hidden" name="is_active" value={subject.is_active ? "false" : "true"} />
                      <TableActionSubmit icon={Power} confirmMessage={`${subject.is_active ? "Nonaktifkan" : "Aktifkan"} ${subject.name}?`}>
                        {subject.is_active ? "Nonaktifkan" : "Aktifkan"}
                      </TableActionSubmit>
                    </form>
                  </TableActions>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {subjects.length === 0 ? <div className="p-8"><EmptyState title="Belum ada mata pelajaran" description="Tambahkan mata pelajaran sebelum penugasan guru." actionHref="/dashboard/master-data/subjects/create" actionLabel="Tambah Mata Pelajaran" /></div> : null}
      </div>

      <div className="grid gap-2 md:hidden">
        {subjects.length ? subjects.map((subject) => (
          <article key={subject.id} className="max-h-[120px] rounded-xl border border-[#E2E8F0] bg-white p-3 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="line-clamp-1 text-sm font-medium text-[#0F172A]">{subject.name}</div>
                <div className="mt-0.5 line-clamp-1 text-xs text-[#64748B]">{subject.code}</div>
              </div>
              <StatusBadge active={Boolean(subject.is_active)} />
            </div>
            <div className="mt-2 flex items-center gap-1.5">
              <TableActions>
                <TableActionLink href={`/dashboard/master-data/subjects/${subject.id}/edit`} icon={Pencil}>Edit</TableActionLink>
                <form action={toggleSubjectAction}>
                  <input type="hidden" name="id" value={subject.id} />
                  <input type="hidden" name="is_active" value={subject.is_active ? "false" : "true"} />
                  <TableActionSubmit icon={Power} confirmMessage={`${subject.is_active ? "Nonaktifkan" : "Aktifkan"} ${subject.name}?`}>
                    {subject.is_active ? "Nonaktifkan" : "Aktifkan"}
                  </TableActionSubmit>
                </form>
              </TableActions>
            </div>
          </article>
        )) : (
          <div className="rounded-xl border border-[#E2E8F0] bg-white p-8">
            <EmptyState title="Belum ada mata pelajaran" description="Tambahkan mata pelajaran sebelum penugasan guru." actionHref="/dashboard/master-data/subjects/create" actionLabel="Tambah Mata Pelajaran" />
          </div>
        )}
      </div>
    </div>
  );
}
