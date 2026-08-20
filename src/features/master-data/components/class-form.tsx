import Link from "next/link";

import { SubmitButton } from "@/components/dashboard/submit-button";
import { saveClassAction } from "@/lib/actions/master-data-actions";
import type { SelectOption } from "@/lib/master-data/queries";

type ClassFormData = {
  id?: string;
  school_id?: string | null;
  academic_year_id?: string | null;
  name?: string | null;
  grade_level?: number | string | null;
  homeroom_teacher_id?: string | null;
  is_active?: boolean | null;
};

export function ClassForm({
  classItem,
  schools,
  academicYears,
  teachers,
}: {
  classItem?: ClassFormData | null;
  schools: SelectOption[];
  academicYears: SelectOption[];
  teachers: SelectOption[];
}) {
  const isSingleSchool = schools.length <= 1;
  const isEdit = Boolean(classItem?.id);

  return (
    <form action={saveClassAction} className="grid gap-4 rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm md:grid-cols-2">
      <input type="hidden" name="id" defaultValue={classItem?.id ?? ""} />

      {isSingleSchool ? (
        <input type="hidden" name="school_id" value={classItem?.school_id ?? schools[0]?.value ?? ""} />
      ) : (
        <div className="md:col-span-2">
          <label className="mb-1 block text-xs font-medium text-[#64748B]">Sekolah <span className="text-red-500">*</span></label>
          <select name="school_id" defaultValue={classItem?.school_id ?? schools[0]?.value ?? ""} className="w-full rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm focus:border-blue-600 focus:outline-none" required>
            {schools.map((school) => <option key={school.value} value={school.value}>{school.label}</option>)}
          </select>
        </div>
      )}

      <div>
        <label className="mb-1 block text-xs font-medium text-[#64748B]">Nama Kelas <span className="text-red-500">*</span></label>
        <input name="name" defaultValue={classItem?.name ?? ""} placeholder="Contoh: VII A, X IPA 1" className="w-full rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm focus:border-blue-600 focus:outline-none" required />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-[#64748B]">Tingkat / Jenjang Kelas <span className="text-red-500">*</span></label>
        <input name="grade_level" type="number" min="1" max="12" defaultValue={classItem?.grade_level ?? 7} className="w-full rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm focus:border-blue-600 focus:outline-none" required />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-[#64748B]">Tahun Ajaran <span className="text-red-500">*</span></label>
        <select name="academic_year_id" defaultValue={classItem?.academic_year_id ?? academicYears[0]?.value ?? ""} className="w-full rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm focus:border-blue-600 focus:outline-none" required>
          {academicYears.map((year) => <option key={year.value} value={year.value}>{year.label}</option>)}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-[#64748B]">Wali Kelas</label>
        <select name="homeroom_teacher_id" defaultValue={classItem?.homeroom_teacher_id ?? ""} className="w-full rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm focus:border-blue-600 focus:outline-none">
          <option value="">-- Tanpa Wali Kelas --</option>
          {teachers.map((teacher) => <option key={teacher.value} value={teacher.value}>{teacher.label}</option>)}
        </select>
      </div>

      <div className="md:col-span-2">
        <label className="flex items-center gap-2 text-sm text-[#0F172A]">
          <input name="is_active" type="checkbox" defaultChecked={classItem?.is_active ?? true} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
          Status Kelas Aktif
        </label>
      </div>

      <div className="flex justify-end gap-2 md:col-span-2 pt-2">
        <Link href="/dashboard/master-data/classes" className="rounded-xl border border-[#E2E8F0] px-4 py-2 text-sm font-medium hover:bg-[#F8FAFC]">Batal</Link>
        <SubmitButton loadingText={isEdit ? "Memperbarui..." : "Menyimpan..."}>
          {isEdit ? "Simpan Perubahan" : "Simpan Kelas"}
        </SubmitButton>
      </div>
    </form>
  );
}
