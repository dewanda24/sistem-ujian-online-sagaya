"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Eye, MoreHorizontal, Pencil } from "lucide-react";

import { ConfirmSubmitButton } from "@/components/dashboard/confirm-submit-button";
import { EmptyState } from "@/components/dashboard/empty-state";
import { StatusBadge } from "@/components/master-data/status-badge";
import { toggleUserStatusAction } from "@/lib/actions/master-data-actions";

export type StudentRow = {
  id: string;
  name: string;
  username: string;
  email: string;
  nis: string;
  nisn: string;
  phone: string;
  status: string;
  className: string;
  activeClassCount: number;
};

export function StudentsTable({ rows }: { rows: StudentRow[] }) {
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [detail, setDetail] = useState<StudentRow | null>(null);
  const rowsPerPage = 10;
  const pageCount = Math.max(1, Math.ceil(rows.length / rowsPerPage));
  const currentPage = Math.min(page, pageCount);
  const pagedRows = useMemo(
    () => rows.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage),
    [currentPage, rows],
  );
  const allVisibleSelected = pagedRows.every((row) => selected.includes(row.id));

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-8 shadow-sm">
        <EmptyState
          title="Belum ada siswa"
          description="Tambahkan siswa pertama atau import data siswa."
          actionHref="/dashboard/master-data/students/create"
          actionLabel="Tambah Siswa"
        />
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {selected.length > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 text-sm shadow-sm">
          <span className="font-medium text-[#0F172A]">{selected.length} siswa dipilih</span>
          <div className="flex gap-2">
            <button className="rounded-xl border border-[#E2E8F0] px-3 py-1.5 text-xs text-[#64748B]" type="button">Aktifkan</button>
            <button className="rounded-xl border border-[#E2E8F0] px-3 py-1.5 text-xs text-[#64748B]" type="button">Nonaktifkan</button>
            <button className="rounded-xl border border-red-200 px-3 py-1.5 text-xs text-red-600" type="button">Hapus</button>
          </div>
        </div>
      ) : null}

      <div className="hidden rounded-xl border border-[#E2E8F0] bg-white shadow-sm md:block">
        <table className="w-full table-fixed text-left text-sm">
          <thead className="border-b border-[#E2E8F0] text-xs uppercase text-[#64748B]">
            <tr className="h-10">
              <th className="w-10 px-3 py-2">
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={(event) => {
                    const visibleIds = pagedRows.map((row) => row.id);
                    setSelected((value) =>
                      event.target.checked
                        ? Array.from(new Set([...value, ...visibleIds]))
                        : value.filter((id) => !visibleIds.includes(id)),
                    );
                  }}
                />
              </th>
              <th className="px-3 py-2 font-medium">Nama</th>
              <th className="w-40 px-3 py-2 font-medium">Kelas</th>
              <th className="w-40 px-3 py-2 font-medium">Username</th>
              <th className="w-28 px-3 py-2 font-medium">Status</th>
              <th className="w-32 px-3 py-2 font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0]">
            {pagedRows.map((row) => (
              <tr key={row.id} className="h-14 hover:bg-[#F8FAFC]">
                <td className="px-3 py-2">
                  <input
                    type="checkbox"
                    checked={selected.includes(row.id)}
                    onChange={(event) =>
                      setSelected((value) =>
                        event.target.checked
                          ? [...value, row.id]
                          : value.filter((id) => id !== row.id),
                      )
                    }
                  />
                </td>
                <td className="min-w-0 px-3 py-2">
                  <div className="line-clamp-1 font-medium text-[#0F172A]">{row.name}</div>
                  <div className="line-clamp-1 text-xs text-[#64748B]">{row.nis || row.email}</div>
                </td>
                <td className="truncate px-3 py-2 text-[#0F172A]">{row.className}</td>
                <td className="truncate px-3 py-2 text-[#0F172A]">{row.username}</td>
                <td className="px-3 py-2"><StatusBadge active={row.status === "active"} /></td>
                <td className="px-3 py-2">
                  <RowActions row={row} onDetail={() => setDetail(row)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-2 md:hidden">
        {pagedRows.map((row) => (
          <article key={row.id} className="max-h-[120px] rounded-xl border border-[#E2E8F0] bg-white p-3 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="line-clamp-1 text-sm font-medium text-[#0F172A]">{row.name}</div>
                <div className="mt-0.5 line-clamp-1 text-xs text-[#64748B]">{row.className} - {row.username}</div>
              </div>
              <StatusBadge active={row.status === "active"} />
            </div>
            <div className="mt-2 flex justify-end">
              <RowActions row={row} onDetail={() => setDetail(row)} compact />
            </div>
          </article>
        ))}
      </div>

      <Pagination currentPage={currentPage} pageCount={pageCount} total={rows.length} rowsPerPage={rowsPerPage} onPage={setPage} />
      {detail ? <StudentDrawer row={detail} onClose={() => setDetail(null)} /> : null}
    </div>
  );
}

function RowActions({ row, onDetail, compact = false }: { row: StudentRow; onDetail: () => void; compact?: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <button type="button" onClick={onDetail} className={`${compact ? "h-7 px-2" : "h-7 w-7"} inline-flex items-center justify-center rounded-lg border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC]`}>
        <Eye className="size-3.5" />
      </button>
      {!compact ? (
        <Link href={`/dashboard/master-data/students/${row.id}/edit`} className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC]">
          <Pencil className="size-3.5" />
        </Link>
      ) : null}
      <details className="relative">
        <summary className={`${compact ? "h-7 px-2" : "h-7 w-7"} inline-flex cursor-pointer list-none items-center justify-center rounded-lg border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC]`}>
          <MoreHorizontal className="size-3.5" />
        </summary>
        <div className="absolute right-0 z-30 mt-2 grid min-w-44 gap-1 rounded-xl border border-[#E2E8F0] bg-white p-2 text-xs shadow-lg">
          {compact ? <Link href={`/dashboard/master-data/students/${row.id}/edit`} className="rounded-lg px-2 py-1.5 hover:bg-[#F8FAFC]">Edit</Link> : null}
          <button type="button" disabled className="rounded-lg px-2 py-1.5 text-left text-[#94A3B8]">Reset Password</button>
          <form action={toggleUserStatusAction}>
            <input type="hidden" name="target" value="students" />
            <input type="hidden" name="id" value={row.id} />
            <input type="hidden" name="status" value={row.status === "active" ? "inactive" : "active"} />
            <ConfirmSubmitButton confirmMessage={`${row.status === "active" ? "Nonaktifkan" : "Aktifkan"} akun ${row.name}?`} className="w-full justify-start rounded-lg border-0 px-2">
              {row.status === "active" ? "Nonaktifkan" : "Aktifkan"}
            </ConfirmSubmitButton>
          </form>
          <button type="button" disabled className="rounded-lg px-2 py-1.5 text-left text-[#94A3B8]">Hapus</button>
        </div>
      </details>
    </div>
  );
}

function Pagination({ currentPage, pageCount, total, rowsPerPage, onPage }: { currentPage: number; pageCount: number; total: number; rowsPerPage: number; onPage: (page: number) => void }) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 text-sm text-[#64748B] shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <span>{(currentPage - 1) * rowsPerPage + 1}-{Math.min(total, currentPage * rowsPerPage)} dari {total} data</span>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => onPage(Math.max(1, currentPage - 1))} disabled={currentPage <= 1} className="inline-flex h-8 items-center gap-1 rounded-xl border border-[#E2E8F0] px-3 text-xs disabled:opacity-50"><ChevronLeft className="size-3.5" />Sebelumnya</button>
        <span className="text-xs">{currentPage} / {pageCount}</span>
        <button type="button" onClick={() => onPage(Math.min(pageCount, currentPage + 1))} disabled={currentPage >= pageCount} className="inline-flex h-8 items-center gap-1 rounded-xl border border-[#E2E8F0] px-3 text-xs disabled:opacity-50">Berikutnya<ChevronRight className="size-3.5" /></button>
      </div>
    </div>
  );
}

function StudentDrawer({ row, onClose }: { row: StudentRow; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
      <aside className="h-full w-full max-w-md bg-white p-5 shadow-xl">
        <div className="flex justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-[#0F172A]">{row.name}</h2>
            <p className="text-sm text-[#64748B]">{row.username}</p>
          </div>
          <button onClick={onClose} className="rounded-xl border border-[#E2E8F0] px-3 py-1.5 text-sm">Tutup</button>
        </div>
        <div className="mt-5 grid gap-3 text-sm">
          {[
            ["Kelas", row.className],
            ["NIS", row.nis || "-"],
            ["NISN", row.nisn || "-"],
            ["Email", row.email],
            ["Telepon", row.phone || "-"],
            ["Kelas aktif", String(row.activeClassCount)],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between gap-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3">
              <span className="text-[#64748B]">{label}</span>
              <span className="text-right font-medium text-[#0F172A]">{value}</span>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
