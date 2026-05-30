import Link from "next/link";

import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { getRoleDashboardStats } from "@/features/dashboard/queries";
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
        {role === "admin" ? <AdminOperationalWorkbench /> : null}
        {role === "teacher" ? <TeacherOperationalWorkbench /> : null}
        {role === "proctor" ? <ProctorOperationalWorkbench /> : null}
        {role !== "admin" && role !== "teacher" && role !== "proctor" ? (
            <EmptyState
              title={content.workbenchTitle}
              description={content.workbenchDescription}
            />
          ) : null}
      </div>
    </div>
  );
}

function AdminOperationalWorkbench() {
  const actions = [
    {
      title: "Lengkapi Master Data",
      description: "Sekolah, tahun ajaran, kelas, mapel, guru, dan siswa.",
      href: "/dashboard/master-data",
    },
    {
      title: "Siapkan Paket Ujian",
      description: "Cek readiness paket sebelum dipakai pada jadwal.",
      href: "/dashboard/exams/packages",
    },
    {
      title: "Atur Jadwal & Peserta",
      description: "Pastikan kelas target, peserta, token, dan konflik waktu aman.",
      href: "/dashboard/exams/schedules",
    },
    {
      title: "Pantau Ujian",
      description: "Monitoring peserta, progress, event, lock, dan tindakan darurat.",
      href: "/dashboard/admin/monitoring",
    },
    {
      title: "Review Laporan",
      description: "Lihat rekap ujian, kelas, mapel, siswa, dan export CSV.",
      href: "/dashboard/reports",
    },
    {
      title: "Import Data",
      description: "Ambil template CSV dan validasi staging sebelum commit data.",
      href: "/dashboard/import-export",
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
