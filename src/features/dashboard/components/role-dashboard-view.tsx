import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  GraduationCap,
  PenSquare,
  School,
  Users,
} from "lucide-react";

import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import {
  getAdminOperationalDashboardData,
  getRoleDashboardStats,
  type AdminOperationalDashboardData,
} from "@/features/dashboard/queries";
import type { CurrentUser, RoleName } from "@/types/auth";
import { formatJakartaDate, formatJakartaTime } from "@/lib/date-time";

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
    description: "Kelola pengguna, hak akses, izin akses, dan catatan aktivitas sistem ujian online.",
    stats: [
      { title: "Cakupan Akses", value: "Penuh", description: "Super Admin dapat mengelola seluruh pengaturan sistem." },
      { title: "Kontrol Sistem", value: "Aktif", description: "Hak akses dan catatan aktivitas siap dipantau." },
      { title: "Kesiapan Sistem", value: "Siap", description: "Ringkasan sistem siap digunakan." },
    ],
    workbenchTitle: "Belum ada ringkasan pengelolaan sistem",
    workbenchDescription: "Kartu ini disiapkan untuk ringkasan pengguna, hak akses, izin akses, dan catatan aktivitas.",
  },
  admin: {
    title: "Dashboard",
    description: "Ringkasan aktivitas, ujian berjalan, dan informasi penting sekolah.",
    stats: [
      { title: "Pengguna", value: "Siap", description: "Menu pengguna tampil sesuai hak akses admin sekolah." },
      { title: "Hak Akses", value: "Terbatas", description: "Akses admin dibatasi sesuai tugas sekolah." },
      { title: "Operasional", value: "Siap", description: "Ringkasan pekerjaan sekolah siap digunakan." },
    ],
    workbenchTitle: "Belum ada pekerjaan administrasi aktif",
    workbenchDescription: "Area ini menampilkan pekerjaan sekolah yang perlu ditindaklanjuti.",
  },
  principal: {
    title: "Beranda Kepala Sekolah",
    description: "Pantau ringkasan sekolah, performa ujian, dan laporan akademik lintas kelas.",
    stats: [
      { title: "Laporan", value: "Siap", description: "Area laporan kepala sekolah sudah dipisah dari admin." },
      { title: "Cakupan Data", value: "Sekolah", description: "Dirancang untuk ringkasan data dan pengawasan." },
      { title: "Hak Akses", value: "Kepala Sekolah", description: "Halaman hanya dapat dibuka oleh kepala sekolah." },
    ],
    workbenchTitle: "Belum ada laporan yang tersedia",
    workbenchDescription: "Ringkasan nilai dan partisipasi akan tampil setelah data ujian tersedia.",
  },
  teacher: {
    title: "Dashboard Guru",
    description: "Ringkasan aktivitas mengajar dan pelaksanaan ujian.",
    stats: [
      { title: "Bank Soal", value: "Siap", description: "Kelola kategori dan soal sesuai mapel yang ditugaskan.", href: "/dashboard/question-bank/questions" },
      { title: "Ujian", value: "Siap", description: "Area ujian guru siap digunakan.", href: "/dashboard/exams" },
      { title: "Koreksi Esai", value: "Siap", description: "Area penilaian siap digunakan saat ada jawaban esai." },
    ],
    workbenchTitle: "Belum ada ujian yang perlu dinilai",
    workbenchDescription: "Setelah ujian aktif, area ini dapat menampilkan soal belum diterbitkan dan pekerjaan koreksi.",
  },
  student: {
    title: "Dashboard",
    description: "Ringkasan ujian, jadwal, dan informasi penting untuk siswa.",
    stats: [
      { title: "Ujian Berlangsung", value: "0", description: "Belum ada ujian yang dapat dikerjakan sekarang." },
      { title: "Riwayat", value: "0", description: "Hasil ujian akan tampil setelah ujian selesai." },
      { title: "Akses", value: "Aktif", description: "Akun siswa siap digunakan untuk mengikuti ujian." },
    ],
    workbenchTitle: "Belum ada ujian yang perlu dikerjakan",
    workbenchDescription: "Ujian yang tersedia akan muncul saat jadwal sekolah sudah dibuka.",
  },
  proctor: {
    title: "Dashboard Pengawas",
    description: "Ringkasan ujian yang sedang diawasi.",
    stats: [
      { title: "Pengawasan", value: "Siap", description: "Akun pengawas siap memantau pelaksanaan ujian." },
      { title: "Sesi Ujian", value: "0", description: "Ujian akan muncul saat jadwal pengawasan tersedia." },
      { title: "Hak Akses", value: "Pengawas", description: "Akses difokuskan untuk pemantauan peserta ujian." },
    ],
    workbenchTitle: "Belum ada ujian yang sedang diawasi",
    workbenchDescription: "Daftar peserta dan status ujian akan muncul saat jadwal berlangsung.",
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
    <div className="space-y-6">
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
              className={stat.href ? "transition-all active:scale-[0.98]" : ""}
            />
          );
          if (!stat.href) return <div key={stat.title}>{card}</div>;
          return <Link key={stat.title} href={stat.href}>{card}</Link>;
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

// ------------------------------------------------------------------
// TEACHER DASHBOARD
// ------------------------------------------------------------------

interface TeacherDashboardOverviewProps {
  displayName: string;
  stats: Array<{ title: string; value: string; description: string; href?: string; }>;
}

function statNumber(stats: TeacherDashboardOverviewProps["stats"], title: string) {
  const value = stats.find((stat) => stat.title === title)?.value ?? "0";
  return Number(value.replace(/[^0-9.-]/g, "")) || 0;
}

function TeacherDashboardOverview({ displayName, stats }: TeacherDashboardOverviewProps) {
  const firstName = displayName.split(" ")[0] ?? displayName;
  const kelasValue = stats.find((stat) => stat.title === "Kelas Saya")?.value ?? "0/0";
  const kelasCount = Number(kelasValue.split("/")[1] ?? kelasValue) || 0;
  const bankSoalCount = statNumber(stats, "Soal Belum Diterbitkan") + statNumber(stats, "Soal Sudah Diterbitkan");
  const ujianAktif = statNumber(stats, "Ujian Aktif");
  const perluDinilai = statNumber(stats, "Perlu Dinilai");
  const belumMengikuti = statNumber(stats, "Belum Mengikuti");
  const ujianHariIni = statNumber(stats, "Ujian Hari Ini");

  const mainStats = [
    { title: "Kelas Saya", value: String(kelasCount), description: "Kelas yang diampu.", href: "/dashboard/teacher/assignments", icon: GraduationCap },
    { title: "Bank Soal", value: String(bankSoalCount), description: "Soal yang sudah dibuat.", href: "/dashboard/question-bank/questions", icon: BookOpen },
    { title: "Ujian Aktif", value: String(ujianAktif), description: "Ujian yang sedang berlangsung.", href: "/dashboard/exams/schedules?status=active", icon: CalendarDays },
    { title: "Perlu Dinilai", value: String(perluDinilai), description: "Jawaban esai menunggu nilai.", href: "/dashboard/teacher/grading?grading_status=needs_manual_grading", icon: ClipboardCheck },
  ];

  const tasks = [
    { title: `${perluDinilai} Jawaban Esai Belum Dinilai`, description: "Selesaikan penilaian agar hasil siswa dapat dibaca.", href: "/dashboard/teacher/grading?grading_status=needs_manual_grading", action: "Nilai Sekarang", urgent: perluDinilai > 0 },
    { title: `${belumMengikuti} Siswa Belum Mengikuti Ujian`, description: "Cek peserta yang belum mulai pada ujian aktif atau terjadwal.", href: "/dashboard/reports/students?status=assigned", action: "Lihat Detail", urgent: belumMengikuti > 0 },
    { title: `${ujianHariIni} Ujian Akan Dimulai Hari Ini`, description: "Pastikan jadwal, kelas, dan token ujian sudah siap.", href: "/dashboard/exams/schedules", action: "Lihat Jadwal", urgent: ujianHariIni > 0 },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-safe">
      {/* Teacher Hero Banner */}
      <section className="rounded-3xl bg-[#2563EB] p-6 text-white shadow-lg relative overflow-hidden">
        <div className="pointer-events-none absolute right-0 top-0 size-40 rounded-full bg-white/10" />
        <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[13px] font-semibold text-blue-200 uppercase tracking-wider">Dashboard Guru</p>
            <h1 className="mt-1 text-[24px] font-bold leading-tight">Halo, {firstName}</h1>
            <p className="mt-2 text-[14px] text-blue-100 max-w-md">Pantau kelas, kelola soal, dan periksa hasil ujian siswa dengan mudah.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:w-auto">
            <Link href="/dashboard/question-bank/questions/create" className="flex h-11 items-center justify-center gap-2 rounded-full bg-white px-5 text-[14px] font-semibold text-[#2563EB] active:scale-[0.97] transition-transform">
              <PenSquare className="size-4" /> Buat Soal
            </Link>
            <Link href="/dashboard/exams/packages/create" className="flex h-11 items-center justify-center gap-2 rounded-full bg-blue-700 px-5 text-[14px] font-semibold text-white active:scale-[0.97] transition-transform border border-blue-600">
              <CalendarDays className="size-4" /> Buat Ujian
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {mainStats.map((stat) => (
          <Link key={stat.title} href={stat.href} className="md-card-elevated flex flex-col p-4 active:scale-[0.98] transition-transform">
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#2563EB]">
                <stat.icon className="size-5" />
              </span>
              <div>
                <p className="text-[13px] font-medium text-[#64748B]">{stat.title}</p>
                <p className="text-[24px] font-bold text-[#1E293B] leading-none mt-1">{stat.value}</p>
              </div>
            </div>
          </Link>
        ))}
      </section>

      {/* Tasks List */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-[16px] font-semibold text-[#1E293B]">Tugas Perlu Dicek</h2>
        </div>
        <div className="md-card-elevated divide-y divide-[#F1F5F9] overflow-hidden">
          {tasks.map((task, idx) => (
            <div key={idx} className="p-4 sm:flex sm:items-center sm:justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className={`mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl ${task.urgent ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"}`}>
                  <AlertTriangle className="size-5" />
                </span>
                <div className="min-w-0">
                  <h3 className="text-[15px] font-semibold text-[#1E293B]">{task.title}</h3>
                  <p className="mt-0.5 text-[13px] text-[#64748B]">{task.description}</p>
                </div>
              </div>
              <Link href={task.href} className="mt-3 flex h-10 w-full sm:w-auto items-center justify-center rounded-full bg-[#F1F5F9] px-4 text-[13px] font-semibold text-[#1E293B] hover:bg-[#E2E8F0] transition-colors">
                {task.action}
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// ------------------------------------------------------------------
// ADMIN DASHBOARD
// ------------------------------------------------------------------

interface AdminDashboardOverviewProps {
  displayName: string;
  schoolName: string | null;
  stats: Array<{ title: string; value: string; description: string; href?: string; }>;
  operationalData: AdminOperationalDashboardData;
}

function AdminDashboardOverview({ displayName, schoolName, stats, operationalData }: AdminDashboardOverviewProps) {
  const firstName = displayName.split(" ")[0] ?? displayName;
  const primaryStats = ["Ujian Aktif", "Jadwal Mendatang", "Total Guru", "Total Siswa"]
    .map((title) => stats.find((stat) => stat.title === title))
    .filter((stat): stat is NonNullable<typeof stat> => Boolean(stat));

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-safe">
      {/* Admin Hero */}
      <section className="rounded-3xl bg-[#2563EB] p-6 text-white shadow-lg relative overflow-hidden">
        <div className="pointer-events-none absolute right-0 top-0 size-40 rounded-full bg-white/10" />
        <div className="relative z-10 flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[13px] font-semibold text-blue-200 uppercase tracking-wider">Admin Sekolah</p>
              <h1 className="mt-1 text-[24px] font-bold leading-tight">Halo, {firstName}</h1>
            </div>
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-white backdrop-blur-sm">
              <School className="size-6" />
            </div>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
             <div className="rounded-full border border-blue-400 bg-blue-800/40 px-3 py-1 text-[12px] font-medium text-blue-100 backdrop-blur-sm">
               {schoolName ?? "Sekolah belum dipilih"}
             </div>
             <div className="rounded-full border border-blue-400 bg-blue-800/40 px-3 py-1 text-[12px] font-medium text-blue-100 backdrop-blur-sm">
               {operationalData.activeSemesterName ?? "Semester Aktif -"}
             </div>
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {primaryStats.map((stat) => (
          <Link key={stat.title} href={stat.href ?? "/dashboard/admin"} className="md-card-elevated p-4 active:scale-[0.98] transition-transform">
            <p className="text-[13px] font-medium text-[#64748B]">{stat.title}</p>
            <p className="mt-1 text-[24px] font-bold text-[#1E293B]">{stat.value}</p>
          </Link>
        ))}
      </section>

      {/* Aksi Cepat */}
      <section className="space-y-3">
        <h2 className="text-[16px] font-semibold text-[#1E293B] px-1">Aksi Cepat</h2>
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
          {[
            { title: "Jadwal", href: "/dashboard/exams/schedules/create", icon: CalendarDays },
            { title: "Siswa", href: "/dashboard/master-data/students/create", icon: GraduationCap },
            { title: "Guru", href: "/dashboard/master-data/teachers/create", icon: Users },
            { title: "Monitor", href: "/dashboard/admin/monitoring", icon: ClipboardCheck },
          ].map((action) => (
            <Link key={action.title} href={action.href} className="md-card-elevated flex flex-col items-center justify-center gap-2 p-4 text-center active:scale-[0.98] transition-transform">
              <div className="flex size-12 items-center justify-center rounded-full bg-blue-50 text-[#2563EB]">
                <action.icon className="size-6" />
              </div>
              <span className="text-[13px] font-semibold text-[#1E293B]">{action.title}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Tasks / Readiness / Schedules */}
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
           {/* Notifikasi Penting */}
           <div className="space-y-2">
             <h2 className="text-[16px] font-semibold text-[#1E293B] px-1">Notifikasi Penting</h2>
             <div className="md-card-elevated divide-y divide-[#F1F5F9] overflow-hidden">
               {operationalData.tasks.length ? operationalData.tasks.map((task) => (
                  <div key={task.title} className="p-4 flex items-start gap-3">
                    <span className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full ${task.urgent ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"}`}>
                      {task.urgent ? <AlertTriangle className="size-4" /> : <CheckCircle2 className="size-4" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-[14px] font-semibold text-[#1E293B]">{task.title}</h3>
                      <p className="text-[12px] text-[#64748B] mt-0.5">{task.description}</p>
                      <Link href={task.href} className="mt-2 inline-flex text-[13px] font-semibold text-[#2563EB]">{task.action}</Link>
                    </div>
                  </div>
               )) : <div className="p-6 text-center text-[13px] text-[#64748B]">Tidak ada notifikasi penting.</div>}
             </div>
           </div>
        </div>

        <div className="space-y-4">
          <UpcomingSchedulesWidget schedules={operationalData.upcomingSchedules} />
          <ExamReadinessWidget readiness={operationalData.examReadiness} />
        </div>
      </section>
    </div>
  );
}

function UpcomingSchedulesWidget({ schedules }: { schedules: AdminOperationalDashboardData["upcomingSchedules"] }) {
  return (
    <div className="space-y-2">
      <h2 className="text-[16px] font-semibold text-[#1E293B] px-1">Jadwal Terdekat</h2>
      <div className="md-card-elevated divide-y divide-[#F1F5F9] overflow-hidden">
        {schedules.length ? schedules.map((schedule) => (
          <Link key={schedule.id} href="/dashboard/exams/schedules" className="flex items-center justify-between p-4 active:bg-[#F8FAFC]">
            <div className="min-w-0">
              <p className="text-[14px] font-semibold text-[#1E293B] truncate">{schedule.title}</p>
              <p className="text-[12px] text-[#64748B] truncate mt-0.5">{formatJakartaDate(schedule.startAt as string)} • {formatJakartaTime(schedule.startAt as string)}</p>
            </div>
            <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700 ml-3">
              {schedule.participantCount} peserta
            </span>
          </Link>
        )) : <div className="p-6 text-center text-[13px] text-[#64748B]">Belum ada jadwal.</div>}
      </div>
    </div>
  );
}

function ExamReadinessWidget({ readiness }: { readiness: AdminOperationalDashboardData["examReadiness"] }) {
  const items = [
    { label: "Jadwal Siap", value: readiness.ready, href: "/dashboard/exams/schedules?readiness=ready", color: "text-emerald-700 bg-emerald-50" },
    { label: "Perlu Dicek", value: readiness.warning, href: "/dashboard/exams/schedules?readiness=warning", color: "text-amber-700 bg-amber-50" },
    { label: "Diblokir", value: readiness.blocked, href: "/dashboard/exams/schedules?readiness=blocked", color: "text-red-700 bg-red-50" },
  ];
  return (
    <div className="space-y-2">
      <h2 className="text-[16px] font-semibold text-[#1E293B] px-1">Kesiapan Ujian</h2>
      <div className="md-card-elevated divide-y divide-[#F1F5F9] overflow-hidden">
        {items.map((item) => (
          <Link key={item.label} href={item.href} className="flex items-center justify-between p-3.5 active:bg-[#F8FAFC]">
            <span className="text-[14px] font-medium text-[#1E293B]">{item.label}</span>
            <span className={`rounded-full px-2.5 py-1 text-[12px] font-semibold ${item.color}`}>{item.value}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// PROCTOR DASHBOARD
// ------------------------------------------------------------------

function ProctorOperationalWorkbench() {
  const actions = [
    { title: "Jadwal Pengawasan", description: "Lihat jadwal ujian yang diawasi.", href: "/dashboard/proctor/schedules" },
    { title: "Pengawasan Langsung", description: "Pantau peserta dan kejadian ujian.", href: "/dashboard/proctor/monitoring" },
    { title: "Token Ujian", description: "Cetak token ujian peserta.", href: "/dashboard/proctor/tokens" },
  ];
  return (
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {actions.map((action) => (
        <Link key={action.href} href={action.href} className="md-card-elevated p-4 active:scale-[0.98]">
          <h3 className="text-[15px] font-semibold text-[#1E293B]">{action.title}</h3>
          <p className="mt-1 text-[13px] text-[#64748B]">{action.description}</p>
        </Link>
      ))}
    </section>
  );
}
