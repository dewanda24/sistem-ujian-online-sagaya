"use client";

import { ArrowRight, CheckCircle, Clock, ShieldCheck, UserCheck } from "lucide-react";
import type { UserSessionInfo } from "@/features/auth/actions/login-action";

type WelcomeSessionScreenProps = {
  session?: UserSessionInfo;
  onProceed: () => void;
  className?: string;
};

export function WelcomeSessionScreen({
  session = {
    name: "Bara Disini",
    username: "bara@example.com",
    email: "bara@example.com",
    role: "student",
    roleLabel: "Siswa",
    className: "Kelas 9A",
    schoolName: "SMP 1 Sagaya",
    lastLoginFormatted: "16 Agustus 2026, 07.45",
    status: "Aktif",
  },
  onProceed,
  className = "",
}: WelcomeSessionScreenProps) {
  return (
    <div
      className={`relative flex min-h-[580px] w-full flex-col justify-between overflow-hidden rounded-3xl border border-[#E2E8F0] bg-[#F8FAFC] shadow-2xl ${className}`}
    >
      {/* Top Hero Dark Navy Section */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#07183D] via-[#0A1C4C] to-[#0E2A6E] px-6 pb-12 pt-6 text-white">
        {/* Subtle Background Glows */}
        <div className="pointer-events-none absolute right-0 top-0 size-48 rounded-full bg-blue-500/20 blur-2xl" />

        {/* Status Bar Mockup */}
        <div className="relative z-10 flex items-center justify-between text-xs font-semibold text-blue-200/80">
          <span>9:41</span>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px]">5G</span>
            <div className="h-2.5 w-5 rounded-xs border border-blue-200/80 p-0.5 flex items-center">
              <div className="h-full w-full rounded-2xs bg-blue-200/80" />
            </div>
          </div>
        </div>

        {/* Greeting Banner */}
        <div className="relative z-10 mt-6 space-y-1">
          <p className="text-xs font-medium text-blue-200/90">
            Selamat datang kembali!
          </p>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <span>{session.name || "Bara Disini"}</span>
            <span className="text-xl">👋</span>
          </h1>
        </div>
      </div>

      {/* Floating Profile Badge Card */}
      <div className="relative z-20 -mt-8 px-5">
        <div className="flex items-center gap-4 rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-md">
          {/* Avatar / Student Illustration */}
          <div className="relative flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-2xl font-bold text-white shadow-xs">
            {/* Student Avatar Emoji / Initials */}
            <span>👨‍🎓</span>
            <span className="absolute -bottom-1 -right-1 flex size-4 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-white">
              <span className="size-1.5 rounded-full bg-white" />
            </span>
          </div>

          {/* User Details */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-[#0F172A]">
                {session.roleLabel || "Siswa"}
              </span>
              <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-[#2563EB]">
                {session.role === "student" ? "Peserta Ujian" : "Terverifikasi"}
              </span>
            </div>
            <p className="text-xs text-[#64748B] truncate mt-0.5">
              {[session.className, session.schoolName || "SMP 1 Sagaya"]
                .filter(Boolean)
                .join(" • ")}
            </p>
          </div>
        </div>
      </div>

      {/* Body Information & Reminder */}
      <div className="flex-1 px-5 py-4 space-y-4">
        {/* Informasi Akun Card */}
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-2xs">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
            Informasi Akun
          </h2>

          <div className="mt-3 divide-y divide-[#F1F5F9] text-xs">
            {/* Username */}
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2 text-[#64748B]">
                <UserCheck className="size-3.5 text-[#94A3B8]" />
                <span>Username</span>
              </div>
              <span className="font-semibold text-[#0F172A] truncate max-w-[160px]">
                {session.username || session.email}
              </span>
            </div>

            {/* Peran */}
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2 text-[#64748B]">
                <ShieldCheck className="size-3.5 text-[#94A3B8]" />
                <span>Peran</span>
              </div>
              <span className="font-semibold text-[#0F172A]">
                {session.roleLabel || "Siswa"}
              </span>
            </div>

            {/* Login Terakhir */}
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2 text-[#64748B]">
                <Clock className="size-3.5 text-[#94A3B8]" />
                <span>Login Terakhir</span>
              </div>
              <span className="font-semibold text-[#0F172A]">
                {session.lastLoginFormatted}
              </span>
            </div>

            {/* Status Akun */}
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2 text-[#64748B]">
                <CheckCircle className="size-3.5 text-[#94A3B8]" />
                <span>Status Akun</span>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {session.status || "Aktif"}
              </span>
            </div>
          </div>
        </div>

        {/* Honest Exam Caution Notice Box */}
        <div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-3.5 text-[#1E3A8A]">
          <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
            <span className="text-xs">✨</span>
          </div>
          <p className="text-xs leading-relaxed font-medium">
            Pastikan Anda mengerjakan ujian dengan <strong>jujur</strong> dan{" "}
            <strong>bertanggung jawab</strong>.
          </p>
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-5 pt-0">
        <button
          type="button"
          onClick={onProceed}
          className="group flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#2563EB] px-4 text-sm font-bold text-white shadow-md shadow-blue-500/20 transition-all duration-150 active:scale-[0.98] hover:bg-blue-700"
        >
          <span>Lanjut ke Dashboard</span>
          <ArrowRight className="size-4 transition-transform duration-150 group-hover:translate-x-1" />
        </button>
      </div>
    </div>
  );
}
