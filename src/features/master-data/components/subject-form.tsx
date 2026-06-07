import Link from "next/link";

import { saveSubjectAction } from "@/lib/actions/master-data-actions";
import type { SelectOption } from "@/lib/master-data/queries";

type SubjectFormData = {
  id?: string;
  school_id?: string | null;
  code?: string | null;
  name?: string | null;
  is_active?: boolean | null;
};

export function SubjectForm({ subject, schools }: { subject?: SubjectFormData | null; schools: SelectOption[] }) {
  return (
    <form action={saveSubjectAction} className="grid gap-4 rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm md:grid-cols-2">
      <input type="hidden" name="id" defaultValue={subject?.id ?? ""} />
      <select name="school_id" defaultValue={subject?.school_id ?? schools[0]?.value ?? ""} className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm" required>
        {schools.map((school) => <option key={school.value} value={school.value}>{school.label}</option>)}
      </select>
      <input name="code" defaultValue={subject?.code ?? ""} placeholder="Kode mapel" className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm" required />
      <input name="name" defaultValue={subject?.name ?? ""} placeholder="Nama mapel" className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm md:col-span-2" required />
      <label className="flex items-center gap-2 text-sm text-[#0F172A]">
        <input name="is_active" type="checkbox" defaultChecked={subject?.is_active ?? true} />
        Aktif
      </label>
      <div className="flex justify-end gap-2 md:col-span-2">
        <Link href="/dashboard/master-data/subjects" className="rounded-xl border border-[#E2E8F0] px-4 py-2 text-sm hover:bg-[#F8FAFC]">Batal</Link>
        <button className="rounded-xl bg-[#2563EB] px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Simpan Mapel</button>
      </div>
    </form>
  );
}
