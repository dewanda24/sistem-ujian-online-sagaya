import Link from "next/link";

import { saveAcademicYearAction } from "@/lib/actions/master-data-actions";
import type { SelectOption } from "@/lib/master-data/queries";

type AcademicYearFormData = {
  id?: string;
  school_id?: string | null;
  name?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  is_active?: boolean | null;
};

export function AcademicYearForm({ academicYear, schools }: { academicYear?: AcademicYearFormData | null; schools: SelectOption[] }) {
  return (
    <form action={saveAcademicYearAction} className="grid gap-4 rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm md:grid-cols-2">
      <input type="hidden" name="id" defaultValue={academicYear?.id ?? ""} />
      <select name="school_id" defaultValue={academicYear?.school_id ?? schools[0]?.value ?? ""} className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm" required>
        {schools.map((school) => <option key={school.value} value={school.value}>{school.label}</option>)}
      </select>
      <input name="name" defaultValue={academicYear?.name ?? ""} placeholder="2025/2026" className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm" required />
      <input name="starts_at" type="date" defaultValue={academicYear?.start_date ?? ""} className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm" />
      <input name="ends_at" type="date" defaultValue={academicYear?.end_date ?? ""} className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm" />
      <label className="flex items-center gap-2 text-sm text-[#0F172A]">
        <input name="is_active" type="checkbox" defaultChecked={academicYear?.is_active ?? false} />
        Jadikan aktif
      </label>
      <div className="flex justify-end gap-2 md:col-span-2">
        <Link href="/dashboard/master-data/academic-years" className="rounded-xl border border-[#E2E8F0] px-4 py-2 text-sm hover:bg-[#F8FAFC]">Batal</Link>
        <button className="rounded-xl bg-[#2563EB] px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Simpan Tahun Ajaran</button>
      </div>
    </form>
  );
}
