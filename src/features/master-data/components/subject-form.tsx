import Link from "next/link";

import { SubmitButton } from "@/components/dashboard/submit-button";
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
  const isSingleSchool = schools.length <= 1;
  const isEdit = Boolean(subject?.id);

  return (
    <form action={saveSubjectAction} className="grid gap-4 rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm md:grid-cols-2">
      <input type="hidden" name="id" defaultValue={subject?.id ?? ""} />

      {isSingleSchool ? (
        <input type="hidden" name="school_id" value={subject?.school_id ?? schools[0]?.value ?? ""} />
      ) : (
        <div className="md:col-span-2">
          <label className="mb-1 block text-xs font-medium text-[#64748B]">Sekolah <span className="text-red-500">*</span></label>
          <select name="school_id" defaultValue={subject?.school_id ?? schools[0]?.value ?? ""} className="w-full rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm focus:border-blue-600 focus:outline-none" required>
            {schools.map((school) => <option key={school.value} value={school.value}>{school.label}</option>)}
          </select>
        </div>
      )}

      <div>
        <label className="mb-1 block text-xs font-medium text-[#64748B]">Kode Mata Pelajaran <span className="text-red-500">*</span></label>
        <input name="code" defaultValue={subject?.code ?? ""} placeholder="Contoh: MAT, BIND, IPA" className="w-full rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm focus:border-blue-600 focus:outline-none" required />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-[#64748B]">Nama Mata Pelajaran <span className="text-red-500">*</span></label>
        <input name="name" defaultValue={subject?.name ?? ""} placeholder="Contoh: Matematika Wajib" className="w-full rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm focus:border-blue-600 focus:outline-none" required />
      </div>

      <div className="md:col-span-2">
        <label className="flex items-center gap-2 text-sm text-[#0F172A]">
          <input name="is_active" type="checkbox" defaultChecked={subject?.is_active ?? true} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
          Status Mata Pelajaran Aktif
        </label>
      </div>

      <div className="flex justify-end gap-2 md:col-span-2 pt-2">
        <Link href="/dashboard/master-data/subjects" className="rounded-xl border border-[#E2E8F0] px-4 py-2 text-sm font-medium hover:bg-[#F8FAFC]">Batal</Link>
        <SubmitButton loadingText={isEdit ? "Memperbarui..." : "Menyimpan..."}>
          {isEdit ? "Simpan Perubahan" : "Simpan Mata Pelajaran"}
        </SubmitButton>
      </div>
    </form>
  );
}
