import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  GraduationCap,
  School,
  Upload,
  Users,
} from "lucide-react";

import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { getRoleDashboardStats } from "@/features/dashboard/queries";
import { getAcademicYears } from "@/lib/master-data/queries";
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
    title: "Super Admin Dashboard",
    description:
      "Kontrol penuh untuk user, role, permission, dan audit sistem ujian online.",
    stats: [
      {
        title: "Permission Scope",
        value: "Full",
        description: "Akses super admin melewati semua permission checks.",
      },
      {
        title: "Governance",
        value: "Active",
        description: "RBAC foundation siap untuk audit dan kontrol akses.",
      },
      {
        title: "System Readiness",
        value: "Sprint 2",
        description: "Dashboard siap menerima modul akademik berikutnya.",
      },
    ],
    workbenchTitle: "Admin operations belum memiliki data ringkasan",
    workbenchDescription:
      "Kartu ini disiapkan untuk metrik user, role, permission, dan audit logs pada sprint berikutnya.",
  },
  admin: {
    title: "Admin Dashboard",
    description:
      "Kelola operasional pengguna, konfigurasi role terbatas, dan kesiapan pelaksanaan ujian.",
    stats: [
      {
        title: "User Management",
        value: "Ready",
        description: "Menu user tampil sesuai permission users.view.",
      },
      {
        title: "Role Access",
        value: "Scoped",
        description: "Akses admin dibatasi oleh role dan permission.",
      },
      {
        title: "Operations",
        value: "Stable",
        description: "Layout dashboard siap untuk workflow administrasi.",
      },
    ],
    workbenchTitle: "Belum ada pekerjaan administrasi aktif",
    workbenchDescription:
      "Nanti area ini dapat menampilkan onboarding user, validasi akun, dan jadwal ujian.",
  },
  principal: {
    title: "Principal Dashboard",
    description:
      "Pantau ringkasan sekolah, performa ujian, dan laporan akademik lintas kelas.",
    stats: [
      {
        title: "Reports",
        value: "Ready",
        description: "Area laporan kepala sekolah sudah dipisah dari admin.",
      },
      {
        title: "Visibility",
        value: "School",
        description: "Dirancang untuk agregasi data dan monitoring.",
      },
      {
        title: "Access",
        value: "Principal",
        description: "Route hanya dapat diakses role principal.",
      },
    ],
    workbenchTitle: "Belum ada laporan yang tersedia",
    workbenchDescription:
      "Sprint berikutnya dapat mengisi ringkasan nilai, tingkat partisipasi, dan status ujian.",
  },
  teacher: {
    title: "Teacher Dashboard",
    description:
      "Workspace guru untuk bank soal, penyusunan ujian, dan penilaian hasil peserta.",
    stats: [
      {
        title: "Question Bank",
        value: "Ready",
        description: "Kelola kategori dan soal sesuai mapel yang ditugaskan.",
        href: "/dashboard/question-bank/questions",
      },
      {
        title: "Exams",
        value: "Ready",
        description: "Area ujian guru siap dihubungkan ke modul exam.",
        href: "/dashboard/exams",
      },
      {
        title: "Grading",
        value: "Ready",
        description: "Fondasi penilaian sudah memiliki route dan menu.",
      },
    ],
    workbenchTitle: "Belum ada ujian yang perlu dinilai",
    workbenchDescription:
      "Setelah modul ujian aktif, area ini dapat menampilkan draft ujian dan pekerjaan grading.",
  },
  student: {
    title: "Student Dashboard",
    description:
      "Halaman peserta untuk melihat ujian aktif, riwayat ujian, dan jadwal pengerjaan.",
    stats: [
      {
        title: "Active Exams",
        value: "0",
        description: "Belum ada ujian aktif yang ditautkan ke peserta.",
      },
      {
        title: "History",
        value: "0",
        description: "Riwayat ujian akan tampil setelah modul exam berjalan.",
      },
      {
        title: "Session",
        value: "Secure",
        description: "Akses peserta terlindungi session Supabase SSR.",
      },
    ],
    workbenchTitle: "Tidak ada ujian aktif",
    workbenchDescription:
      "Saat guru atau proktor membuka ujian, daftar ujian peserta akan muncul di sini.",
  },
  proctor: {
    title: "Proctor Dashboard",
    description:
      "Monitoring pelaksanaan ujian, kehadiran peserta, dan status sesi secara real-time.",
    stats: [
      {
        title: "Monitoring",
        value: "Ready",
        description: "Route monitoring proctor sudah tersedia.",
      },
      {
        title: "Exam Sessions",
        value: "0",
        description: "Sesi ujian akan muncul setelah modul exam aktif.",
      },
      {
        title: "Access",
        value: "Proctor",
        description: "Route dikunci untuk role proctor.",
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
    const academicYears = await getAcademicYears();
    const activeAcademicYear =
      academicYears.find((academicYear) => Boolean(academicYear.is_active)) ??
      academicYears[0];

    return (
      <AdminDashboardOverview
        displayName={displayName}
        schoolName={user.school_name}
        academicYearName={activeAcademicYear?.name ?? null}
        stats={stats}
      />
    );
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
        {role === "teacher" ? <TeacherOperationalWorkbench /> : null}
        {role === "proctor" ? <ProctorOperationalWorkbench /> : null}
        {role !== "teacher" && role !== "proctor" ? (
            <EmptyState
              title={content.workbenchTitle}
              description={content.workbenchDescription}
            />
          ) : null}
      </div>
    </div>
  );
}

interface AdminDashboardOverviewProps {
  displayName: string;
  schoolName: string | null;
  academicYearName: string | null;
  stats: Array<{
    title: string;
    value: string;
    description: string;
    href?: string;
  }>;
}

function AdminDashboardOverview({
  displayName,
  schoolName,
  academicYearName,
  stats,
}: AdminDashboardOverviewProps) {
  const primaryStats = ["Siswa", "Guru", "Kelas", "Jadwal Active"]
    .map((title) => stats.find((stat) => stat.title === title))
    .filter((stat): stat is NonNullable<typeof stat> => Boolean(stat))
    .map((stat) =>
      stat.title === "Jadwal Active"
        ? {
            ...stat,
            title: "Ujian Aktif",
            description: "Ujian yang sedang berjalan.",
          }
        : stat,
    );
  const hasDataIssue = stats.some((stat) =>
    ["Tanpa Peserta", "Kelas Tanpa Siswa", "Kelas Tanpa Wali"].includes(
      stat.title,
    ) && Number(stat.value) > 0,
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6 text-[#0F172A]">
      <section className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-[#FFFFFF] p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0 space-y-4">
            <div>
              <p className="text-sm font-medium text-[#2563EB]">
                Dashboard Admin Sekolah
              </p>
              <h1 className="mt-2 text-2xl font-semibold tracking-normal md:text-3xl">
                Selamat Datang, {displayName}
              </h1>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-normal text-[#64748B]">
                  Sekolah
                </p>
                <p className="mt-1 truncate text-sm font-semibold">
                  {schoolName ?? "Sekolah belum dipilih"}
                </p>
              </div>
              <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-normal text-[#64748B]">
                  Tahun Ajaran Aktif
                </p>
                <p className="mt-1 truncate text-sm font-semibold">
                  {academicYearName ?? "Belum ada tahun ajaran aktif"}
                </p>
              </div>
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

      <AdminOperationalWorkbench />

      <section
        className={`rounded-xl border bg-[#FFFFFF] p-4 shadow-sm ${
          hasDataIssue ? "border-[#F59E0B]/40" : "border-[#E2E8F0]"
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`mt-1 size-2.5 shrink-0 rounded-full ${
              hasDataIssue ? "bg-[#F59E0B]" : "bg-[#22C55E]"
            }`}
          />
          <div>
            <h2 className="text-sm font-semibold">Informasi Penting</h2>
            <p className="mt-1 text-sm leading-6 text-[#64748B]">
              {hasDataIssue
                ? "Ada data yang perlu dilengkapi sebelum ujian berjalan."
                : "Semua data utama sudah lengkap dan siap digunakan."}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function AdminOperationalWorkbench() {
  const actions = [
    {
      title: "Tambah Siswa",
      description: "Kelola data dan akun siswa.",
      href: "/dashboard/master-data/students",
      icon: GraduationCap,
    },
    {
      title: "Tambah Guru",
      description: "Kelola data dan akun guru.",
      href: "/dashboard/master-data/teachers",
      icon: Users,
    },
    {
      title: "Buat Paket Ujian",
      description: "Siapkan paket soal ujian.",
      href: "/dashboard/exams/packages",
      icon: BookOpen,
    },
    {
      title: "Buat Jadwal Ujian",
      description: "Atur waktu dan peserta ujian.",
      href: "/dashboard/exams/schedules",
      icon: CalendarDays,
    },
    {
      title: "Import Data",
      description: "Unggah data master sekaligus.",
      href: "/dashboard/import-export",
      icon: Upload,
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
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
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
      title: "Monitoring Live",
      description: "Pantau peserta, progress submit, event, lock, dan aksi darurat.",
      href: "/dashboard/proctor/monitoring",
    },
    {
      title: "Token Ujian",
      description: "Lihat dan print token ujian yang wajib token.",
      href: "/dashboard/proctor/tokens",
    },
    {
      title: "Peserta Belum Mulai",
      description: "Fokus ke siswa assigned yang belum membuka ujian.",
      href: "/dashboard/proctor/monitoring?status=assigned",
    },
    {
      title: "Peserta Sedang Ujian",
      description: "Pantau attempt yang sedang in progress.",
      href: "/dashboard/proctor/monitoring?status=in_progress",
    },
    {
      title: "Peserta Submitted",
      description: "Cek peserta yang sudah mengumpulkan ujian.",
      href: "/dashboard/proctor/monitoring?status=submitted",
    },
    {
      title: "Profile Pengawas",
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

function TeacherOperationalWorkbench() {
  const actions = [
    {
      title: "Kelola Bank Soal",
      description: "Buat, edit, publish, dan arsipkan soal sesuai mapel assigned.",
      href: "/dashboard/question-bank/questions",
    },
    {
      title: "Kategori Soal",
      description: "Rapikan soal dengan kategori per mapel.",
      href: "/dashboard/question-bank/categories",
    },
    {
      title: "Susun Paket Ujian",
      description: "Pilih soal published dan cek readiness paket.",
      href: "/dashboard/exams/packages",
    },
    {
      title: "Atur Jadwal",
      description: "Lihat atau kelola jadwal sesuai permission dan mapel.",
      href: "/dashboard/exams/schedules",
    },
    {
      title: "Koreksi Essay",
      description: "Tangani jawaban essay yang masih pending grading.",
      href: "/dashboard/teacher/grading?grading_status=needs_manual_grading",
    },
    {
      title: "Monitoring Guru",
      description: "Pantau sesi ujian yang terkait mapel guru.",
      href: "/dashboard/teacher/monitoring",
    },
    {
      title: "Mapel & Kelas Saya",
      description: "Lihat assignment mengajar sebelum menyusun soal dan ujian.",
      href: "/dashboard/teacher/assignments",
    },
    {
      title: "Kelas Binaan",
      description: "Pantau siswa dan ujian kelas wali.",
      href: "/dashboard/teacher/homeroom",
    },
    {
      title: "Laporan",
      description: "Review nilai siswa, kelas, mapel, dan export laporan.",
      href: "/dashboard/reports",
    },
  ];

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
