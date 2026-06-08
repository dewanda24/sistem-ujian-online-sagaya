import Link from "next/link";

import { saveTeacherAction, saveTeacherAssignmentAction } from "@/lib/actions/master-data-actions";
import type { SelectOption } from "@/lib/master-data/queries";

type TeacherFormUser = {
  id?: string;
  email?: string | null;
  username?: string | null;
  status?: string | null;
  user_profiles?:
    | { full_name?: string | null; nip?: string | null; phone?: string | null }
    | Array<{ full_name?: string | null; nip?: string | null; phone?: string | null }>
    | null;
};

type AssignmentRow = {
  id: string;
  subjects?: { code?: string | null; name?: string | null } | null;
  classes?: { name?: string | null } | null;
  academic_years?: { name?: string | null } | null;
};

function getProfile(user?: TeacherFormUser | null) {
  return Array.isArray(user?.user_profiles) ? user?.user_profiles[0] : user?.user_profiles ?? null;
}

export function TeacherForm({
  teacher,
  subjects,
  classes,
  academicYears,
  assignments = [],
}: {
  teacher?: TeacherFormUser | null;
  subjects: SelectOption[];
  classes: SelectOption[];
  academicYears: SelectOption[];
  assignments?: AssignmentRow[];
}) {
  const profile = getProfile(teacher);
  const isEdit = Boolean(teacher?.id);

  return (
    <div className="grid gap-4">
      <form action={saveTeacherAction} className="grid gap-4 rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm md:grid-cols-2">
        <input type="hidden" name="id" defaultValue={teacher?.id ?? ""} />
        <input name="full_name" defaultValue={profile?.full_name ?? ""} placeholder="Nama lengkap" className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm" required />
        <input name="nip" defaultValue={profile?.nip ?? ""} placeholder="NIP" className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm" />
        <input name="email" defaultValue={teacher?.email ?? ""} placeholder="Email" className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm" required />
        <input name="username" defaultValue={teacher?.username ?? ""} placeholder="Username" className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm" required />
        <input name="phone" defaultValue={profile?.phone ?? ""} placeholder="Telepon" className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm" />
        <input name="password" type="password" placeholder={isEdit ? "Kosongkan jika tidak diubah" : "Password awal"} className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm" />
        <select name="status" defaultValue={teacher?.status ?? "active"} className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm">
          <option value="active">Aktif</option>
          <option value="inactive">Tidak Aktif</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-[#64748B]">
          <input type="checkbox" disabled />
          Pengawas Ujian
        </label>
        <div className="flex justify-end gap-2 md:col-span-2">
          <Link href="/dashboard/master-data/teachers" className="rounded-xl border border-[#E2E8F0] px-4 py-2 text-sm hover:bg-[#F8FAFC]">Batal</Link>
          <button className="rounded-xl bg-[#2563EB] px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Simpan Guru</button>
        </div>
      </form>

      {isEdit ? (
        <section className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm">
          <div className="mb-3">
            <h2 className="font-semibold text-[#0F172A]">Mapel Guru</h2>
            <p className="text-sm text-[#64748B]">
              Atur mata pelajaran, kelas, dan tahun ajaran yang diajar guru.
            </p>
          </div>
          <form action={saveTeacherAssignmentAction} className="grid gap-3 md:grid-cols-4">
            <input type="hidden" name="teacher_id" value={teacher?.id ?? ""} />
            <select name="subject_id" className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm" required>{subjects.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
            <select name="class_id" className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm" required>{classes.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
            <select name="academic_year_id" className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm" required>{academicYears.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
            <button className="rounded-xl bg-[#2563EB] px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Tambah</button>
          </form>
          <div className="mt-3 divide-y divide-[#E2E8F0] rounded-xl border border-[#E2E8F0]">
            {assignments.length ? assignments.map((item) => (
              <div key={item.id} className="grid gap-1 px-3 py-2 text-sm sm:grid-cols-3">
                <span className="font-medium text-[#0F172A]">{item.subjects?.code} - {item.subjects?.name}</span>
                <span className="text-[#64748B]">{item.classes?.name ?? "-"}</span>
                <span className="text-[#64748B]">{item.academic_years?.name ?? "-"}</span>
              </div>
            )) : <p className="px-3 py-4 text-sm text-[#64748B]">Belum ada penugasan.</p>}
          </div>
        </section>
      ) : null}
    </div>
  );
}
