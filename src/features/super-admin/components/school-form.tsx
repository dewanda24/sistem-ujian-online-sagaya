import { ConfirmSubmitButton } from "@/components/dashboard/confirm-submit-button";
import { saveSchoolAction } from "@/lib/actions/master-data-actions";

type SchoolFormData = {
  id?: string | null;
  name?: string | null;
  npsn?: string | null;
  education_level?: string | null;
  address?: string | null;
  city?: string | null;
  province?: string | null;
  phone?: string | null;
  email?: string | null;
  is_active?: boolean | null;
};

type SchoolFormProps = {
  school?: SchoolFormData | null;
  redirectPath: string;
};

export function SchoolForm({ school, redirectPath }: SchoolFormProps) {
  return (
    <form action={saveSchoolAction} className="grid gap-4 md:grid-cols-2">
      <input type="hidden" name="redirect_path" value={redirectPath} />
      <input type="hidden" name="id" defaultValue={school?.id ?? ""} />
      <input
        name="name"
        defaultValue={school?.name ?? ""}
        placeholder="Nama Sekolah"
        className="rounded-md border px-3 py-2 text-sm"
        required
      />
      <input
        name="npsn"
        defaultValue={school?.npsn ?? ""}
        placeholder="NPSN"
        className="rounded-md border px-3 py-2 text-sm"
      />
      <select
        name="education_level"
        defaultValue={school?.education_level ?? ""}
        className="rounded-md border px-3 py-2 text-sm"
      >
        <option value="">Jenjang</option>
        <option value="SD/MI">SD/MI</option>
        <option value="SMP/MTs">SMP/MTs</option>
        <option value="SMA/MA">SMA/MA</option>
        <option value="SMK/MAK">SMK/MAK</option>
        <option value="PKBM">PKBM</option>
      </select>
      <input
        name="email"
        type="email"
        defaultValue={school?.email ?? ""}
        placeholder="Email"
        className="rounded-md border px-3 py-2 text-sm"
      />
      <input
        name="phone"
        defaultValue={school?.phone ?? ""}
        placeholder="Telepon"
        className="rounded-md border px-3 py-2 text-sm"
      />
      <input
        name="city"
        defaultValue={school?.city ?? ""}
        placeholder="Kota/Kabupaten"
        className="rounded-md border px-3 py-2 text-sm"
      />
      <input
        name="province"
        defaultValue={school?.province ?? ""}
        placeholder="Provinsi"
        className="rounded-md border px-3 py-2 text-sm"
      />
      <textarea
        name="address"
        defaultValue={school?.address ?? ""}
        placeholder="Alamat"
        className="min-h-24 rounded-md border px-3 py-2 text-sm md:col-span-2"
      />
      <label className="flex items-center gap-2 text-sm">
        <input
          name="is_active"
          type="checkbox"
          defaultChecked={school?.is_active ?? true}
        />
        Status Aktif
      </label>
      <div className="flex justify-end md:col-span-2">
        <ConfirmSubmitButton
          confirmMessage={
            school?.id
              ? "Simpan perubahan profil sekolah?"
              : "Tambah sekolah baru ke platform?"
          }
          confirmTitle="Konfirmasi Sekolah"
          loadingText={school?.id ? "Memperbarui..." : "Menyimpan..."}
          variant="default"
          className="px-4 py-2 text-sm"
        >
          {school?.id ? "Simpan Perubahan" : "Tambah Sekolah"}
        </ConfirmSubmitButton>
      </div>
    </form>
  );
}
