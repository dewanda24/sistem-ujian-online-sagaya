"use client";

import { useState } from "react";
import {
  Building2,
  Users,
  Calendar,
  ShieldCheck,
  Activity,
  UserCheck,
  UserX,
} from "lucide-react";
import { DataTable } from "@/components/master-data/data-table";
import { StatusBadge } from "@/components/master-data/status-badge";
import { EmptyState } from "@/components/dashboard/empty-state";
import { ConfirmSubmitButton } from "@/components/dashboard/confirm-submit-button";
import {
  TableActions,
  TableActionButton,
  TableActionSubmit,
  TableActionSeparator,
} from "@/components/dashboard/table-actions";
import { UserPasswordResetModal } from "@/features/admin/components/user-password-reset-modal";
import {
  deleteAdminUserAction,
  resetAdminUserPasswordAction,
  toggleAdminUserStatusAction,
} from "@/features/admin/actions";

type SchoolDetailTabsProps = {
  school: {
    id: string;
    name: string;
    npsn?: string | null;
    education_level?: string | null;
    address?: string | null;
    city?: string | null;
    province?: string | null;
    email?: string | null;
    phone?: string | null;
    is_active?: boolean | null;
  };
  stats: {
    adminCount: number;
    teacherCount: number;
    studentCount: number;
    classCount: number;
    subjectCount: number;
    examCount: number;
    activeExamCount: number;
    finishedExamCount: number;
  };
  readiness: {
    status: "ready" | "attention" | "not_ready";
    readyCount: number;
    totalCount: number;
    checks: Array<{ key: string; label: string; ready: boolean }>;
    missing: string[];
  };
  admins: Array<{
    id: string;
    username?: string | null;
    email?: string | null;
    auth_user_id?: string | null;
    status?: string | null;
    profile?: { full_name?: string | null; phone?: string | null } | null;
  }>;
  teachers: Array<{
    id: string;
    username?: string | null;
    email?: string | null;
    status?: string | null;
    profile?: { full_name?: string | null; phone?: string | null } | null;
  }>;
  students: Array<{
    id: string;
    username?: string | null;
    email?: string | null;
    status?: string | null;
    profile?: { full_name?: string | null; phone?: string | null } | null;
  }>;
  classes: Array<{ id: string; name: string; level?: string | null }>;
  subjects: Array<{ id: string; name: string; code?: string | null }>;
  schedules: Array<{
    id: string;
    title?: string | null;
    status?: string | null;
    start_at?: string | null;
    end_at?: string | null;
    duration_minutes?: number | null;
  }>;
  auditLogs: Array<{
    id?: string | number;
    action?: string | null;
    entity_type?: string | null;
    entity_id?: string | null;
    user_id?: string | null;
    created_at?: string | null;
  }>;
  redirectPath: string;
};

export function SchoolDetailTabs({
  school,
  stats,
  readiness,
  admins,
  teachers,
  students,
  classes,
  subjects,
  schedules,
  auditLogs,
  redirectPath,
}: SchoolDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<
    "ringkasan" | "admins" | "akademik" | "ujian" | "aktivitas"
  >("ringkasan");
  const [resetTargetUser, setResetTargetUser] = useState<{
    id: string;
    username: string;
    email: string;
    full_name?: string | null;
  } | null>(null);

  const tabs = [
    {
      id: "ringkasan" as const,
      label: "Ringkasan & Kesiapan",
      icon: Building2,
      count: null,
    },
    {
      id: "admins" as const,
      label: "Admin Sekolah",
      icon: ShieldCheck,
      count: admins.length,
    },
    {
      id: "akademik" as const,
      label: "Guru & Siswa",
      icon: Users,
      count: teachers.length + students.length,
    },
    {
      id: "ujian" as const,
      label: "Jadwal Ujian",
      icon: Calendar,
      count: schedules.length,
    },
    {
      id: "aktivitas" as const,
      label: "Jejak Audit",
      icon: Activity,
      count: auditLogs.length,
    },
  ];

  return (
    <div className="space-y-6">
      {resetTargetUser && (
        <UserPasswordResetModal
          user={resetTargetUser}
          redirectPath={redirectPath}
          onClose={() => setResetTargetUser(null)}
        />
      )}

      {/* Tabs Header */}
      <div className="flex border-b border-border overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
              }`}
            >
              <Icon className="size-4" />
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab: Ringkasan & Kesiapan */}
      {activeTab === "ringkasan" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
              <span className="text-xs font-medium text-muted-foreground">Kesiapan CBT</span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-bold">
                  {readiness.readyCount}/{readiness.totalCount}
                </span>
                <span className="text-xs text-muted-foreground">Indikator</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {readiness.status === "ready"
                  ? "Semua syarat utama terpenuhi."
                  : `Kurang: ${readiness.missing.slice(0, 2).join(", ")}`}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
              <span className="text-xs font-medium text-muted-foreground">Akun Terdaftar</span>
              <div className="mt-1 text-2xl font-bold">
                {stats.adminCount + stats.teacherCount + stats.studentCount}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {stats.adminCount} Admin, {stats.teacherCount} Guru, {stats.studentCount} Siswa
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
              <span className="text-xs font-medium text-muted-foreground">Kelas & Mata Pelajaran</span>
              <div className="mt-1 text-2xl font-bold">
                {stats.classCount} <span className="text-sm font-normal text-muted-foreground">Kelas</span> / {stats.subjectCount} <span className="text-sm font-normal text-muted-foreground">Mapel</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Struktur akademik terdata.</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
              <span className="text-xs font-medium text-muted-foreground">Jadwal Ujian</span>
              <div className="mt-1 text-2xl font-bold">{stats.examCount}</div>
              <p className="mt-1 text-xs text-muted-foreground">
                {stats.activeExamCount} Berjalan, {stats.finishedExamCount} Selesai
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
            <h3 className="font-semibold text-foreground">Daftar Pemeriksaan Kesiapan CBT</h3>
            <p className="text-xs text-muted-foreground mt-0.5 mb-4">
              Indikator kesiapan operasional sekolah sebelum pelaksanaan ujian.
            </p>
            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {readiness.checks.map((check) => (
                <div
                  key={check.key}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border/80 bg-muted/20 px-3.5 py-2.5 text-xs"
                >
                  <span className="font-medium text-foreground">{check.label}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      check.ready
                        ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                        : "bg-red-50 text-red-700 ring-1 ring-red-200"
                    }`}
                  >
                    {check.ready ? "Siap" : "Belum Ada"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Admin Sekolah */}
      {activeTab === "admins" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-foreground">Admin / Operator Utama Sekolah</h3>
              <p className="text-xs text-muted-foreground">
                Akun yang bertanggung jawab mengelola data guru, siswa, dan ujian di {school.name}.
              </p>
            </div>
          </div>

          <DataTable
            columns={["Nama", "Email", "Username", "Akun Auth Login", "Status", "Aksi"]}
            isEmpty={admins.length === 0}
            stickyActionColumn={false}
            empty={
              <EmptyState
                title="Belum ada admin sekolah"
                description="Tambahkan akun admin sekolah agar sekolah dapat mengelola data secara mandiri."
              />
            }
          >
            {admins.map((admin) => (
              <tr key={admin.id} className="hover:bg-muted/40 transition-colors">
                <td className="px-3 py-3 font-semibold text-foreground leading-snug">
                  {admin.profile?.full_name ?? admin.username}
                </td>
                <td className="px-3 py-3 text-xs text-muted-foreground">{admin.email}</td>
                <td className="px-3 py-3 font-mono text-xs text-muted-foreground">@{admin.username}</td>
                <td className="px-3 py-3">
                  {admin.auth_user_id ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                      <UserCheck className="size-3.5" />
                      Terhubung
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 text-xs font-medium">
                      <UserX className="size-3.5" />
                      Belum Terhubung
                    </span>
                  )}
                </td>
                <td className="px-3 py-3">
                  <StatusBadge active={admin.status === "active"} />
                </td>
                <td className="px-3 py-3">
                  <TableActions>
                    <TableActionButton
                      icon="key-round"
                      onClick={() =>
                        setResetTargetUser({
                          id: admin.id,
                          username: admin.username ?? "",
                          email: admin.email ?? "",
                          full_name: admin.profile?.full_name,
                        })
                      }
                    >
                      Reset Sandi
                    </TableActionButton>
                    <TableActionSeparator />
                    <form action={toggleAdminUserStatusAction}>
                      <input type="hidden" name="redirect_path" value={redirectPath} />
                      <input type="hidden" name="id" value={admin.id} />
                      <input
                        type="hidden"
                        name="status"
                        value={admin.status === "active" ? "inactive" : "active"}
                      />
                      <TableActionSubmit
                        icon="power"
                        confirmMessage={`${
                          admin.status === "active" ? "Nonaktifkan" : "Aktifkan"
                        } ${admin.profile?.full_name ?? admin.username}?`}
                      >
                        {admin.status === "active" ? "Nonaktifkan" : "Aktifkan"}
                      </TableActionSubmit>
                    </form>
                    <TableActionSeparator />
                    <form action={deleteAdminUserAction}>
                      <input type="hidden" name="redirect_path" value={redirectPath} />
                      <input type="hidden" name="id" value={admin.id} />
                      <TableActionSubmit
                        icon="trash"
                        tone="danger"
                        confirmTitle="Hapus Admin Permanen"
                        confirmMessage={`Hapus akun admin "${admin.profile?.full_name ?? admin.username}" secara permanen? Data akun dan login akan dihapus.`}
                        confirmationText="HAPUS"
                      >
                        Hapus Admin
                      </TableActionSubmit>
                    </form>
                  </TableActions>
                </td>
              </tr>
            ))}
          </DataTable>
        </div>
      )}

      {/* Tab: Guru & Siswa */}
      {activeTab === "akademik" && (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-3">
            <div className="rounded-lg border bg-muted/30 px-3.5 py-2 text-xs">
              <span className="text-muted-foreground">Kelas Terdata: </span>
              <span className="font-semibold text-foreground">{classes.length} Kelas</span>
            </div>
            <div className="rounded-lg border bg-muted/30 px-3.5 py-2 text-xs">
              <span className="text-muted-foreground">Mata Pelajaran: </span>
              <span className="font-semibold text-foreground">{subjects.length} Mapel</span>
            </div>
          </div>

          {/* Guru */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Daftar Guru ({teachers.length})</h3>
            </div>
            <DataTable
              columns={["Nama Lengkap", "Email", "Username", "No. Telepon", "Status"]}
              isEmpty={teachers.length === 0}
              stickyActionColumn={false}
              searchPlaceholder="Cari guru..."
              empty={<EmptyState title="Belum ada guru" description="Data guru dikelola oleh Admin Sekolah." />}
            >
              {teachers.map((teacher) => (
                <tr key={teacher.id} className="hover:bg-muted/40 transition-colors">
                  <td className="px-3 py-3 font-medium">{teacher.profile?.full_name ?? teacher.username}</td>
                  <td className="px-3 py-3 text-xs text-muted-foreground">{teacher.email}</td>
                  <td className="px-3 py-3 font-mono text-xs text-muted-foreground">@{teacher.username}</td>
                  <td className="px-3 py-3 text-xs">{teacher.profile?.phone || "-"}</td>
                  <td className="px-3 py-3"><StatusBadge active={teacher.status === "active"} /></td>
                </tr>
              ))}
            </DataTable>
          </div>

          {/* Siswa */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Daftar Siswa ({students.length})</h3>
            </div>
            <DataTable
              columns={["Nama Lengkap", "Email", "Username", "No. Telepon", "Status"]}
              isEmpty={students.length === 0}
              stickyActionColumn={false}
              searchPlaceholder="Cari siswa..."
              empty={<EmptyState title="Belum ada siswa" description="Data siswa dikelola oleh Admin Sekolah." />}
            >
              {students.map((student) => (
                <tr key={student.id} className="hover:bg-muted/40 transition-colors">
                  <td className="px-3 py-3 font-medium">{student.profile?.full_name ?? student.username}</td>
                  <td className="px-3 py-3 text-xs text-muted-foreground">{student.email}</td>
                  <td className="px-3 py-3 font-mono text-xs text-muted-foreground">@{student.username}</td>
                  <td className="px-3 py-3 text-xs">{student.profile?.phone || "-"}</td>
                  <td className="px-3 py-3"><StatusBadge active={student.status === "active"} /></td>
                </tr>
              ))}
            </DataTable>
          </div>
        </div>
      )}

      {/* Tab: Jadwal Ujian */}
      {activeTab === "ujian" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-foreground">Jadwal Ujian CBT ({schedules.length})</h3>
              <p className="text-xs text-muted-foreground">Seluruh jadwal pelaksanaan ujian di sekolah ini.</p>
            </div>
          </div>

          <DataTable
            columns={["Judul Ujian", "Status", "Waktu Mulai", "Waktu Selesai", "Durasi"]}
            isEmpty={schedules.length === 0}
            stickyActionColumn={false}
            empty={<EmptyState title="Belum ada jadwal ujian" description="Jadwal ujian dibuat dan dikelola oleh Admin Sekolah." />}
          >
            {schedules.map((schedule) => (
              <tr key={schedule.id} className="hover:bg-muted/40 transition-colors">
                <td className="px-3 py-3 font-medium">{schedule.title}</td>
                <td className="px-3 py-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      schedule.status === "active"
                        ? "bg-emerald-100 text-emerald-800"
                        : schedule.status === "finished"
                          ? "bg-slate-100 text-slate-700"
                          : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {schedule.status === "active"
                      ? "Sedang Aktif"
                      : schedule.status === "finished"
                        ? "Selesai"
                        : schedule.status === "scheduled"
                          ? "Terjadwal"
                          : schedule.status}
                  </span>
                </td>
                <td className="px-3 py-3 text-xs">
                  {schedule.start_at ? new Date(schedule.start_at).toLocaleString("id-ID") : "-"}
                </td>
                <td className="px-3 py-3 text-xs">
                  {schedule.end_at ? new Date(schedule.end_at).toLocaleString("id-ID") : "-"}
                </td>
                <td className="px-3 py-3 text-xs">{schedule.duration_minutes ? `${schedule.duration_minutes} Menit` : "-"}</td>
              </tr>
            ))}
          </DataTable>
        </div>
      )}

      {/* Tab: Jejak Aktivitas */}
      {activeTab === "aktivitas" && (
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-foreground">Jejak Audit Sekolah</h3>
            <p className="text-xs text-muted-foreground">Aktivitas sensitif terbaru yang dilakukan pada data sekolah ini.</p>
          </div>

          <DataTable
            columns={["Waktu", "Aksi", "Modul / Entitas", "User ID"]}
            isEmpty={auditLogs.length === 0}
            stickyActionColumn={false}
            empty={<EmptyState title="Belum ada catatan aktivitas" description="Jejak audit sekolah akan terekam saat ada perubahan data." />}
          >
            {auditLogs.map((log, index) => (
              <tr key={log.id ?? index} className="hover:bg-muted/40 transition-colors">
                <td className="px-3 py-3 text-xs">
                  {log.created_at ? new Date(log.created_at).toLocaleString("id-ID") : "-"}
                </td>
                <td className="px-3 py-3 font-medium font-mono text-xs">{log.action ?? "-"}</td>
                <td className="px-3 py-3 text-xs">{log.entity_type ?? "-"}</td>
                <td className="px-3 py-3 font-mono text-xs text-muted-foreground">{log.user_id ?? "-"}</td>
              </tr>
            ))}
          </DataTable>
        </div>
      )}
    </div>
  );
}
