import Link from "next/link";

import { SubmitButton } from "@/components/dashboard/submit-button";
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
  const isSingleSchool = schools.length <= 1;
  const isEdit = Boolean(academicYear?.id);

  return (
    <form action={saveAcademicYearAction} className="grid gap-5 rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
      <input type="hidden" name="id" defaultValue={academicYear?.id ?? ""} />
      
      {isSingleSchool ? (
        <input type="hidden" name="school_id" value={academicYear?.school_id ?? schools[0]?.value ?? ""} />
      ) : (
        <div>
          <label className="mb-1 block text-xs font-medium text-[#64748B]">Sekolah <span className="text-red-500">*</span></label>
          <select name="school_id" defaultValue={academicYear?.school_id ?? schools[0]?.value ?? ""} className="w-full rounded-xl border border-[#E2E8F0] px-3 py-2.5 text-sm" required>
            {schools.map((school) => <option key={school.value} value={school.value}>{school.label}</option>)}
          </select>
        </div>
      )}

      <div>
        <label className="mb-1 block text-xs font-medium text-[#64748B]">Nama Tahun Ajaran <span className="text-red-500">*</span></label>
        <input
          name="name"
          defaultValue={academicYear?.name ?? ""}
          placeholder="Contoh: 2025/2026"
          className="w-full rounded-xl border border-[#E2E8F0] px-3 py-2.5 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
          required
        />
        <p className="mt-1 text-xs text-[#94A3B8]">Format umum: YYYY/YYYY (misal: 2025/2026)</p>
      </div>

      {!isEdit ? (
        <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
          <label className="mb-2 block text-xs font-semibold text-[#0F172A]">Pilih Semester Aktif Saat Ini</label>
          <div className="flex flex-wrap gap-6">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-[#0F172A]">
              <input type="radio" name="initial_semester" value="ganjil" defaultChecked className="h-4 w-4 text-blue-600" />
              <span>Semester Ganjil</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-[#0F172A]">
              <input type="radio" name="initial_semester" value="genap" className="h-4 w-4 text-blue-600" />
              <span>Semester Genap</span>
            </label>
          </div>
          <p className="mt-2 text-xs text-[#64748B]">
            💡 Sistem otomatis membuatkan 2 semester (Ganjil & Genap). Anda bisa mengganti semester aktif kapan saja di tabel.
          </p>
        </div>
      ) : null}

      <div>
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-[#0F172A]">
          <input
            name="is_active"
            type="checkbox"
            defaultChecked={academicYear ? (academicYear.is_active ?? false) : true}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          Jadikan sebagai tahun ajaran aktif saat ini
        </label>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Link href="/dashboard/master-data/academic-years" className="rounded-xl border border-[#E2E8F0] px-4 py-2.5 text-sm font-medium hover:bg-[#F8FAFC]">
          Batal
        </Link>
        <SubmitButton loadingText={isEdit ? "Memperbarui..." : "Menyimpan..."}>
          {isEdit ? "Simpan Perubahan" : "Buat Tahun Ajaran"}
        </SubmitButton>
      </div>
    </form>
  );
}
