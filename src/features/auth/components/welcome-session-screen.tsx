"use client";

import { useEffect, useState } from "react";
import {
  ArrowRight,
  CheckCircle,
  Clock,
  Loader2,
  ShieldCheck,
  Sparkles,
  UserCheck,
} from "lucide-react";
import type { UserSessionInfo } from "@/features/auth/actions/login-action";

type WelcomeSessionScreenProps = {
  session?: UserSessionInfo;
  onProceed: () => void;
  autoProceedMs?: number; // default 3000ms
  className?: string;
};

export function WelcomeSessionScreen({
  session = {
    name: "Pengguna",
    username: "user@example.com",
    email: "user@example.com",
    role: "student",
    roleLabel: "Siswa",
    className: "Kelas 9A",
    schoolName: "SMP 1 Sagaya",
    lastLoginFormatted: "18 Agustus 2026, 07.45",
    status: "Aktif",
  },
  onProceed,
  autoProceedMs = 3200,
  className = "",
}: WelcomeSessionScreenProps) {
  const [secondsLeft, setSecondsLeft] = useState(Math.ceil(autoProceedMs / 1000));
  const [isProceeding, setIsProceeding] = useState(false);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, Math.ceil((autoProceedMs - elapsed) / 1000));
      setSecondsLeft(remaining);

      if (elapsed >= autoProceedMs) {
        clearInterval(interval);
        handleProceed();
      }
    }, 200);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoProceedMs]);

  const handleProceed = () => {
    setIsProceeding(true);
    onProceed();
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "student":
        return "👨‍🎓";
      case "teacher":
        return "👨‍🏫";
      case "proctor":
        return "💻";
      case "principal":
        return "🏛️";
      case "admin":
      case "super_admin":
        return "🛡️";
      default:
        return "👤";
    }
  };

  const getRoleAdvice = (role: string) => {
    switch (role) {
      case "student":
        return "Pastikan Anda mengerjakan ujian dengan jujur, teliti, dan bertanggung jawab.";
      case "teacher":
        return "Selamat bertugas mengampu pembelajaran dan memantau evaluasi siswa.";
      case "proctor":
        return "Pastikan ruang ujian dalam kondisi tertib dan pantau token ujian aktif.";
      case "principal":
        return "Selamat datang untuk memantau ringkasan hasil dan laporan capaian sekolah.";
      case "admin":
      case "super_admin":
        return "Selamat mengelola operasional data, pengguna, dan jadwal ujian.";
      default:
        return "Selamat datang di sistem evaluasi dan ujian terpadu Sagaya CBT.";
    }
  };

  return (
    <div
      className={`relative flex min-h-[580px] w-full flex-col justify-between overflow-hidden rounded-3xl border border-[#E2E8F0] bg-[#F8FAFC] shadow-2xl animate-in fade-in zoom-in-95 duration-300 ${className}`}
    >
      {/* Top Hero Dark Navy Section */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#07183D] via-[#0A1C4C] to-[#0E2A6E] px-6 pb-12 pt-6 text-white">
        {/* Subtle Background Glows */}
        <div className="pointer-events-none absolute right-0 top-0 size-48 rounded-full bg-blue-500/20 blur-2xl" />

        {/* Top Status Bar */}
        <div className="relative z-10 flex items-center justify-between text-xs font-semibold text-blue-200/80">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-950/60 px-3 py-0.5 text-[11px] font-bold text-blue-200 border border-blue-400/20">
            <Sparkles className="size-3 text-blue-400" />
            <span>Autentikasi Berhasil</span>
          </div>
          <span className="text-[11px] text-blue-300/80 font-mono">
            {secondsLeft > 0 ? `Lanjut otomatis: ${secondsLeft}s` : "Mengalihkan..."}
          </span>
        </div>

        {/* Greeting Banner */}
        <div className="relative z-10 mt-5 space-y-1">
          <p className="text-xs font-medium text-blue-200/90">
            Selamat datang kembali,
          </p>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <span className="truncate">{session.name || session.username}</span>
            <span className="text-xl shrink-0">👋</span>
          </h1>
        </div>
      </div>

      {/* Floating Profile Badge Card */}
      <div className="relative z-20 -mt-8 px-5">
        <div className="flex items-center gap-4 rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-md">
          {/* Avatar / Role Illustration */}
          <div className="relative flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-2xl font-bold text-white shadow-xs">
            <span>{getRoleIcon(session.role)}</span>
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
            Informasi Sesi Akun
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
                <span>Status Sesi</span>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {session.status || "Aktif"}
              </span>
            </div>
          </div>
        </div>

        {/* Motivational / Caution Notice Box */}
        <div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-3.5 text-[#1E3A8A]">
          <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
            <span className="text-xs">✨</span>
          </div>
          <p className="text-xs leading-relaxed font-medium">
            {getRoleAdvice(session.role)}
          </p>
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-5 pt-0">
        <button
          type="button"
          onClick={handleProceed}
          disabled={isProceeding}
          className="group flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#2563EB] px-4 text-sm font-bold text-white shadow-md shadow-blue-500/20 transition-all duration-150 active:scale-98 hover:bg-blue-700 disabled:opacity-80"
        >
          {isProceeding ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              <span>Membuka Dashboard...</span>
            </>
          ) : (
            <>
              <span>Lanjut ke Dashboard</span>
              <ArrowRight className="size-4 transition-transform duration-150 group-hover:translate-x-1" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
