import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { ActionsMenu } from "@/components/dashboard/actions-menu";
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
import { createBackupAction } from "@/features/super-admin/advanced-actions";
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

  const { school, stats, admins, readiness, health } = detail;
  const adminRole = roles[0];
  const redirectPath = `/dashboard/super-admin/schools/${school.id}`;

  return (
    <div className="space-y-6">
      <ActionToast status={query.status} message={query.message} />
      <DashboardPageHeader
        title={school.name}
        description="Detail sekolah, statistik lintas modul, dan admin sekolah terkait."
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
        <ActionsMenu label="Aksi Cepat">
          <MenuLink href={`/dashboard/super-admin/schools/${school.id}`}>
            Lihat Detail
          </MenuLink>
          <MenuLink href={`/dashboard/super-admin/users?school_id=${school.id}`}>
            Lihat Pengguna
          </MenuLink>
          <MenuLink href="#admin-sekolah">Reset Password Admin</MenuLink>
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
              className="w-full justify-center"
            >
              {school.is_active ? "Nonaktifkan Sekolah" : "Aktifkan Sekolah"}
            </ConfirmSubmitButton>
          </form>
          <form action={createBackupAction}>
            <input type="hidden" name="scope" value="school" />
            <input type="hidden" name="school_id" value={school.id} />
            <ConfirmSubmitButton
              confirmMessage={`Buat backup terbatas untuk ${school.name}?`}
              confirmTitle="Konfirmasi Backup Sekolah"
              className="w-full justify-center"
            >
              Backup Sekolah
            </ConfirmSubmitButton>
          </form>
        </ActionsMenu>
      </div>

      <section className="grid gap-4 lg:grid-cols-4">
        <DashboardCard title="Profil Sekolah" className="lg:col-span-2">
          <dl className="grid gap-3 text-sm md:grid-cols-2">
            <ProfileItem label="Nama" value={school.name} />
            <ProfileItem label="NPSN" value={school.npsn} />
            <ProfileItem label="Jenjang" value={school.education_level} />
            <ProfileItem
              label="Status"
              value={school.is_active ? "Aktif" : "Tidak Aktif"}
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
          title="Status Sekolah"
          value={school.is_active ? "Aktif" : "Tidak Aktif"}
          description="Kontrol aktif/nonaktif berlaku untuk administrasi platform."
        >
          <StatusBadge active={Boolean(school.is_active)} />
        </DashboardCard>
        <DashboardCard
          title="Kesiapan CBT"
          value={`${readiness.readyCount}/${readiness.totalCount}`}
          description={readiness.missing.slice(0, 2).join(", ") || "Semua syarat utama siap."}
        >
          <ReadinessBadge status={readiness.status} />
        </DashboardCard>
        <DashboardCard
          title="Kondisi Sekolah"
          description={health.issues.join(", ") || "Tidak ada masalah operasional utama."}
        >
          <SchoolHealthBadge status={health.status} />
        </DashboardCard>
      </section>

      <DashboardCard
        title="Kesiapan Sekolah"
        description="Indikator sederhana untuk kesiapan CBT sekolah."
      >
        <div className="grid gap-2 text-sm md:grid-cols-2 xl:grid-cols-3">
          {readiness.checks.map((check) => (
            <div
              key={check.key}
              className="flex items-center justify-between gap-3 rounded-md border px-3 py-2"
            >
              <span>{check.label}</span>
              <span
                className={
                  check.ready
                    ? "rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700"
                    : "rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700"
                }
              >
                {check.ready ? "Ada" : "Belum"}
              </span>
            </div>
          ))}
        </div>
      </DashboardCard>

      {query.edit ? (
        <FormSection
          title="Edit Profil Sekolah"
          description="Perbarui data sekolah tanpa mengubah data operasional sekolah."
        >
          <SchoolForm school={school} redirectPath={redirectPath} />
        </FormSection>
      ) : null}

      <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <DashboardCard
          title="Admin Sekolah"
          value={String(stats.adminCount)}
          description="Admin sekolah terkait."
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
        description="Super Admin hanya menambahkan akun admin sekolah. Guru dan siswa tetap dikelola Admin Sekolah."
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
            <option value="active">Aktif</option>
            <option value="inactive">Tidak Aktif</option>
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

      <div id="admin-sekolah" />
      <DataTable
        columns={["Nama", "Email", "Username", "Akun Login", "Status", "Aksi"]}
        isEmpty={admins.length === 0}
        empty={
          <EmptyState
            title="Belum ada admin sekolah"
            description="Tambahkan admin sekolah agar sekolah dapat mengelola operasionalnya sendiri."
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

function MenuLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="block rounded-md px-3 py-2 text-sm hover:bg-muted"
    >
      {children}
    </Link>
  );
}

function ReadinessBadge({ status }: { status: "ready" | "attention" | "not_ready" }) {
  const label =
    status === "ready"
      ? "Siap"
      : status === "attention"
        ? "Perlu Perhatian"
        : "Belum Siap";
  const className =
    status === "ready"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : status === "attention"
        ? "bg-amber-50 text-amber-700 ring-amber-200"
        : "bg-red-50 text-red-700 ring-red-200";

  return (
    <span className={`inline-flex rounded-md px-2 py-1 text-xs font-medium ring-1 ${className}`}>
      {label}
    </span>
  );
}

function SchoolHealthBadge({ status }: { status: "normal" | "attention" | "problem" }) {
  const label =
    status === "normal"
      ? "Normal"
      : status === "attention"
        ? "Perlu Perhatian"
        : "Bermasalah";
  const className =
    status === "normal"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : status === "attention"
        ? "bg-amber-50 text-amber-700 ring-amber-200"
        : "bg-red-50 text-red-700 ring-red-200";

  return (
    <span className={`inline-flex rounded-md px-2 py-1 text-xs font-medium ring-1 ${className}`}>
      {label}
    </span>
  );
}
