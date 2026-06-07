import Link from "next/link";

import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { DownloadLoginCardsButton } from "@/features/master-data/components/download-login-card-button";
import { requirePermission } from "@/lib/auth/require-permission";
import { getClassOptions, getStudentLoginCards } from "@/lib/master-data/queries";

type PageProps = {
  searchParams: Promise<{
    class_id?: string;
    q?: string;
    password?: string;
  }>;
};

export default async function StudentLoginCardsPage({ searchParams }: PageProps) {
  await requirePermission("students.view");
  const params = await searchParams;
  const [classes, students, allStudents] = await Promise.all([
    getClassOptions(),
    getStudentLoginCards({ class_id: params.class_id, q: params.q }),
    getStudentLoginCards({ q: params.q }),
  ]);
  const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/login`;
  const passwordLabel = params.password?.trim() || "Password awal";
  const selectedClass = classes.find((classItem) => classItem.value === params.class_id);
  const previewStudent = students[0] ?? allStudents[0] ?? null;
  const filename = selectedClass
    ? `kartu-login-${selectedClass.label}`
    : "kartu-login-filter-siswa";

  return (
    <div className="space-y-5">
      <DashboardPageHeader
        title="Kartu Login Siswa"
        description="Unduh kartu login siswa per kelas atau semua kelas."
      />

      <section className="grid gap-4 rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <form className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
            <select
              name="class_id"
              defaultValue={params.class_id ?? ""}
              className="min-w-0 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 text-sm"
            >
              <option value="">Semua kelas aktif</option>
              {classes.map((classItem) => (
                <option key={classItem.value} value={classItem.value}>
                  {classItem.label}
                </option>
              ))}
            </select>
            <input
              name="q"
              defaultValue={params.q ?? ""}
              placeholder="Cari siswa"
              className="min-w-0 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 text-sm"
            />
            <input
              name="password"
              defaultValue={params.password ?? ""}
              placeholder="Password awal"
              className="min-w-0 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 text-sm"
            />
            <button className="rounded-xl bg-[#2563EB] px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
              Terapkan
            </button>
          </form>

          <div className="flex flex-wrap items-center gap-2">
            <DownloadLoginCardsButton
              students={students}
              password={passwordLabel}
              loginUrl={loginUrl}
              filename={filename}
              label={`Download PDF (${students.length})`}
            />
            <DownloadLoginCardsButton
              students={allStudents}
              password={passwordLabel}
              loginUrl={loginUrl}
              filename="kartu-login-semua-kelas"
              label={`Download Semua Kelas (${allStudents.length})`}
            />
            <Link
              href="/dashboard/master-data/students"
              className="rounded-xl border border-[#E2E8F0] px-4 py-2 text-sm font-medium text-[#0F172A] hover:bg-[#F8FAFC]"
            >
              Kembali ke Siswa
            </Link>
          </div>

          <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3 text-sm text-[#64748B]">
            {students.length} siswa sesuai filter. Pilih kelas dari dropdown untuk
            mengunduh satu kelas, atau gunakan Download Semua Kelas untuk seluruh
            siswa aktif.
          </div>
        </div>

        <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
          <div className="mb-3 text-sm font-semibold text-[#0F172A]">
            Preview Kartu
          </div>
          {previewStudent ? (
            <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm">
              <div className="text-xs font-semibold uppercase text-[#64748B]">
                Kartu Login Siswa
              </div>
              <div className="mt-3 line-clamp-2 text-base font-semibold text-[#0F172A]">
                {previewStudent.full_name}
              </div>
              <div className="mt-1 line-clamp-1 text-xs text-[#64748B]">
                {previewStudent.class_name}
              </div>
              <div className="mt-4 grid gap-2 text-sm">
                <PreviewRow label="Username" value={previewStudent.username} />
                <PreviewRow label="Password" value={passwordLabel} />
                <PreviewRow label="Sekolah" value="Sistem Ujian Online" />
              </div>
            </div>
          ) : (
            <EmptyState
              title="Tidak ada preview"
              description="Pilih kelas atau pastikan ada siswa aktif."
            />
          )}
        </div>
      </section>

      <div className="hidden rounded-xl border border-[#E2E8F0] bg-white shadow-sm md:block">
        {students.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="Tidak ada siswa"
              description="Tidak ada siswa aktif sesuai filter kartu login."
            />
          </div>
        ) : (
          <table className="w-full table-fixed text-left text-sm">
            <thead className="border-b border-[#E2E8F0] text-xs uppercase text-[#64748B]">
              <tr className="h-10">
                <th className="px-3 py-2 font-medium">Nama</th>
                <th className="w-48 px-3 py-2 font-medium">Kelas</th>
                <th className="w-40 px-3 py-2 font-medium">Username</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {students.slice(0, 15).map((student) => (
                <tr key={student.id} className="h-14 hover:bg-[#F8FAFC]">
                  <td className="min-w-0 px-3 py-2">
                    <div className="line-clamp-1 font-medium text-[#0F172A]">
                      {student.full_name}
                    </div>
                  </td>
                  <td className="truncate px-3 py-2 text-[#64748B]">
                    {student.class_name}
                  </td>
                  <td className="truncate px-3 py-2 text-[#0F172A]">
                    {student.username}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="grid gap-2 md:hidden">
        {students.length ? students.slice(0, 15).map((student) => (
          <article key={student.id} className="max-h-[112px] rounded-xl border border-[#E2E8F0] bg-white p-3 shadow-sm">
            <div className="line-clamp-1 text-sm font-medium text-[#0F172A]">
              {student.full_name}
            </div>
            <div className="mt-1 line-clamp-1 text-xs text-[#64748B]">
              {student.class_name}
            </div>
            <div className="mt-2 line-clamp-1 text-xs font-medium text-[#0F172A]">
              {student.username}
            </div>
          </article>
        )) : (
          <div className="rounded-xl border border-[#E2E8F0] bg-white p-8">
            <EmptyState
              title="Tidak ada siswa"
              description="Tidak ada siswa aktif sesuai filter kartu login."
            />
          </div>
        )}
      </div>
    </div>
  );
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[#64748B]">{label}</span>
      <span className="line-clamp-1 text-right font-medium text-[#0F172A]">
        {value}
      </span>
    </div>
  );
}
