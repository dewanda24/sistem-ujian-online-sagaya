import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { ActionToast } from "@/components/master-data/action-toast";
import { DataTable } from "@/components/master-data/data-table";
import { FormSection } from "@/components/master-data/form-section";
import { SearchForm } from "@/components/master-data/search-form";
import { StatusBadge } from "@/components/master-data/status-badge";
import {
  saveSchoolAction,
  toggleSchoolAction,
} from "@/lib/actions/master-data-actions";
import { requirePermission } from "@/lib/auth/require-permission";
import { getSchools } from "@/lib/master-data/queries";

type PageProps = {
  searchParams: Promise<{
    q?: string;
    edit?: string;
    status?: string;
    message?: string;
  }>;
};

export default async function SchoolsPage({ searchParams }: PageProps) {
  await requirePermission("schools.view");
  const params = await searchParams;
  const schools = await getSchools(params.q);
  const editable = schools.find((school) => school.id === params.edit);

  return (
    <div className="space-y-6">
      <ActionToast status={params.status} message={params.message} />
      <DashboardPageHeader
        title="Sekolah"
        description="Kelola sekolah sebagai scope utama data akademik. Aplikasi saat ini single-school, tetapi tetap menyimpan school_id untuk kesiapan multi-school."
      />

      <FormSection
        title={editable ? "Edit Sekolah" : "Tambah Sekolah"}
        description="Gunakan status inactive untuk menonaktifkan sekolah tanpa menghapus data akademik."
      >
        <form action={saveSchoolAction} className="grid gap-4 md:grid-cols-2">
          <input type="hidden" name="id" defaultValue={editable?.id ?? ""} />
          <input
            name="name"
            defaultValue={editable?.name ?? ""}
            placeholder="Nama sekolah"
            className="rounded-md border px-3 py-2 text-sm"
            required
          />
          <input
            name="npsn"
            defaultValue={editable?.npsn ?? ""}
            placeholder="NPSN"
            className="rounded-md border px-3 py-2 text-sm"
          />
          <input
            name="email"
            defaultValue={editable?.email ?? ""}
            placeholder="Email"
            className="rounded-md border px-3 py-2 text-sm"
          />
          <input
            name="phone"
            defaultValue={editable?.phone ?? ""}
            placeholder="Telepon"
            className="rounded-md border px-3 py-2 text-sm"
          />
          <textarea
            name="address"
            defaultValue={editable?.address ?? ""}
            placeholder="Alamat"
            className="min-h-20 rounded-md border px-3 py-2 text-sm md:col-span-2"
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              name="is_active"
              type="checkbox"
              defaultChecked={editable?.is_active ?? true}
            />
            Aktif
          </label>
          <div className="flex justify-end md:col-span-2">
            <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
              Simpan Sekolah
            </button>
          </div>
        </form>
      </FormSection>

      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <h2 className="text-base font-semibold">Daftar Sekolah</h2>
        <SearchForm placeholder="Cari sekolah" defaultValue={params.q} />
      </div>

      <DataTable
        columns={["Nama", "NPSN", "Kontak", "Status", "Aksi"]}
        isEmpty={schools.length === 0}
        empty={
          <EmptyState
            title="Belum ada sekolah"
            description="Tambahkan sekolah pertama sebagai scope master data."
          />
        }
      >
        {schools.map((school) => (
          <tr key={school.id}>
            <td className="px-4 py-3 font-medium">{school.name}</td>
            <td className="px-4 py-3">{school.npsn || "-"}</td>
            <td className="px-4 py-3 text-muted-foreground">
              {school.email || school.phone || "-"}
            </td>
            <td className="px-4 py-3">
              <StatusBadge active={Boolean(school.is_active)} />
            </td>
            <td className="px-4 py-3">
              <div className="flex gap-2">
                <a
                  href={`/dashboard/master-data/schools?edit=${school.id}`}
                  className="rounded-md border px-3 py-1.5 text-xs hover:bg-muted"
                >
                  Edit
                </a>
                <form action={toggleSchoolAction}>
                  <input type="hidden" name="id" value={school.id} />
                  <input
                    type="hidden"
                    name="is_active"
                    value={school.is_active ? "false" : "true"}
                  />
                  <button className="rounded-md border px-3 py-1.5 text-xs hover:bg-muted">
                    {school.is_active ? "Nonaktifkan" : "Aktifkan"}
                  </button>
                </form>
              </div>
            </td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}
