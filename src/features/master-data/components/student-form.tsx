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

  return (
    <div className="grid gap-4">
      <form action={saveStudentAction} className="grid gap-4 rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm md:grid-cols-2">
        <input type="hidden" name="id" defaultValue={student?.id ?? ""} />
        <input name="full_name" defaultValue={profile?.full_name ?? ""} placeholder="Nama lengkap" className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm" required />
        <input name="nis" defaultValue={profile?.nis ?? ""} placeholder="NIS" className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm" />
        <input name="nisn" defaultValue={profile?.nisn ?? ""} placeholder="NISN" className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm" />
        <input name="phone" defaultValue={profile?.phone ?? ""} placeholder="Telepon" className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm" />
        <input name="email" defaultValue={student?.email ?? ""} placeholder="Email" className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm" required />
        <input name="username" defaultValue={student?.username ?? ""} placeholder="Username" className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm" required />
        <input name="password" type="password" placeholder={isEdit ? "Kosongkan jika tidak diubah" : "Password awal"} className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm" />
        <select name="status" defaultValue={student?.status ?? "active"} className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm">
          <option value="active">Aktif</option>
          <option value="inactive">Tidak Aktif</option>
        </select>
        <div className="flex justify-end gap-2 md:col-span-2">
          <Link href="/dashboard/master-data/students" className="rounded-xl border border-[#E2E8F0] px-4 py-2 text-sm hover:bg-[#F8FAFC]">Batal</Link>
          <SubmitButton loadingText={isEdit ? "Memperbarui..." : "Menyimpan..."}>
            Simpan Siswa
          </SubmitButton>
        </div>
      </form>

      {isEdit ? (
        <section className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm">
          <div className="mb-3">
            <h2 className="font-semibold text-[#0F172A]">Kelas Siswa</h2>
            <p className="text-sm text-[#64748B]">Atur kelas aktif siswa dari daftar kelas yang tersedia.</p>
          </div>
          <form action={saveClassMemberAction} className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
            <input type="hidden" name="student_id" value={student?.id ?? ""} />
            <select name="class_id" className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm" required>
              {classes.map((classItem) => (
                <option key={classItem.value} value={classItem.value}>{classItem.label}</option>
              ))}
            </select>
            <input name="joined_at" type="date" className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm" />
            <SubmitButton loadingText="Menyimpan...">Tetapkan</SubmitButton>
          </form>
          <div className="mt-3 divide-y divide-[#E2E8F0] rounded-xl border border-[#E2E8F0]">
            {classHistory.length ? classHistory.map((item) => (
              <div key={item.id} className="grid gap-1 px-3 py-2 text-sm sm:grid-cols-3">
                <span className="font-medium text-[#0F172A]">{item.classes?.name ?? "-"}</span>
                <span className="text-[#64748B]">Masuk {item.joined_at ?? "-"}</span>
                <span className="text-[#64748B]">Keluar {item.left_at ?? "Aktif"}</span>
              </div>
            )) : (
              <p className="px-3 py-4 text-sm text-[#64748B]">Belum ada riwayat kelas.</p>
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
}
