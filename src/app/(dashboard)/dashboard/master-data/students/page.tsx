export const dynamic = "force-dynamic";

import Link from "next/link";
import { Plus, Printer } from "lucide-react";

import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { ActionToast } from "@/components/master-data/action-toast";
import { StudentsTable, type StudentRow } from "@/features/master-data/components/students-table";
import { requirePermission } from "@/lib/auth/require-permission";
import {
  getClassOptions,
  getUsersByRole,
} from "@/lib/master-data/queries";


type PageProps = {
  searchParams: Promise<{
    q?: string;
    class_id?: string;
    status?: string;
    message?: string;
  }>;
};

function getProfile(user: {
  user_profiles?:
    | { full_name?: string | null; nis?: string | null; nisn?: string | null; phone?: string | null }
    | Array<{ full_name?: string | null; nis?: string | null; nisn?: string | null; phone?: string | null }>
    | null;
}) {
  return Array.isArray(user.user_profiles) ? user.user_profiles[0] : user.user_profiles;
}

export default async function StudentsPage({ searchParams }: PageProps) {
  await requirePermission("students.view");
  const params = await searchParams;
  const [students, classes] = await Promise.all([
    getUsersByRole("student", params.q),
    getClassOptions(),
  ]);
  const rows: StudentRow[] = students
    .map((student) => {
      const profile = getProfile(student);
      const classMembers = student.class_members ?? [];
      const activeClass = Array.isArray(classMembers) ? classMembers.find((item: any) => !item.left_at) : null;
      const activeClassCount = Array.isArray(classMembers) ? classMembers.filter((item: any) => !item.left_at).length : 0;

      return {
        id: student.id,
        name: profile?.full_name ?? student.username,
        username: student.username,
        email: student.email,
        nis: profile?.nis ?? "",
        nisn: profile?.nisn ?? "",
        phone: profile?.phone ?? "",
        status: student.status,
        className: activeClass?.classes?.name ?? "Belum ada kelas",
        activeClassCount,
      };
    })
    .filter((row) => (params.status ? row.status === params.status : true))
    .filter((row) => (params.class_id ? row.className.includes(classes.find((item) => item.value === params.class_id)?.label.split(" - ")[0] ?? "") : true));

  return (
    <div className="space-y-5">
      <ActionToast status={params.status} message={params.message} />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <DashboardPageHeader
          title="Siswa"
          description="Kelola data siswa, kelas, dan status akun."
        />
        <div className="flex gap-2">
          <Link
            href="/dashboard/reports/login-cards"
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#E2E8F0] bg-white px-3.5 py-2 text-sm font-medium text-[#0F172A] shadow-sm transition-all hover:bg-[#F8FAFC]"
          >
            <Printer className="size-4 text-[#64748B]" />
            <span>Cetak Kartu Login</span>
          </Link>
          <Link
            href="/dashboard/master-data/students/create"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#2563EB] px-3.5 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-blue-700"
          >
            <Plus className="size-4" />
            <span>Tambah Siswa</span>
          </Link>
        </div>
      </div>

      <form className="grid gap-3 rounded-xl border border-[#E2E8F0] bg-white p-3 shadow-sm md:grid-cols-[1.5fr_1fr_1fr_auto]">
        <input name="q" defaultValue={params.q ?? ""} placeholder="Cari siswa" className="min-w-0 rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm" />
        <select name="class_id" defaultValue={params.class_id ?? ""} className="min-w-0 rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm">
          <option value="">Semua kelas</option>
          {classes.map((classItem) => <option key={classItem.value} value={classItem.value}>{classItem.label}</option>)}
        </select>
        <select name="status" defaultValue={params.status ?? ""} className="min-w-0 rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm">
          <option value="">Semua status</option>
          <option value="active">Aktif</option>
          <option value="inactive">Tidak Aktif</option>
        </select>
        <div className="flex gap-2">
          <Link href="/dashboard/master-data/students" className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm hover:bg-[#F8FAFC]">Reset</Link>
          <button className="rounded-xl bg-[#2563EB] px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Filter</button>
        </div>
      </form>

      <StudentsTable rows={rows} />
    </div>
  );
}
