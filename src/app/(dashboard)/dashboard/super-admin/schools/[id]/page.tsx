import Link from "next/link";
import { notFound } from "next/navigation";

import { ConfirmSubmitButton } from "@/components/dashboard/confirm-submit-button";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { ActionToast } from "@/components/master-data/action-toast";
import { DataTable } from "@/components/master-data/data-table";
import { FormSection } from "@/components/master-data/form-section";
import { StatusBadge } from "@/components/master-data/status-badge";
import {
  resetAdminUserPasswordAction,
  saveAdminUserAction,
  toggleAdminUserStatusAction,
} from "@/features/admin/actions";
import { getRoleOptionsByNames } from "@/features/admin/queries";
import { SchoolForm } from "@/features/super-admin/components/school-form";
import { getSuperAdminSchoolDetail } from "@/features/super-admin/school-management";
import { toggleSchoolAction } from "@/lib/actions/master-data-actions";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    edit?: string;
    status?: string;
    message?: string;
  }>;
};

export default async function SuperAdminSchoolDetailPage({
  params,
  searchParams,
}: PageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const [detail, roles] = await Promise.all([
    getSuperAdminSchoolDetail(id),
    getRoleOptionsByNames(["admin"]),
  ]);

  if (!detail) {
    notFound();
  }

  const { school, stats, admins } = detail;
  const adminRole = roles[0];
  const redirectPath = `/dashboard/super-admin/schools/${school.id}`;

  return (
    <div className="space-y-6">
      <ActionToast status={query.status} message={query.message} />
      <DashboardPageHeader
        title={school.name}
        description="Detail tenant sekolah, statistik lintas modul, dan admin sekolah terkait."
      />

      <div className="flex flex-wrap gap-2">
        <Link
          href="/dashboard/super-admin/schools"
          className="rounded-md border px-3 py-2 text-sm hover:bg-muted"
        >
          Daftar Sekolah
        </Link>
        <form action={toggleSchoolAction}>
          <input type="hidden" name="redirect_path" value={redirectPath} />
          <input type="hidden" name="id" value={school.id} />
          <input
            type="hidden"
            name="is_active"
            value={school.is_active ? "false" : "true"}
          />
          <ConfirmSubmitButton
            confirmMessage={`${
              school.is_active ? "Nonaktifkan" : "Aktifkan"
            } ${school.name}?`}
          >
            {school.is_active ? "Nonaktifkan" : "Aktifkan"}
          </ConfirmSubmitButton>
        </form>
      </div>

      <section className="grid gap-4 lg:grid-cols-3">
        <DashboardCard title="Profil Sekolah" className="lg:col-span-2">
          <dl className="grid gap-3 text-sm md:grid-cols-2">
            <ProfileItem label="Nama" value={school.name} />
            <ProfileItem label="NPSN" value={school.npsn} />
            <ProfileItem label="Jenjang" value={school.education_level} />
            <ProfileItem
              label="Status"
              value={school.is_active ? "Active" : "Inactive"}
            />
            <ProfileItem label="Telepon" value={school.phone} />
            <ProfileItem label="Email" value={school.email} />
            <ProfileItem
              label="Alamat"
              value={[
                school.address,
                school.city,
                school.province,
              ]
                .filter(Boolean)
                .join(", ")}
              wide
            />
          </dl>
        </DashboardCard>
        <DashboardCard
          title="Status Tenant"
          value={school.is_active ? "Active" : "Inactive"}
          description="Kontrol aktif/nonaktif berlaku untuk administrasi platform."
        >
          <StatusBadge active={Boolean(school.is_active)} />
        </DashboardCard>
      </section>

      {query.edit ? (
        <FormSection
          title="Edit Profil Sekolah"
          description="Perbarui data tenant tanpa mengubah data operasional sekolah."
        >
          <SchoolForm school={school} redirectPath={redirectPath} />
        </FormSection>
      ) : null}

      <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <DashboardCard
          title="Admin Sekolah"
          value={String(stats.adminCount)}
          description="Admin tenant terkait."
        />
        <DashboardCard
          title="Guru"
          value={String(stats.teacherCount)}
          description="Akun guru terhubung."
        />
        <DashboardCard
          title="Siswa"
          value={String(stats.studentCount)}
          description="Akun siswa terhubung."
        />
        <DashboardCard
          title="Kelas"
          value={String(stats.classCount)}
          description="Kelas aktif/terdata."
        />
        <DashboardCard
          title="Ujian Aktif"
          value={String(stats.activeExamCount)}
          description="Jadwal sedang aktif."
        />
        <DashboardCard
          title="Ujian Selesai"
          value={String(stats.finishedExamCount)}
          description="Jadwal selesai."
        />
      </section>

      <FormSection
        title="Tambah Admin Sekolah"
        description="Super Admin hanya menambahkan akun admin tenant. Guru dan siswa tetap dikelola Admin Sekolah."
      >
        <form action={saveAdminUserAction} className="grid gap-4 md:grid-cols-2">
          <input type="hidden" name="redirect_path" value={redirectPath} />
          <input type="hidden" name="school_id" value={school.id} />
          <input type="hidden" name="role_id" value={adminRole?.id ?? ""} />
          <input
            name="full_name"
            placeholder="Nama lengkap"
            className="rounded-md border px-3 py-2 text-sm"
            required
          />
          <input
            name="email"
            type="email"
            placeholder="Email"
            className="rounded-md border px-3 py-2 text-sm"
            required
          />
          <input
            name="username"
            placeholder="Username"
            className="rounded-md border px-3 py-2 text-sm"
            required
          />
          <input
            name="password"
            type="password"
            placeholder="Password awal"
            className="rounded-md border px-3 py-2 text-sm"
            required
          />
          <select
            name="status"
            defaultValue="active"
            className="rounded-md border px-3 py-2 text-sm"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <div className="flex justify-end md:col-span-2">
            <ConfirmSubmitButton
              confirmMessage={`Tambah admin sekolah untuk ${school.name}?`}
              confirmTitle="Konfirmasi Admin Sekolah"
              loadingText="Menyimpan..."
              variant="default"
              className="px-4 py-2 text-sm"
            >
              Tambah Admin
            </ConfirmSubmitButton>
          </div>
        </form>
      </FormSection>

      <DataTable
        columns={["Nama", "Email", "Username", "Auth User", "Status", "Aksi"]}
        isEmpty={admins.length === 0}
        empty={
          <EmptyState
            title="Belum ada admin sekolah"
            description="Tambahkan admin sekolah agar tenant dapat mengelola operasionalnya sendiri."
          />
        }
      >
        {admins.map((admin) => (
          <tr key={admin.id}>
            <td className="px-4 py-3 font-medium">
              {admin.profile?.full_name ?? admin.username}
            </td>
            <td className="px-4 py-3">{admin.email}</td>
            <td className="px-4 py-3">{admin.username}</td>
            <td className="px-4 py-3">
              <span className="font-mono text-xs">
                {admin.auth_user_id ?? "-"}
              </span>
            </td>
            <td className="px-4 py-3">
              <StatusBadge active={admin.status === "active"} />
            </td>
            <td className="px-4 py-3">
              <div className="flex flex-wrap gap-2">
                <form action={toggleAdminUserStatusAction}>
                  <input type="hidden" name="redirect_path" value={redirectPath} />
                  <input type="hidden" name="id" value={admin.id} />
                  <input
                    type="hidden"
                    name="status"
                    value={admin.status === "active" ? "inactive" : "active"}
                  />
                  <ConfirmSubmitButton
                    confirmMessage={`${
                      admin.status === "active" ? "Nonaktifkan" : "Aktifkan"
                    } ${admin.profile?.full_name ?? admin.username}?`}
                  >
                    {admin.status === "active" ? "Nonaktifkan" : "Aktifkan"}
                  </ConfirmSubmitButton>
                </form>
                <form action={resetAdminUserPasswordAction} className="flex gap-2">
                  <input type="hidden" name="redirect_path" value={redirectPath} />
                  <input type="hidden" name="id" value={admin.id} />
                  <input
                    name="password"
                    type="password"
                    placeholder="Password baru"
                    className="w-36 rounded-md border px-2 py-1 text-xs"
                    required
                  />
                  <ConfirmSubmitButton
                    confirmMessage={`Reset password untuk ${admin.profile?.full_name ?? admin.username}?`}
                    confirmationText="RESET"
                    variant="danger"
                  >
                    Reset
                  </ConfirmSubmitButton>
                </form>
              </div>
            </td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}

function ProfileItem({
  label,
  value,
  wide = false,
}: {
  label: string;
  value?: string | null;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "md:col-span-2" : undefined}>
      <dt className="text-xs font-medium uppercase text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1">{value || "-"}</dd>
    </div>
  );
}
