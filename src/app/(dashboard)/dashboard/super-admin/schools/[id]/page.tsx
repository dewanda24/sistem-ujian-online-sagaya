import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { ActionsMenu } from "@/components/dashboard/actions-menu";
import { ConfirmSubmitButton } from "@/components/dashboard/confirm-submit-button";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { ActionToast } from "@/components/master-data/action-toast";
import { FormSection } from "@/components/master-data/form-section";
import { StatusBadge } from "@/components/master-data/status-badge";
import { saveAdminUserAction } from "@/features/admin/actions";
import { getRoleOptionsByNames } from "@/features/admin/queries";
import { createBackupAction } from "@/features/super-admin/advanced-actions";
import { SchoolForm } from "@/features/super-admin/components/school-form";
import { SchoolDetailTabs } from "@/features/super-admin/components/school-detail-tabs";
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

  const {
    school,
    stats,
    admins,
    teachers,
    students,
    classes,
    subjects,
    schedules,
    auditLogs,
    readiness,
    health,
  } = detail;
  const adminRole = roles[0];
  const redirectPath = `/dashboard/super-admin/schools/${school.id}`;

  return (
    <div className="space-y-6">
      <ActionToast status={query.status} message={query.message} />
      <DashboardPageHeader
        title={school.name}
        description="Detail profil, indikator kesiapan CBT, data pengguna, jadwal ujian, dan jejak aktivitas sekolah."
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Link
            href="/dashboard/super-admin/schools"
            className="rounded-md border px-3 py-2 text-xs font-medium hover:bg-muted"
          >
            ← Kembali ke Daftar Sekolah
          </Link>
          <Link
            href={`/dashboard/super-admin/schools/${school.id}?edit=1`}
            className="rounded-md border px-3 py-2 text-xs font-medium hover:bg-muted"
          >
            Edit Profil Sekolah
          </Link>
        </div>

        <div className="flex flex-wrap gap-2">
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
              className="text-xs"
            >
              {school.is_active ? "Nonaktifkan Sekolah" : "Aktifkan Sekolah"}
            </ConfirmSubmitButton>
          </form>

          <ActionsMenu label="Aksi Lanjutan">
            <MenuLink href={`/dashboard/super-admin/users?school_id=${school.id}`}>
              Lihat Pengguna Global
            </MenuLink>
            <form action={createBackupAction}>
              <input type="hidden" name="scope" value="school" />
              <input type="hidden" name="school_id" value={school.id} />
              <ConfirmSubmitButton
                confirmMessage={`Buat backup snapshot terbatas untuk ${school.name}?`}
                confirmTitle="Konfirmasi Backup Sekolah"
                className="w-full justify-center text-xs"
              >
                Backup Sekolah Ini
              </ConfirmSubmitButton>
            </form>
          </ActionsMenu>
        </div>
      </div>

      {query.edit ? (
        <FormSection
          title="Edit Profil Sekolah"
          description="Perbarui data sekolah tanpa mengubah data operasional siswa dan ujian."
        >
          <SchoolForm school={school} redirectPath={redirectPath} />
        </FormSection>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-4">
        <DashboardCard title="Profil Utama Sekolah" className="lg:col-span-2">
          <dl className="grid gap-3 text-sm md:grid-cols-2">
            <ProfileItem label="Nama Sekolah" value={school.name} />
            <ProfileItem label="NPSN" value={school.npsn} />
            <ProfileItem label="Jenjang Pendidikan" value={school.education_level} />
            <ProfileItem
              label="Status Layanan"
              value={school.is_active ? "Aktif (Dapat Ujian)" : "Nonaktif / Ditangguhkan"}
            />
            <ProfileItem label="Telepon" value={school.phone} />
            <ProfileItem label="Email" value={school.email} />
            <ProfileItem
              label="Alamat Lengkap"
              value={[school.address, school.city, school.province]
                .filter(Boolean)
                .join(", ")}
              wide
            />
          </dl>
        </DashboardCard>

        <DashboardCard
          title="Status Layanan"
          value={school.is_active ? "Aktif" : "Nonaktif"}
          description="Status izin akses portal untuk sekolah ini."
        >
          <StatusBadge active={Boolean(school.is_active)} />
        </DashboardCard>

        <DashboardCard
          title="Kondisi Operasional"
          description={health.issues.join(", ") || "Tidak ada kendala operasional utama."}
        >
          <SchoolHealthBadge status={health.status} />
        </DashboardCard>
      </section>

      {/* Extended Tabbed Views */}
      <SchoolDetailTabs
        school={school}
        stats={stats}
        readiness={readiness}
        admins={admins}
        teachers={teachers}
        students={students}
        classes={classes}
        subjects={subjects}
        schedules={schedules}
        auditLogs={auditLogs}
        redirectPath={redirectPath}
      />

      {/* Tambah Admin Sekolah Form Section */}
      <FormSection
        title="Tambah Akun Admin Sekolah"
        description="Super Admin mendaftarkan akun operator / admin utama untuk sekolah ini."
      >
        <form action={saveAdminUserAction} className="grid gap-4 md:grid-cols-2">
          <input type="hidden" name="redirect_path" value={redirectPath} />
          <input type="hidden" name="school_id" value={school.id} />
          <input type="hidden" name="role_id" value={adminRole?.id ?? ""} />
          <input
            name="full_name"
            placeholder="Nama Lengkap Operator / Admin"
            className="rounded-md border px-3 py-2 text-sm"
            required
          />
          <input
            name="email"
            type="email"
            placeholder="Email Resmi Admin"
            className="rounded-md border px-3 py-2 text-sm"
            required
          />
          <input
            name="username"
            placeholder="Username Login"
            className="rounded-md border px-3 py-2 text-sm"
            required
          />
          <input
            name="password"
            type="password"
            placeholder="Password Awal"
            className="rounded-md border px-3 py-2 text-sm"
            required
          />
          <select
            name="status"
            defaultValue="active"
            className="rounded-md border px-3 py-2 text-sm"
          >
            <option value="active">Status: Aktif</option>
            <option value="inactive">Status: Tidak Aktif</option>
          </select>
          <div className="flex justify-end md:col-span-2">
            <ConfirmSubmitButton
              confirmMessage={`Tambah admin sekolah untuk ${school.name}?`}
              confirmTitle="Konfirmasi Admin Sekolah"
              loadingText="Menyimpan..."
              variant="default"
              className="px-4 py-2 text-sm"
            >
              Tambah Admin Sekolah
            </ConfirmSubmitButton>
          </div>
        </form>
      </FormSection>
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
      <dd className="mt-1 font-medium">{value || "-"}</dd>
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
    <span className={`inline-flex rounded-md px-2.5 py-1 text-xs font-semibold ring-1 ${className}`}>
      {label}
    </span>
  );
}
