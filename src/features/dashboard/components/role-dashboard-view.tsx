import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Circle,
  ClipboardCheck,
  Download,
  GraduationCap,
  PenSquare,
  School,
  Upload,
  Users,
} from "lucide-react";

import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { UI_LABELS } from "@/constants/ui-labels";
import {
  getAdminOperationalDashboardData,
  getRoleDashboardStats,
  type AdminOperationalDashboardData,
} from "@/features/dashboard/queries";
import type { CurrentUser, RoleName } from "@/types/auth";

type RoleDashboardContent = {
  title: string;
  description: string;
  stats: Array<{
    title: string;
    value: string;
    description: string;
    href?: string;
  }>;
  workbenchTitle: string;
  workbenchDescription: string;
};

const contentByRole: Record<RoleName, RoleDashboardContent> = {
  super_admin: {
    title: "Beranda Super Admin",
    description:
      "Kelola pengguna, hak akses, izin akses, dan catatan aktivitas sistem ujian online.",
    stats: [
      {
        title: "Cakupan Akses",
        value: "Penuh",
        description: "Super Admin dapat mengelola seluruh pengaturan sistem.",
      },
      {
        title: "Kontrol Sistem",
        value: "Aktif",
        description: "Hak akses dan catatan aktivitas siap dipantau.",
      },
      {
        title: "Kesiapan Sistem",
        value: "Sprint 2",
        description: "Beranda siap menerima modul akademik berikutnya.",
      },
    ],
    workbenchTitle: "Belum ada ringkasan pengelolaan sistem",
    workbenchDescription:
      "Kartu ini disiapkan untuk ringkasan pengguna, hak akses, izin akses, dan catatan aktivitas.",
  },
  admin: {
    title: "Beranda Admin Sekolah",
    description:
      "Kelola pengguna, data sekolah, dan kesiapan pelaksanaan ujian.",
    stats: [
      {
        title: "Pengguna",
        value: "Siap",
        description: "Menu pengguna tampil sesuai hak akses admin sekolah.",
      },
      {
        title: "Hak Akses",
        value: "Terbatas",
        description: "Akses admin dibatasi sesuai tugas sekolah.",
      },
      {
        title: "Operasional",
        value: "Stable",
        description: "Tampilan beranda siap untuk pekerjaan administrasi.",
      },
    ],
    workbenchTitle: "Belum ada pekerjaan administrasi aktif",
    workbenchDescription:
      "Nanti area ini dapat menampilkan onboarding user, validasi akun, dan jadwal ujian.",
  },
  principal: {
    title: "Beranda Kepala Sekolah",
    description:
      "Pantau ringkasan sekolah, performa ujian, dan laporan akademik lintas kelas.",
    stats: [
      {
        title: "Laporan",
        value: "Siap",
        description: "Area laporan kepala sekolah sudah dipisah dari admin.",
      },
      {
        title: "Cakupan Data",
        value: "Sekolah",
        description: "Dirancang untuk ringkasan data dan pengawasan.",
      },
      {
        title: "Hak Akses",
        value: "Kepala Sekolah",
        description: "Halaman hanya dapat dibuka oleh kepala sekolah.",
      },
    ],
    workbenchTitle: "Belum ada laporan yang tersedia",
    workbenchDescription:
      "Sprint berikutnya dapat mengisi ringkasan nilai, tingkat partisipasi, dan status ujian.",
  },
  teacher: {
    title: "Beranda Guru",
    description:
      "Ruang kerja guru untuk bank soal, penyusunan ujian, dan penilaian hasil siswa.",
    stats: [
      {
        title: "Bank Soal",
        value: "Siap",
        description: "Kelola kategori dan soal sesuai mapel yang ditugaskan.",
        href: "/dashboard/question-bank/questions",
      },
      {
        title: "Ujian",
        value: "Siap",
        description: "Area ujian guru siap digunakan.",
        href: "/dashboard/exams",
      },
      {
        title: "Koreksi Essay",
        value: "Siap",
        description: "Fondasi penilaian sudah memiliki route dan menu.",
      },
    ],
    workbenchTitle: "Belum ada ujian yang perlu dinilai",
    workbenchDescription:
      "Setelah ujian aktif, area ini dapat menampilkan soal belum diterbitkan dan pekerjaan koreksi.",
  },
  student: {
    title: "Beranda Siswa",
    description:
      "Halaman peserta untuk melihat ujian aktif, riwayat ujian, dan jadwal pengerjaan.",
    stats: [
      {
        title: "Ujian Berlangsung",
        value: "0",
        description: "Belum ada ujian aktif yang ditautkan ke peserta.",
      },
      {
        title: "Riwayat",
        value: "0",
        description: "Riwayat ujian akan tampil setelah modul exam berjalan.",
      },
      {
        title: "Akses",
        value: "Aman",
        description: "Akses siswa dilindungi oleh sistem login.",
      },
    ],
    workbenchTitle: "Tidak ada ujian aktif",
    workbenchDescription:
      "Saat guru atau proktor membuka ujian, daftar ujian peserta akan muncul di sini.",
  },
  proctor: {
    title: "Beranda Pengawas",
    description:
      "Pantau pelaksanaan ujian, kehadiran peserta, dan status pengerjaan.",
    stats: [
      {
        title: "Pengawasan",
        value: "Siap",
        description: "Halaman pengawasan pengawas sudah tersedia.",
      },
      {
        title: "Sesi Ujian",
        value: "0",
        description: "Sesi ujian akan muncul setelah modul exam aktif.",
      },
      {
        title: "Hak Akses",
        value: "Pengawas",
        description: "Halaman hanya dapat dibuka oleh pengawas.",
      },
    ],
    workbenchTitle: "Belum ada sesi ujian berjalan",
    workbenchDescription:
      "Area ini disiapkan untuk daftar peserta, status koneksi, dan progress pengerjaan ujian.",
  },
};

interface RoleDashboardViewProps {
  role: RoleName;
  user: CurrentUser;
}

export async function RoleDashboardView({ role, user }: RoleDashboardViewProps) {
  const content = contentByRole[role];
  const displayName = user.user_profiles?.full_name ?? user.username;
  const stats = await getRoleDashboardStats(role, user);

  if (role === "admin") {
    const operationalData = await getAdminOperationalDashboardData(user);

    return (
      <AdminDashboardOverview
        displayName={displayName}
        schoolName={user.school_name}
        stats={stats}
        operationalData={operationalData}
      />
    );
  }

  if (role === "teacher") {
    return <TeacherDashboardOverview displayName={displayName} stats={stats} />;
  }

  return (
    <div>
      <DashboardPageHeader
        title={content.title}
        description={`${content.description} Selamat datang, ${displayName}.`}
      />

      <div className="grid gap-4 md:grid-cols-3">
        {(stats.length ? stats : content.stats).map((stat) => {
          const card = (
            <DashboardCard
              title={stat.title}
              value={stat.value}
              description={stat.description}
              className={
                stat.href
                  ? "h-full transition hover:border-primary/40 hover:shadow-md"
                  : undefined
              }
            />
          );

          if (!stat.href) {
            return <div key={stat.title}>{card}</div>;
          }

          return (
            <Link key={stat.title} href={stat.href}>
              {card}
            </Link>
          );
        })}
      </div>

      <div className="mt-6">
        {role === "proctor" ? <ProctorOperationalWorkbench /> : null}
        {role !== "proctor" ? (
            <EmptyState
              title={content.workbenchTitle}
              description={content.workbenchDescription}
            />
          ) : null}
      </div>
    </div>
  );
}

interface TeacherDashboardOverviewProps {
  displayName: string;
  stats: Array<{
    title: string;
    value: string;
    description: string;
    href?: string;
  }>;
}

function statNumber(
  stats: TeacherDashboardOverviewProps["stats"],
  title: string,
) {
  const value = stats.find((stat) => stat.title === title)?.value ?? "0";

  return Number(value.replace(/[^0-9.-]/g, "")) || 0;
}

function TeacherDashboardOverview({
  displayName,
  stats,
}: TeacherDashboardOverviewProps) {
  const kelasValue = stats.find((stat) => stat.title === "Kelas Saya")?.value ?? "0/0";
  const kelasCount = Number(kelasValue.split("/")[1] ?? kelasValue) || 0;
  const bankSoalCount =
    statNumber(stats, "Soal Belum Diterbitkan") +
    statNumber(stats, "Soal Sudah Diterbitkan");
  const ujianAktif = statNumber(stats, "Ujian Aktif");
  const perluDinilai = statNumber(stats, "Perlu Dinilai");
  const belumMengikuti = statNumber(stats, "Belum Mengikuti");
  const ujianHariIni = statNumber(stats, "Ujian Hari Ini");
  const mainStats = [
    {
      title: "Kelas Saya",
      value: String(kelasCount),
      description: "Kelas yang sedang diajar.",
      href: "/dashboard/teacher/assignments",
      icon: GraduationCap,
    },
    {
      title: "Bank Soal",
      value: String(bankSoalCount),
      description: "Soal belum diterbitkan dan sudah diterbitkan.",
      href: "/dashboard/question-bank/questions",
      icon: BookOpen,
    },
    {
      title: "Ujian Aktif",
      value: String(ujianAktif),
      description: "Ujian yang sedang berjalan.",
      href: "/dashboard/exams/schedules?status=active",
      icon: CalendarDays,
    },
    {
      title: "Perlu Dinilai",
      value: String(perluDinilai),
      description: "Jawaban essay menunggu koreksi.",
      href: "/dashboard/teacher/grading?grading_status=needs_manual_grading",
      icon: ClipboardCheck,
    },
  ];
  const tasks = [
    {
      title: `${perluDinilai} Jawaban Essay Belum Dinilai`,
      description: "Selesaikan koreksi agar nilai siswa bisa final.",
      href: "/dashboard/teacher/grading?grading_status=needs_manual_grading",
      action: "Nilai Sekarang",
      urgent: perluDinilai > 0,
    },
    {
      title: `${belumMengikuti} Siswa Belum Mengikuti Ujian`,
      description: "Cek peserta yang belum mulai pada ujian aktif atau terjadwal.",
      href: "/dashboard/reports/students?status=assigned",
      action: "Lihat Detail",
      urgent: belumMengikuti > 0,
    },
    {
      title: `${ujianHariIni} Ujian Akan Dimulai Hari Ini`,
      description: "Pastikan jadwal, kelas, dan token ujian sudah siap.",
      href: "/dashboard/exams/schedules",
      action: "Lihat Jadwal",
      urgent: ujianHariIni > 0,
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6 text-[#0F172A]">
      <section className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm sm:p-6 lg:p-8">
        <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#2563EB]">
              {UI_LABELS.navigation.home} Guru
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-normal sm:text-3xl">
              Halo, {displayName}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#64748B] sm:text-base">
              Mulai dari kelas yang diajar, buat soal, buat ujian, koreksi essay,
              lalu lihat nilai siswa.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-3 lg:min-w-[520px]">
            <Link
              href="/dashboard/question-bank/questions/create"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1D4ED8]"
            >
              <PenSquare className="size-4" />
              Buat Soal
            </Link>
            <Link
              href="/dashboard/exams/packages/create"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#0F172A] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1E293B]"
            >
              <CalendarDays className="size-4" />
              Buat Ujian
            </Link>
            <Link
              href="/dashboard/teacher/grading?grading_status=needs_manual_grading"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-4 text-sm font-semibold text-[#0F172A] shadow-sm transition hover:bg-[#F8FAFC]"
            >
              <ClipboardCheck className="size-4" />
              Koreksi Essay
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {mainStats.map((stat) => {
          const Icon = stat.icon;

          return (
            <Link key={stat.title} href={stat.href}>
              <div className="flex h-full items-start gap-4 rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm transition hover:border-[#2563EB]/40 hover:shadow-md">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#2563EB]">
                  <Icon className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#64748B]">{stat.title}</p>
                  <p className="mt-1 text-3xl font-semibold tracking-normal">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-sm leading-5 text-[#64748B]">
                    {stat.description}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </section>

      <section className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Tugas yang Perlu Dicek</h2>
            <p className="text-sm text-[#64748B]">
              Prioritas kerja guru hari ini.
            </p>
          </div>
          <Link
            href="/dashboard/teacher/assignments"
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#E2E8F0] px-3 text-sm font-medium hover:bg-[#F8FAFC]"
          >
            Kelas Saya
            <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="grid gap-3 lg:grid-cols-3">
          {tasks.map((task) => (
            <article
              key={task.action}
              className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4"
            >
              <div className="flex items-start gap-3">
                <span
                  className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
                    task.urgent
                      ? "bg-amber-50 text-amber-700"
                      : "bg-emerald-50 text-emerald-700"
                  }`}
                >
                  <AlertTriangle className="size-5" />
                </span>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-[#0F172A]">
                    {task.title}
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-[#64748B]">
                    {task.description}
                  </p>
                </div>
              </div>
              <Link
                href={task.href}
                className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-xl bg-[#0F172A] px-3 text-sm font-semibold text-white transition hover:bg-[#1E293B]"
              >
                {task.action}
              </Link>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

interface AdminDashboardOverviewProps {
  displayName: string;
  schoolName: string | null;
  stats: Array<{
    title: string;
    value: string;
    description: string;
    href?: string;
  }>;
  operationalData: AdminOperationalDashboardData;
}

function AdminDashboardOverview({
  displayName,
  schoolName,
  stats,
  operationalData,
}: AdminDashboardOverviewProps) {
  const primaryStats = ["Guru", "Siswa", "Kelas", "Ujian Aktif"]
    .map((title) => stats.find((stat) => stat.title === title))
    .filter((stat): stat is NonNullable<typeof stat> => Boolean(stat))
    .map((stat) =>
      stat.title === "Ujian Aktif"
        ? {
            ...stat,
            title: "Ujian Aktif",
            description: "Ujian yang sedang berjalan.",
          }
        : stat,
    );
  const completedProgress = operationalData.setupProgress.filter(
    (item) => item.done,
  ).length;
  const progressPercent = operationalData.setupProgress.length
    ? Math.round(
        (completedProgress / operationalData.setupProgress.length) * 100,
      )
    : 0;

  return (
    <div className="mx-auto max-w-7xl space-y-6 text-[#0F172A]">
      <section className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-[#FFFFFF] p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0 space-y-4">
            <div>
              <p className="text-sm font-medium text-[#2563EB]">
                {UI_LABELS.navigation.home} Admin Sekolah
              </p>
              <h1 className="mt-2 text-2xl font-semibold tracking-normal md:text-3xl">
                Selamat Datang, {displayName}
              </h1>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <DashboardInfoChip
                label="Sekolah"
                value={schoolName ?? "Sekolah belum dipilih"}
              />
              <DashboardInfoChip
                label="Tahun Ajaran Aktif"
                value={
                  operationalData.activeAcademicYearName ??
                  "Belum ada tahun ajaran aktif"
                }
              />
              <DashboardInfoChip
                label="Semester Aktif"
                value={
                  operationalData.activeSemesterName ??
                  "Belum ada semester aktif"
                }
              />
            </div>
          </div>
          <div className="flex size-20 shrink-0 items-center justify-center rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] text-[#2563EB] md:size-24">
            <School className="size-10 md:size-12" />
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {primaryStats.map((stat) => (
          <Link key={stat.title} href={stat.href ?? "/dashboard/admin"}>
            <div className="h-full rounded-xl border border-[#E2E8F0] bg-[#FFFFFF] p-5 shadow-sm transition hover:border-[#2563EB] hover:shadow-md">
              <p className="text-sm font-medium text-[#64748B]">{stat.title}</p>
              <p className="mt-3 text-3xl font-semibold tracking-normal">
                {stat.value}
              </p>
              <p className="mt-2 text-sm leading-6 text-[#64748B]">
                {stat.description}
              </p>
            </div>
          </Link>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm">
          <div className="mb-4">
            <h2 className="text-base font-semibold">Perlu Ditindaklanjuti</h2>
            <p className="mt-1 text-sm text-[#64748B]">
              Pekerjaan operasional yang menghambat setup atau pelaksanaan.
            </p>
          </div>
          <div className="grid gap-3">
            {operationalData.tasks.map((task) => (
              <article
                key={task.title}
                className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4"
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl ${
                      task.urgent
                        ? "bg-amber-50 text-amber-700"
                        : "bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    {task.urgent ? (
                      <AlertTriangle className="size-5" />
                    ) : (
                      <CheckCircle2 className="size-5" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold">{task.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-[#64748B]">
                      {task.description}
                    </p>
                  </div>
                  <Link
                    href={task.href}
                    className="hidden rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 text-xs font-semibold hover:bg-white sm:inline-flex"
                  >
                    {task.action}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm">
          <div className="mb-4">
            <h2 className="text-base font-semibold">Progress Setup Sekolah</h2>
            <p className="mt-1 text-sm text-[#64748B]">
              {completedProgress} dari {operationalData.setupProgress.length} tahap siap.
            </p>
          </div>
          <div className="mb-4 h-2 rounded-full bg-[#E2E8F0]">
            <div
              className="h-2 rounded-full bg-[#2563EB]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="grid gap-2">
            {operationalData.setupProgress.map((item) => {
              const Icon = item.done ? CheckCircle2 : Circle;

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex items-center justify-between gap-3 rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm hover:bg-[#F8FAFC]"
                >
                  <span>{item.label}</span>
                  <Icon
                    className={`size-4 ${
                      item.done ? "text-emerald-600" : "text-[#94A3B8]"
                    }`}
                  />
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <AdminOperationalWorkbench />

      <section className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm">
        <div className="mb-4">
          <h2 className="text-base font-semibold">Aktivitas Terbaru Sekolah</h2>
          <p className="mt-1 text-sm text-[#64748B]">
            Perubahan data terbaru dalam lingkup sekolah.
          </p>
        </div>
        <div className="grid gap-2">
          {operationalData.recentActivities.length ? (
            operationalData.recentActivities.map((activity) => (
              <Link
                key={`${activity.label}-${activity.createdAt}`}
                href={activity.href}
                className="flex flex-col gap-1 rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm hover:bg-[#F8FAFC] sm:flex-row sm:items-center sm:justify-between"
              >
                <span>
                  <span className="font-semibold">{activity.label}</span>
                  <span className="text-[#64748B]"> - {activity.description}</span>
                </span>
                <span className="text-xs text-[#64748B]">
                  {formatDashboardDate(activity.createdAt)}
                </span>
              </Link>
            ))
          ) : (
            <EmptyState
              title="Belum ada aktivitas terbaru"
              description="Aktivitas akan muncul setelah data sekolah mulai dibuat."
            />
          )}
        </div>
      </section>
    </div>
  );
}

function DashboardInfoChip({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-normal text-[#64748B]">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-semibold">{value}</p>
    </div>
  );
}

function formatDashboardDate(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function AdminOperationalWorkbench() {
  const actions = [
    {
      title: "Tambah Siswa",
      description: "Kelola data dan akun siswa.",
      href: "/dashboard/master-data/students/create",
      icon: GraduationCap,
    },
    {
      title: "Tambah Guru",
      description: "Kelola data dan akun guru.",
      href: "/dashboard/master-data/teachers/create",
      icon: Users,
    },
    {
      title: "Penugasan Guru",
      description: "Hubungkan guru, mata pelajaran, dan kelas.",
      href: "/dashboard/master-data/teacher-assignments",
      icon: ClipboardCheck,
    },
    {
      title: "Jadwal Ujian",
      description: "Atur waktu dan peserta ujian.",
      href: "/dashboard/exams/schedules",
      icon: CalendarDays,
    },
    {
      title: "Import Data",
      description: "Unggah guru, siswa, kelas, dan penugasan.",
      href: "/dashboard/import-export?tab=import",
      icon: Upload,
    },
    {
      title: "Export Data",
      description: "Unduh data sekolah yang dibutuhkan operator.",
      href: "/dashboard/import-export?tab=export",
      icon: Download,
    },
  ];

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-base font-semibold">Aksi Cepat</h2>
        <p className="mt-1 text-sm text-[#64748B]">
          Jalur cepat untuk pekerjaan utama admin sekolah.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <Link key={action.href} href={action.href}>
              <div className="flex h-full min-h-32 flex-col justify-between rounded-xl border border-[#E2E8F0] bg-[#FFFFFF] p-4 shadow-sm transition hover:border-[#2563EB] hover:shadow-md">
                <div>
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-[#2563EB]/10 text-[#2563EB]">
                      <Icon className="size-5" />
                    </div>
                    <ArrowRight className="size-4 shrink-0 text-[#64748B]" />
                  </div>
                  <h3 className="text-sm font-semibold">{action.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#64748B]">
                    {action.description}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function ProctorOperationalWorkbench() {
  const actions = [
    {
      title: "Jadwal Pengawasan",
      description: "Lihat jadwal, kelas target, token terbatas, dan status peserta.",
      href: "/dashboard/proctor/schedules",
    },
    {
      title: "Pengawasan Langsung",
      description: "Pantau peserta, progres pengerjaan, kejadian, kunci akses, dan aksi darurat.",
      href: "/dashboard/proctor/monitoring",
    },
    {
      title: "Token Ujian",
      description: "Lihat dan cetak token ujian.",
      href: "/dashboard/proctor/tokens",
    },
    {
      title: "Peserta Belum Mulai",
      description: "Fokus ke siswa yang belum membuka ujian.",
      href: "/dashboard/proctor/monitoring?status=assigned",
    },
    {
      title: "Peserta Sedang Ujian",
      description: "Pantau pengerjaan ujian yang sedang berjalan.",
      href: "/dashboard/proctor/monitoring?status=in_progress",
    },
    {
      title: "Peserta Sudah Selesai",
      description: "Cek peserta yang sudah mengumpulkan ujian.",
      href: "/dashboard/proctor/monitoring?status=submitted",
    },
    {
      title: "Profil Pengawas",
      description: "Perbarui data profil pengawas dan kontak operasional.",
      href: "/dashboard/profile",
    },
  ];

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {actions.map((action) => (
        <Link key={action.href} href={action.href}>
          <DashboardCard
            title={action.title}
            description={action.description}
            className="h-full transition hover:border-primary/40 hover:shadow-md"
          />
        </Link>
      ))}
    </section>
  );
}
