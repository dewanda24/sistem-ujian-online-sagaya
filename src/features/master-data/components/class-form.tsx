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
  return (
    <form action={saveClassAction} className="grid gap-4 rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm md:grid-cols-2">
      <input type="hidden" name="id" defaultValue={classItem?.id ?? ""} />
      <select name="school_id" defaultValue={classItem?.school_id ?? schools[0]?.value ?? ""} className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm" required>
        {schools.map((school) => <option key={school.value} value={school.value}>{school.label}</option>)}
      </select>
      <select name="academic_year_id" defaultValue={classItem?.academic_year_id ?? academicYears[0]?.value ?? ""} className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm" required>
        {academicYears.map((year) => <option key={year.value} value={year.value}>{year.label}</option>)}
      </select>
      <input name="name" defaultValue={classItem?.name ?? ""} placeholder="VII A" className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm" required />
      <input name="grade_level" type="number" min="1" max="12" defaultValue={classItem?.grade_level ?? 7} className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm" required />
      <select name="homeroom_teacher_id" defaultValue={classItem?.homeroom_teacher_id ?? ""} className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm">
        <option value="">Tanpa wali kelas</option>
        {teachers.map((teacher) => <option key={teacher.value} value={teacher.value}>{teacher.label}</option>)}
      </select>
      <label className="flex items-center gap-2 text-sm text-[#0F172A]">
        <input name="is_active" type="checkbox" defaultChecked={classItem?.is_active ?? true} />
        Aktif
      </label>
      <div className="flex justify-end gap-2 md:col-span-2">
        <Link href="/dashboard/master-data/classes" className="rounded-xl border border-[#E2E8F0] px-4 py-2 text-sm hover:bg-[#F8FAFC]">Batal</Link>
        <SubmitButton loadingText={classItem?.id ? "Memperbarui..." : "Menyimpan..."}>
          Simpan Kelas
        </SubmitButton>
      </div>
    </form>
  );
}
