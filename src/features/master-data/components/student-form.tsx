import Link from "next/link";

import { SubmitButton } from "@/components/dashboard/submit-button";
import { saveClassMemberAction, saveStudentAction } from "@/lib/actions/master-data-actions";
import type { SelectOption } from "@/lib/master-data/queries";

type StudentFormUser = {
  id?: string;
  email?: string | null;
  username?: string | null;
  status?: string | null;
  user_profiles?:
    | {
        full_name?: string | null;
        nis?: string | null;
        nisn?: string | null;
        phone?: string | null;
      }
    | Array<{
        full_name?: string | null;
        nis?: string | null;
        nisn?: string | null;
        phone?: string | null;
      }>
    | null;
};

type ClassHistoryRow = {
  id: string;
  class_id?: string;
  joined_at?: string | null;
  left_at?: string | null;
  classes?: {
    name?: string | null;
  } | null;
};

function getProfile(user?: StudentFormUser | null) {
  const profile = Array.isArray(user?.user_profiles)
    ? user?.user_profiles[0]
    : user?.user_profiles;

  return profile ?? null;
}

export function StudentForm({
  student,
  classes,
  classHistory = [],
}: {
  student?: StudentFormUser | null;
  classes: SelectOption[];
  classHistory?: ClassHistoryRow[];
}) {
  const profile = getProfile(student);
  const isEdit = Boolean(student?.id);
  const activeClassId = classHistory.find((h) => !h.left_at)?.class_id;

  return (
    <div className="grid gap-4">
      <form action={saveStudentAction} className="grid gap-4 rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm md:grid-cols-2">
        <input type="hidden" name="id" defaultValue={student?.id ?? ""} />
        
        <label className="grid gap-1.5">
          <span className="text-sm font-medium text-[#0F172A]">Nama Lengkap <span className="text-red-500">*</span></span>
          <input name="full_name" defaultValue={profile?.full_name ?? ""} placeholder="Contoh: Budi Santoso" className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm" required />
        </label>
        
        <label className="grid gap-1.5">
          <span className="text-sm font-medium text-[#0F172A]">NIS</span>
          <input name="nis" defaultValue={profile?.nis ?? ""} placeholder="Nomor Induk Siswa" className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm" />
        </label>

        <label className="grid gap-1.5">
          <span className="text-sm font-medium text-[#0F172A]">NISN</span>
          <input name="nisn" defaultValue={profile?.nisn ?? ""} placeholder="Nomor Induk Siswa Nasional" className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm" />
        </label>

        <label className="grid gap-1.5">
          <span className="text-sm font-medium text-[#0F172A]">Telepon / WhatsApp</span>
          <input name="phone" defaultValue={profile?.phone ?? ""} placeholder="Contoh: 0812..." className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm" />
        </label>

        <label className="grid gap-1.5">
          <span className="text-sm font-medium text-[#0F172A]">Kelas Aktif</span>
          <select name="class_id" defaultValue={activeClassId ?? ""} className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm">
            <option value="">-- Tanpa Kelas --</option>
            {classes.map((classItem) => (
              <option key={classItem.value} value={classItem.value}>{classItem.label}</option>
            ))}
          </select>
        </label>

        <label className="grid gap-1.5">
          <span className="text-sm font-medium text-[#0F172A]">Status Akun</span>
          <select name="status" defaultValue={student?.status ?? "active"} className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm">
            <option value="active">Aktif</option>
            <option value="inactive">Tidak Aktif</option>
          </select>
        </label>

        <div className="md:col-span-2 my-2 border-t border-[#E2E8F0]" />

        <label className="grid gap-1.5">
          <span className="text-sm font-medium text-[#0F172A]">Email <span className="text-red-500">*</span></span>
          <input name="email" type="email" defaultValue={student?.email ?? ""} placeholder="budi@sekolah.com" className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm" required />
        </label>
        
        <label className="grid gap-1.5">
          <span className="text-sm font-medium text-[#0F172A]">Username <span className="text-red-500">*</span></span>
          <input name="username" defaultValue={student?.username ?? ""} placeholder="budi123" className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm" required />
        </label>

        <label className="grid gap-1.5 md:col-span-2">
          <span className="text-sm font-medium text-[#0F172A]">Password Login</span>
          <input name="password" type="password" placeholder={isEdit ? "Biarkan kosong jika tidak ingin mengubah password" : "Jika kosong, password akan menggunakan NISN atau NIS"} className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm" />
        </label>

        <div className="flex justify-end gap-2 md:col-span-2 mt-4">
          <Link href="/dashboard/master-data/students" className="rounded-xl border border-[#E2E8F0] px-4 py-2 text-sm hover:bg-[#F8FAFC]">Batal</Link>
          <SubmitButton loadingText={isEdit ? "Memperbarui..." : "Menyimpan..."}>
            Simpan Siswa
          </SubmitButton>
        </div>
      </form>

      {isEdit && classHistory.length > 0 ? (
        <section className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm">
          <div className="mb-3">
            <h2 className="font-semibold text-[#0F172A]">Riwayat Kelas</h2>
            <p className="text-sm text-[#64748B]">Riwayat penempatan kelas siswa ini.</p>
          </div>
          <div className="divide-y divide-[#E2E8F0] rounded-xl border border-[#E2E8F0]">
            {classHistory.map((item) => (
              <div key={item.id} className="grid gap-1 px-3 py-2 text-sm sm:grid-cols-3">
                <span className="font-medium text-[#0F172A]">{item.classes?.name ?? "-"}</span>
                <span className="text-[#64748B]">Masuk {item.joined_at ?? "-"}</span>
                <span className="text-[#64748B]">Keluar {item.left_at ?? "Aktif"}</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
