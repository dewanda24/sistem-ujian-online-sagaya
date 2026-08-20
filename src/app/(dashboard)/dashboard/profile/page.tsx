import {
  BookOpen,
  GraduationCap,
  KeyRound,
  Layers,
  Phone,
  School,
  Shield,
  ShieldCheck,
  User,
  Users,
} from "lucide-react";

import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { SubmitButton } from "@/components/dashboard/submit-button";
import { ActionToast } from "@/components/master-data/action-toast";
import {
  changePasswordAction,
  saveProfileSettingsAction,
} from "@/features/profile/actions";
import { getProfileSettings } from "@/features/profile/queries";
import { LogoutButton } from "@/features/auth/components/logout-button";

type PageProps = {
  searchParams: Promise<{
    status?: string;
    message?: string;
  }>;
};

export const metadata = {
  title: "Profil Pengguna | Sistem Ujian Online CBT",
  description: "Kelola data profil, informasi akademik, penugasan mengajar, dan keamanan akun.",
};

export default async function ProfilePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { user, profile, teacherSubjects, teacherStats } =
    await getProfileSettings();

  const isTeacher = user.roles?.name === "teacher";
  const roleLabel = user.roles?.label ?? user.roles?.name ?? "Pengguna";

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-12">
      <ActionToast status={params.status} message={params.message} />

      <DashboardPageHeader
        title="Profil & Akun Pengguna"
        description="Kelola informasi identitas akun, penugasan mengajar, dan pengaturan kata sandi."
      />

      {/* Hero Profile Overview Card */}
      <section className="relative overflow-hidden rounded-3xl bg-linear-to-r from-blue-700 via-blue-600 to-indigo-700 p-6 text-white shadow-lg sm:p-8">
        <div className="pointer-events-none absolute -right-8 -top-8 size-48 rounded-full bg-white/10 blur-2xl" />

        <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-2xl font-bold uppercase backdrop-blur-md">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name || user.username}
                  className="size-16 rounded-2xl object-cover"
                />
              ) : (
                (profile.full_name || user.username).slice(0, 2)
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight sm:text-2xl">
                  {profile.full_name || user.username}
                </h1>
                <span className="inline-flex items-center rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
                  {roleLabel}
                </span>
              </div>
              <p className="mt-1 text-xs text-blue-100 sm:text-sm">
                @{user.username} • {user.email}
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-blue-200">
                <School className="size-3.5" />
                <span>{user.schoolName}</span>
                {profile.nip ? <span>• NIP: {profile.nip}</span> : null}
                {profile.nisn ? <span>• NISN: {profile.nisn}</span> : null}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-400/40 bg-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-100 backdrop-blur-md">
              <ShieldCheck className="size-4 text-emerald-300" />
              <span>Akun Aktif</span>
            </span>
          </div>
        </div>
      </section>

      {/* Teacher Specific Section: Assigned Subjects & Teaching Stats */}
      {isTeacher ? (
        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <BookOpen className="size-5" />
              </span>
              <div>
                <p className="text-xs font-medium text-slate-500">Soal Dibuat</p>
                <p className="text-xl font-black text-slate-900 leading-tight">
                  {teacherStats.totalQuestions} Butir
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Layers className="size-5" />
              </span>
              <div>
                <p className="text-xs font-medium text-slate-500">Paket Ujian</p>
                <p className="text-xl font-black text-slate-900 leading-tight">
                  {teacherStats.totalPackages} Paket
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <GraduationCap className="size-5" />
              </span>
              <div>
                <p className="text-xs font-medium text-slate-500">Mapel Diampu</p>
                <p className="text-xl font-black text-slate-900 leading-tight">
                  {teacherSubjects.length} Mapel
                </p>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* Teacher Teaching Assignments Card */}
      {isTeacher && teacherSubjects.length > 0 ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Mata Pelajaran yang Diampu
              </h2>
              <p className="text-xs text-slate-500">
                Mata pelajaran yang terhubung ke akun pengajar Anda.
              </p>
            </div>
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700">
              {teacherSubjects.length} Mata Pelajaran
            </span>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {teacherSubjects.map((sub) => (
              <div
                key={sub.id}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2 text-xs font-semibold text-slate-800"
              >
                <BookOpen className="size-3.5 text-blue-600" />
                <span>{sub.subjectName}</span>
                <span className="rounded bg-white px-1.5 py-0.5 text-[10px] font-mono text-slate-500 border border-slate-200">
                  {sub.subjectCode}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Settings Grid: Profile Update & Change Password */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Form Update Data Diri */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <User className="size-5 text-blue-600" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Perbarui Informasi Profil
              </h2>
              <p className="text-xs text-slate-500">
                Ubah nama lengkap, nomor telepon, dan foto avatar.
              </p>
            </div>
          </div>

          <form action={saveProfileSettingsAction} className="mt-4 space-y-4">
            <label className="block space-y-1 text-xs">
              <span className="font-semibold text-slate-700">Nama Lengkap</span>
              <input
                name="full_name"
                defaultValue={profile.full_name ?? ""}
                required
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </label>

            <label className="block space-y-1 text-xs">
              <span className="font-semibold text-slate-700">
                Nomor WhatsApp / Telepon
              </span>
              <input
                name="phone"
                defaultValue={profile.phone ?? ""}
                placeholder="Contoh: 081234567890"
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </label>

            <label className="block space-y-1 text-xs">
              <span className="font-semibold text-slate-700">URL Foto Avatar (Opsional)</span>
              <input
                name="avatar_url"
                defaultValue={profile.avatar_url ?? ""}
                placeholder="https://..."
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </label>

            <div className="pt-2">
              <SubmitButton
                className="h-10 w-full rounded-xl bg-blue-600 text-xs font-bold text-white shadow-sm hover:bg-blue-700"
                loadingText="Menyimpan..."
              >
                Simpan Perubahan Profil
              </SubmitButton>
            </div>
          </form>
        </div>

        {/* Form Ganti Kata Sandi */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <KeyRound className="size-5 text-amber-600" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Ubah Kata Sandi (Password)
              </h2>
              <p className="text-xs text-slate-500">
                Ganti kata sandi akun Anda untuk menjaga keamanan.
              </p>
            </div>
          </div>

          <form action={changePasswordAction} className="mt-4 space-y-4">
            <label className="block space-y-1 text-xs">
              <span className="font-semibold text-slate-700">Kata Sandi Baru</span>
              <input
                type="password"
                name="new_password"
                required
                minLength={6}
                placeholder="Minimal 6 karakter"
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </label>

            <label className="block space-y-1 text-xs">
              <span className="font-semibold text-slate-700">
                Ulangi Kata Sandi Baru
              </span>
              <input
                type="password"
                name="confirm_password"
                required
                minLength={6}
                placeholder="Ketik ulang kata sandi baru"
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </label>

            <div className="pt-8">
              <SubmitButton
                className="h-10 w-full rounded-xl bg-amber-600 text-xs font-bold text-white shadow-sm hover:bg-amber-700"
                loadingText="Mengubah Password..."
              >
                Ubah Kata Sandi Sekarang
              </SubmitButton>
            </div>
          </form>
        </div>
      </div>

      {/* Logout & Session Management */}
      <div className="rounded-2xl border border-rose-200/80 bg-rose-50/60 p-5 shadow-2xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-rose-900">Keluar dari Sesi</h3>
            <p className="text-xs text-rose-700/80">
              Akhiri sesi login akun Anda secara aman pada perangkat komputer ini.
            </p>
          </div>
          <LogoutButton />
        </div>
      </div>
    </div>
  );
}
