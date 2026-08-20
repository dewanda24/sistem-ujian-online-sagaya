import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  GraduationCap,
  KeyRound,
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
import { getProctorOperationalSummary } from "@/features/monitoring/queries";
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
    stats: [],
    workbenchTitle: "Ringkasan Sistem Siap",
    workbenchDescription: "Buka menu super admin untuk mengelola sekolah dan sistem secara global.",
  },
  admin: {
    title: "Dashboard Admin Sekolah",
    description: "Ringkasan aktivitas, ujian berjalan, dan data akademik sekolah.",
    stats: [],
    workbenchTitle: "Belum ada pekerjaan administrasi aktif",
    workbenchDescription: "Area ini menampilkan pekerjaan sekolah yang perlu ditindaklanjuti.",
  },
  principal: {
    title: "Beranda Kepala Sekolah",
    description: "Pantau ringkasan sekolah, performa ujian, dan laporan akademik lintas kelas.",
    stats: [],
    workbenchTitle: "Belum ada laporan yang tersedia",
    workbenchDescription: "Ringkasan nilai dan partisipasi akan tampil setelah data ujian tersedia.",
  },
  teacher: {
    title: "Dashboard Guru",
    description: "Ringkasan aktivitas mengajar dan pelaksanaan ujian.",
    stats: [],
    workbenchTitle: "Belum ada ujian yang perlu dinilai",
    workbenchDescription: "Setelah ujian aktif, area ini dapat menampilkan soal belum diterbitkan dan pekerjaan koreksi.",
  },
  student: {
    title: "Dashboard Siswa",
    description: "Ringkasan ujian, jadwal, dan informasi penting untuk siswa.",
    stats: [],
    workbenchTitle: "Belum ada ujian yang perlu dikerjakan",
    workbenchDescription: "Ujian yang tersedia akan muncul saat jadwal sekolah sudah dibuka.",
  },
  proctor: {
    title: "Dashboard Pengawas",
    description: "Ringkasan ujian yang sedang diawasi.",
    stats: [],
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

  if (role === "proctor") {
    const proctorSummary = await getProctorOperationalSummary(user);
    return (
      <ProctorDashboardOverview
        displayName={displayName}
        summary={proctorSummary}
      />
    );
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
        <EmptyState
          title={content.workbenchTitle}
          description={content.workbenchDescription}
        />
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
            <Link href="/dashboard/question-bank/questions/create" className="flex h-11 items-center justify-center gap-2 rounded-full bg-white px-5 text-[14px] font-semibold text-[#2563EB] active:scale-[0.97] transition-transform shadow-sm hover:bg-slate-50">
              <PenSquare className="size-4" /> Buat Soal
            </Link>
            <Link href="/dashboard/exams/packages/create" className="flex h-11 items-center justify-center gap-2 rounded-full bg-blue-700 px-5 text-[14px] font-semibold text-white active:scale-[0.97] transition-transform border border-blue-600 hover:bg-blue-800">
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
  const primaryStats = [
    { title: "Ujian Aktif", href: "/dashboard/admin/monitoring", icon: Activity, defaultVal: "0" },
    { title: "Jadwal Mendatang", href: "/dashboard/exams/schedules", icon: CalendarDays, defaultVal: "0" },
    { title: "Total Guru", href: "/dashboard/master-data/teachers", icon: Users, defaultVal: "0" },
    { title: "Total Siswa", href: "/dashboard/master-data/students", icon: GraduationCap, defaultVal: "0" },
  ].map((item) => {
    const found = stats.find((s) => s.title === item.title);
    return {
      title: item.title,
      value: found?.value ?? item.defaultVal,
      description: found?.description ?? "",
      href: item.href,
      icon: item.icon,
    };
  });

  const periodLabel = operationalData.activeAcademicYearName
    ? `${operationalData.activeAcademicYearName} - ${operationalData.activeSemesterName ?? "Semester Belum Diatur"}`
    : "Tahun Ajaran Belum Diatur";

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
              <p className="mt-1 text-[14px] text-blue-100">Selamat datang di pusat pengelolaan ujian dan data induk sekolah.</p>
            </div>
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-white backdrop-blur-sm">
              <School className="size-6" />
            </div>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
             <div className="rounded-full border border-blue-400 bg-blue-800/40 px-3.5 py-1 text-[12px] font-medium text-blue-100 backdrop-blur-sm">
               Sekolah: {schoolName ?? "Terdaftar"}
             </div>
             <div className="rounded-full border border-blue-400 bg-blue-800/40 px-3.5 py-1 text-[12px] font-medium text-blue-100 backdrop-blur-sm">
               Periode: {periodLabel}
             </div>
             <div className="rounded-full border border-blue-400 bg-blue-800/40 px-3.5 py-1 text-[12px] font-medium text-blue-100 backdrop-blur-sm">
               Total: {operationalData.totalClasses} Kelas - {operationalData.totalSubjects} Mapel
             </div>
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {primaryStats.map((stat) => (
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

      {/* Aksi Cepat */}
      <section className="space-y-3">
        <h2 className="text-[16px] font-semibold text-[#1E293B] px-1">Aksi Cepat</h2>
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
          {[
            { title: "Buat Jadwal", href: "/dashboard/exams/schedules/create", icon: CalendarDays },
            { title: "Tambah Siswa", href: "/dashboard/master-data/students/create", icon: GraduationCap },
            { title: "Tambah Guru", href: "/dashboard/master-data/teachers/create", icon: Users },
            { title: "Live Monitoring", href: "/dashboard/admin/monitoring", icon: Activity },
          ].map((action) => (
            <Link key={action.title} href={action.href} className="md-card-elevated flex flex-col items-center justify-center gap-2 p-4 text-center active:scale-[0.98] transition-transform hover:border-blue-200">
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
             <h2 className="text-[16px] font-semibold text-[#1E293B] px-1">Pemberitahuan & Setup</h2>
             <div className="md-card-elevated divide-y divide-[#F1F5F9] overflow-hidden">
               {operationalData.tasks.length ? operationalData.tasks.map((task) => (
                  <div key={task.title} className="p-4 flex items-start gap-3">
                    <span className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full ${task.urgent ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"}`}>
                      {task.urgent ? <AlertTriangle className="size-4" /> : <CheckCircle2 className="size-4" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-[14px] font-semibold text-[#1E293B]">{task.title}</h3>
                      <p className="text-[12px] text-[#64748B] mt-0.5">{task.description}</p>
                      <Link href={task.href} className="mt-2 inline-flex text-[13px] font-semibold text-[#2563EB] hover:underline">{task.action}</Link>
                    </div>
                  </div>
               )) : <div className="p-6 text-center text-[13px] text-[#64748B]">Semua konfigurasi data sekolah siap digunakan.</div>}
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
      <h2 className="text-[16px] font-semibold text-[#1E293B] px-1">Jadwal Ujian Terdekat</h2>
      <div className="md-card-elevated divide-y divide-[#F1F5F9] overflow-hidden">
        {schedules.length ? schedules.map((schedule) => (
          <Link key={schedule.id} href="/dashboard/exams/schedules" className="flex items-center justify-between p-4 active:bg-[#F8FAFC] hover:bg-slate-50 transition">
            <div className="min-w-0">
              <p className="text-[14px] font-semibold text-[#1E293B] truncate">{schedule.title}</p>
              <p className="text-[12px] text-[#64748B] truncate mt-0.5">{formatJakartaDate(schedule.startAt as string)} - {formatJakartaTime(schedule.startAt as string)}</p>
            </div>
            <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700 ml-3">
              {schedule.participantCount} peserta
            </span>
          </Link>
        )) : <div className="p-6 text-center text-[13px] text-[#64748B]">Belum ada jadwal ujian mendatang.</div>}
      </div>
    </div>
  );
}

function ExamReadinessWidget({ readiness }: { readiness: AdminOperationalDashboardData["examReadiness"] }) {
  const items = [
    { label: "Jadwal Siap Digunakan", value: readiness.ready, href: "/dashboard/exams/schedules?readiness=ready", color: "text-emerald-700 bg-emerald-50" },
    { label: "Perlu Kelengkapan", value: readiness.warning, href: "/dashboard/exams/schedules?readiness=warning", color: "text-amber-700 bg-amber-50" },
    { label: "Belum Lengkap (Diblokir)", value: readiness.blocked, href: "/dashboard/exams/schedules?readiness=blocked", color: "text-red-700 bg-red-50" },
  ];
  return (
    <div className="space-y-2">
      <h2 className="text-[16px] font-semibold text-[#1E293B] px-1">Kesiapan Pelaksanaan Ujian</h2>
      <div className="md-card-elevated divide-y divide-[#F1F5F9] overflow-hidden">
        {items.map((item) => (
          <Link key={item.label} href={item.href} className="flex items-center justify-between p-3.5 active:bg-[#F8FAFC] hover:bg-slate-50 transition">
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

interface ProctorDashboardOverviewProps {
  displayName: string;
  summary: Awaited<ReturnType<typeof getProctorOperationalSummary>>;
}

function ProctorDashboardOverview({ displayName, summary }: ProctorDashboardOverviewProps) {
  const firstName = displayName.split(" ")[0] ?? displayName;

  const stats = [
    { title: "Ujian Aktif", value: String(summary.activeSchedules.length), description: "Sesi ujian yang sedang diawasi.", href: "/dashboard/proctor/monitoring", icon: Activity },
    { title: "Jadwal Mendatang", value: String(summary.upcomingSchedules.length), description: "Ujian berikutnya hari ini.", href: "/dashboard/proctor/schedules", icon: CalendarDays },
    { title: "Sedang Mengerjakan", value: String(summary.inProgress), description: "Peserta aktif dalam ruangan.", href: "/dashboard/proctor/monitoring?status=in_progress", icon: Users },
    { title: "Sudah Selesai", value: String(summary.submitted), description: "Peserta yang telah submit.", href: "/dashboard/proctor/monitoring?status=submitted", icon: CheckCircle2 },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-safe">
      {/* Proctor Hero Banner */}
      <section className="rounded-3xl bg-[#2563EB] p-6 text-white shadow-lg relative overflow-hidden">
        <div className="pointer-events-none absolute right-0 top-0 size-40 rounded-full bg-white/10" />
        <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[13px] font-semibold text-blue-200 uppercase tracking-wider">Dashboard Pengawas</p>
            <h1 className="mt-1 text-[24px] font-bold leading-tight">Halo, {firstName}</h1>
            <p className="mt-2 text-[14px] text-blue-100 max-w-md">Pantau peserta, kelola token, dan tangani kendala teknis ujian secara langsung.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:w-auto">
            <Link href="/dashboard/proctor/monitoring" className="flex h-11 items-center justify-center gap-2 rounded-full bg-white px-5 text-[14px] font-semibold text-[#2563EB] active:scale-[0.97] transition-transform shadow-sm hover:bg-slate-50">
              <Activity className="size-4" /> Live Monitoring
            </Link>
            <Link href="/dashboard/proctor/tokens" className="flex h-11 items-center justify-center gap-2 rounded-full bg-blue-700 px-5 text-[14px] font-semibold text-white active:scale-[0.97] transition-transform border border-blue-600 hover:bg-blue-800">
              <KeyRound className="size-4" /> Token Ujian
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
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

      {/* Active Schedules or Upcoming */}
      <section className="space-y-3">
        <h2 className="text-[16px] font-semibold text-[#1E293B] px-1">Sesi Ujian yang Diawasi</h2>
        <div className="md-card-elevated divide-y divide-[#F1F5F9] overflow-hidden">
          {summary.activeSchedules.length > 0 ? (
            summary.activeSchedules.map((schedule) => (
              <div key={schedule.id} className="p-4 sm:flex sm:items-center sm:justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <h3 className="text-[15px] font-semibold text-[#1E293B]">{schedule.title}</h3>
                  </div>
                  <p className="mt-1 text-[13px] text-[#64748B]">
                    Token: <strong className="text-[#0F172A] tracking-wider">{schedule.access_token || "-"}</strong> - Peserta: {schedule.exam_participants?.length ?? 0} siswa
                  </p>
                </div>
                <Link
                  href={`/dashboard/proctor/monitoring?schedule_id=${schedule.id}`}
                  className="mt-3 flex h-10 w-full sm:w-auto items-center justify-center gap-1.5 rounded-full bg-[#2563EB] px-5 text-[13px] font-semibold text-white hover:bg-blue-700 transition-colors"
                >
                  <span>Pantau Ruangan</span>
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            ))
          ) : summary.upcomingSchedules.length > 0 ? (
            summary.upcomingSchedules.map((schedule) => (
              <div key={schedule.id} className="p-4 sm:flex sm:items-center sm:justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="text-[15px] font-semibold text-[#1E293B]">{schedule.title}</h3>
                  <p className="mt-1 text-[13px] text-[#64748B]">
                    Mulai: {formatJakartaDate(schedule.start_at as string)} - {formatJakartaTime(schedule.start_at as string)}
                  </p>
                </div>
                <Link
                  href="/dashboard/proctor/schedules"
                  className="mt-3 flex h-10 w-full sm:w-auto items-center justify-center rounded-full bg-[#F1F5F9] px-4 text-[13px] font-semibold text-[#1E293B] hover:bg-[#E2E8F0]"
                >
                  Detail Jadwal
                </Link>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-[13px] text-[#64748B]">
              Belum ada sesi pengawasan ujian aktif atau terjadwal saat ini.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
