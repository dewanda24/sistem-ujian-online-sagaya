import Link from "next/link";

import { SubmitButton } from "@/components/dashboard/submit-button";
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
      <form action={saveTeacherAction} className="grid gap-4 rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm md:grid-cols-2">
        <input type="hidden" name="id" defaultValue={teacher?.id ?? ""} />

        <div>
          <label className="mb-1 block text-xs font-medium text-[#64748B]">Nama Lengkap <span className="text-red-500">*</span></label>
          <input name="full_name" defaultValue={profile?.full_name ?? ""} placeholder="Contoh: Drs. Ahmad Fauzi, M.Pd" className="w-full rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm focus:border-blue-600 focus:outline-none" required />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-[#64748B]">NIP</label>
          <input name="nip" defaultValue={profile?.nip ?? ""} placeholder="Nomor Induk Pegawai" className="w-full rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm focus:border-blue-600 focus:outline-none" />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-[#64748B]">Email <span className="text-red-500">*</span></label>
          <input name="email" type="email" defaultValue={teacher?.email ?? ""} placeholder="ahmad.fauzi@sekolah.com" className="w-full rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm focus:border-blue-600 focus:outline-none" required />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-[#64748B]">Username <span className="text-red-500">*</span></label>
          <input name="username" defaultValue={teacher?.username ?? ""} placeholder="ahmadfauzi" className="w-full rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm focus:border-blue-600 focus:outline-none" required />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-[#64748B]">No. Telepon / WhatsApp</label>
          <input name="phone" defaultValue={profile?.phone ?? ""} placeholder="Contoh: 081234567890" className="w-full rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm focus:border-blue-600 focus:outline-none" />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-[#64748B]">Status Akun</label>
          <select name="status" defaultValue={teacher?.status ?? "active"} className="w-full rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm focus:border-blue-600 focus:outline-none">
            <option value="active">Aktif</option>
            <option value="inactive">Tidak Aktif</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="mb-1 block text-xs font-medium text-[#64748B]">Password Login</label>
          <input name="password" type="password" placeholder={isEdit ? "Biarkan kosong jika tidak ingin mengubah password" : "Password awal untuk login guru"} className="w-full rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm focus:border-blue-600 focus:outline-none" />
        </div>

        <div className="flex justify-end gap-2 md:col-span-2 pt-2">
          <Link href="/dashboard/master-data/teachers" className="rounded-xl border border-[#E2E8F0] px-4 py-2 text-sm font-medium hover:bg-[#F8FAFC]">Batal</Link>
          <SubmitButton loadingText={isEdit ? "Memperbarui..." : "Menyimpan..."}>
            {isEdit ? "Simpan Perubahan" : "Simpan Guru"}
          </SubmitButton>
        </div>
      </form>

      {isEdit ? (
        <section className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm">
          <div className="mb-3">
            <h2 className="font-semibold text-[#0F172A]">Penugasan Guru</h2>
            <p className="text-sm text-[#64748B]">
              Atur mata pelajaran, kelas, dan tahun ajaran yang diajar guru.
            </p>
          </div>
          <form action={saveTeacherAssignmentAction} className="grid gap-3 md:grid-cols-4">
            <input type="hidden" name="teacher_id" value={teacher?.id ?? ""} />
            <select name="subject_id" className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm" required>{subjects.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
            <select name="class_id" className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm" required>{classes.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
            <select name="academic_year_id" className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm" required>{academicYears.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
            <SubmitButton loadingText="Menyimpan...">Tambah</SubmitButton>
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
