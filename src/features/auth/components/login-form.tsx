"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  HelpCircle,
  Laptop,
  LifeBuoy,
  Loader2,
  LockKeyhole,
  PhoneCall,
  RefreshCw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  UserRound,
  Wifi,
  X,
} from "lucide-react";

import { SagayaLogo } from "@/components/common/sagaya-logo";
import { SplashScreen } from "@/features/auth/components/splash-screen";
import { WelcomeSessionScreen } from "@/features/auth/components/welcome-session-screen";
import { createClient } from "@/lib/supabase/client";
import {
  fetchUserSessionDataAction,
  resolveUserIdentifierAction,
  type UserSessionInfo,
} from "@/features/auth/actions/login-action";

type LoginFormProps = {
  sessionMessage?: string;
};

export function LoginForm({ sessionMessage }: LoginFormProps) {
  // Splash Screen only shows on initial fresh app load, NEVER when sessionMessage/logout exists
  const [showSplash, setShowSplash] = useState(false);

  useEffect(() => {
    if (!sessionMessage) {
      const hasShown = sessionStorage.getItem("sagaya_splash_shown");
      if (!hasShown) {
        setShowSplash(true);
        sessionStorage.setItem("sagaya_splash_shown", "1");
      }
    }
  }, [sessionMessage]);

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<string | null>(null);

  // Welcome session state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userSession, setUserSession] = useState<UserSessionInfo | undefined>(undefined);
  const [redirectTo, setRedirectTo] = useState<string>("/dashboard");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);
    setErrorType(null);

    try {
      const trimmedIdentifier = identifier.trim();
      const trimmedPassword = password.trim();

      if (!trimmedIdentifier || !trimmedPassword) {
        setErrorMessage("Silakan isi username/email dan kata sandi.");
        setErrorType("validation");
        setIsSubmitting(false);
        return;
      }

      // 1. Resolve identifier (username -> email)
      const resolved = await resolveUserIdentifierAction(trimmedIdentifier);

      if (!resolved.exists || !resolved.email) {
        setErrorType("user-not-found");
        setErrorMessage("Akun tidak ditemukan. Periksa kembali username/email Anda.");
        setIsSubmitting(false);
        return;
      }

      // 2. Sign in via client-side Supabase client
      const supabase = createClient();
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: resolved.email,
        password: trimmedPassword,
      });

      if (authError || !authData.user) {
        setErrorType("wrong-password");
        setErrorMessage("Kata sandi yang Anda masukkan salah.");
        setIsSubmitting(false);
        return;
      }

      // 3. Fetch user session details (role, school, profile, class)
      const sessionResult = await fetchUserSessionDataAction(authData.user.id);

      if (!sessionResult.ok || !sessionResult.userSession) {
        await supabase.auth.signOut();
        setErrorType(sessionResult.error || "no-role");
        setErrorMessage(
          sessionResult.message || "Akun belum memiliki akses. Hubungi operator sekolah.",
        );
        setIsSubmitting(false);
        return;
      }

      // 4. Set session details & trigger Welcome Session Screen
      setUserSession(sessionResult.userSession);
      setRedirectTo(sessionResult.redirectTo || "/dashboard");
      setIsSubmitting(false);
      setIsLoggedIn(true);
    } catch (error) {
      console.error("Login submission error:", error);
      setErrorType("network");
      setErrorMessage("Koneksi bermasalah. Periksa koneksi internet Anda lalu coba lagi.");
      setIsSubmitting(false);
    }
  };

  const handleProceedToDashboard = () => {
    window.location.href = redirectTo;
  };

  const isWrongPassword = errorType === "wrong-password";
  const isUserNotFound = errorType === "user-not-found";

  return (
    <>
      {/* ========================================================= */}
      {/* 1. INITIAL SPLASH SCREEN (POIN 2)                          */}
      {/* ========================================================= */}
      {showSplash && (
        <SplashScreen
          autoDismissMs={1800}
          onComplete={() => setShowSplash(false)}
        />
      )}

      {/* ========================================================= */}
      {/* 2. MAIN LOGIN & AUTH VIEW                                 */}
      {/* ========================================================= */}
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center justify-center py-6">
        <div className="grid w-full items-center gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          {/* ========================================================= */}
          {/* LEFT SIDE: Brand Identity, Objectives & Security Info      */}
          {/* ========================================================= */}
          <section className="hidden space-y-6 lg:block">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/80 px-4 py-1.5 text-xs font-bold text-[#2563EB] shadow-2xs">
                <span className="rounded-full bg-[#2563EB] px-2 py-0.5 text-[10px] font-extrabold uppercase text-white">
                  SAGAYA
                </span>
                <span>DIGITAL EXAM • SISTEM UJIAN ONLINE</span>
              </div>

              <h1 className="text-3xl font-black tracking-tight text-[#0F172A] sm:text-4xl leading-tight">
                Platform Ujian Sekolah Digital yang Tertata, Cepat, dan Aman.
              </h1>

              <p className="text-sm leading-relaxed text-[#64748B]">
                Masuk menggunakan akun yang diberikan oleh pihak sekolah untuk mengakses jadwal ujian, pengerjaan soal CBT, pengawasan ruang ujian, dan laporan nilai.
              </p>
            </div>

            {/* Objectives 4-Item Grid */}
            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-2xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B] mb-3">
                Keunggulan Sistem
              </h3>
              <div className="grid grid-cols-2 gap-3 text-xs font-semibold text-[#0F172A]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-[#2563EB]" />
                  <span>Akses cepat & aman</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-[#2563EB]" />
                  <span>Informasi jelas untuk siswa</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-[#2563EB]" />
                  <span>Feedback yang informatif</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-[#2563EB]" />
                  <span>Tampilan modern & konsisten</span>
                </div>
              </div>
            </div>

            {/* Aman & Terpercaya Banner */}
            <div className="flex items-start gap-3.5 rounded-2xl border border-blue-100 bg-blue-50/70 p-4 text-[#1E3A8A] shadow-2xs">
              <ShieldCheck className="size-6 text-[#2563EB] shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-[#1E3A8A]">Aman & Terpercaya</h4>
                <p className="text-xs text-[#475569] mt-0.5 leading-relaxed">
                  Data ujian dan jawaban siswa dilindungi dengan enkripsi berstandar tinggi dan penyimpanan otomatis berkala.
                </p>
              </div>
            </div>

            {/* Security Features 4-Box Grid */}
            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-2xs">
              <div className="mb-3 flex items-center gap-2">
                <Shield className="size-4 text-[#2563EB]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#0F172A]">
                  Fitur Keamanan Login
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="space-y-0.5">
                  <p className="font-bold text-[#0F172A] flex items-center gap-1.5">
                    <ShieldCheck className="size-3.5 text-blue-600" />
                    Enkripsi Data
                  </p>
                  <p className="text-[11px] text-[#64748B] leading-relaxed">
                    Semua data dienkripsi saat dikirim dan disimpan di server.
                  </p>
                </div>
                <div className="space-y-0.5">
                  <p className="font-bold text-[#0F172A] flex items-center gap-1.5">
                    <LockKeyhole className="size-3.5 text-blue-600" />
                    Sesi Aman
                  </p>
                  <p className="text-[11px] text-[#64748B] leading-relaxed">
                    Otomatis logout jika tidak aktif dalam jangka waktu tertentu.
                  </p>
                </div>
                <div className="space-y-0.5">
                  <p className="font-bold text-[#0F172A] flex items-center gap-1.5">
                    <Laptop className="size-3.5 text-blue-600" />
                    Perangkat Terpercaya
                  </p>
                  <p className="text-[11px] text-[#64748B] leading-relaxed">
                    Login hanya dapat dilakukan pada perangkat yang diizinkan sekolah.
                  </p>
                </div>
                <div className="space-y-0.5">
                  <p className="font-bold text-[#0F172A] flex items-center gap-1.5">
                    <ShieldAlert className="size-3.5 text-blue-600" />
                    Proteksi Ujian
                  </p>
                  <p className="text-[11px] text-[#64748B] leading-relaxed">
                    Sistem siap melindungi selama mode ujian berlangsung.
                  </p>
                </div>
              </div>
            </div>

            {/* Tips Untuk Siswa */}
            <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-4 shadow-2xs">
              <div className="mb-2.5 flex items-center gap-2">
                <Sparkles className="size-4 text-amber-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-950">
                  Tips Untuk Siswa
                </h3>
              </div>
              <div className="space-y-2 text-xs text-amber-900">
                <div className="flex items-start gap-2">
                  <Wifi className="size-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <span>Pastikan koneksi internet stabil sebelum login.</span>
                </div>
                <div className="flex items-start gap-2">
                  <LockKeyhole className="size-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <span>Jangan bagikan akun dan kata sandi Anda kepada siapapun.</span>
                </div>
                <div className="flex items-start gap-2">
                  <RefreshCw className="size-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <span>Logout setelah selesai menggunakan sistem untuk menjaga privasi.</span>
                </div>
              </div>
            </div>
          </section>

          {/* ========================================================= */}
          {/* RIGHT SIDE: Interactive Login Form OR Welcome Screen (POIN 3) */}
          {/* ========================================================= */}
          <div className="mx-auto w-full max-w-md">
            {isLoggedIn && userSession ? (
              /* TRANSISI SETELAH AUTENTIKASI BERHASIL (POIN 3) */
              <WelcomeSessionScreen
                session={userSession}
                onProceed={handleProceedToDashboard}
              />
            ) : (
              /* FORM LOGIN PRODUKSI */
              <div className="w-full rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-xl sm:p-8">
                {/* Sagaya Brand Emblem & Heading */}
                <div className="mb-6 text-center">
                  <div className="mb-3 flex justify-center">
                    <SagayaLogo size="md" variant="full" />
                  </div>
                  <h2 className="text-xl font-bold tracking-tight text-[#0F172A]">
                    Masuk ke Akun Anda
                  </h2>
                  <p className="mt-1 text-xs text-[#64748B]">
                    Gunakan akun yang diberikan oleh pihak sekolah.
                  </p>
                </div>

                {/* Session Error / Notification Alert */}
                {sessionMessage && (
                  <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs leading-relaxed text-blue-900">
                    <AlertCircle className="size-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>{sessionMessage}</span>
                  </div>
                )}

                {/* Main Interactive Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Username atau Email */}
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-[#0F172A]">
                      Username atau Email
                    </label>
                    <div className="relative">
                      <UserRound className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#94A3B8]" />
                      <input
                        name="identifier"
                        type="text"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        autoComplete="username"
                        autoFocus
                        required
                        disabled={isSubmitting}
                        placeholder="Username atau Email"
                        className={`h-11 w-full rounded-xl border bg-white pl-10 pr-3 text-sm outline-none transition focus:ring-3 ${
                          isUserNotFound
                            ? "border-amber-400 focus:border-amber-500 focus:ring-amber-100 bg-amber-50/20"
                            : "border-[#CBD5E1] focus:border-[#2563EB] focus:ring-blue-100"
                        }`}
                      />
                    </div>
                  </div>

                  {/* Kata Sandi */}
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-[#0F172A]">
                      Kata Sandi
                    </label>
                    <div className="relative">
                      <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#94A3B8]" />
                      <input
                        name="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                        required
                        disabled={isSubmitting}
                        placeholder="Kata Sandi"
                        className={`h-11 w-full rounded-xl border bg-white pl-10 pr-11 text-sm outline-none transition focus:ring-3 ${
                          isWrongPassword
                            ? "border-rose-400 focus:border-rose-500 focus:ring-rose-100 bg-rose-50/20"
                            : "border-[#CBD5E1] focus:border-[#2563EB] focus:ring-blue-100"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        disabled={isSubmitting}
                        aria-label={
                          showPassword
                            ? "Sembunyikan kata sandi"
                            : "Tampilkan kata sandi"
                        }
                        className="absolute right-2.5 top-1/2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-lg text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A]"
                      >
                        {showPassword ? (
                          <EyeOff className="size-4" />
                        ) : (
                          <Eye className="size-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Specific Inline Error Messages */}
                  {errorMessage && (
                    <div
                      className={`flex items-start gap-2 rounded-xl p-3 text-xs font-medium ${
                        isWrongPassword
                          ? "border border-rose-200 bg-rose-50 text-rose-800"
                          : "border border-amber-200 bg-amber-50 text-amber-900"
                      }`}
                      role="alert"
                    >
                      <AlertCircle className="size-4 shrink-0 mt-0.5 text-current" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  {/* Options: Remember Me & Forgot Password */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-[#64748B] select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="size-4 rounded border-slate-300 text-[#2563EB] focus:ring-[#2563EB]"
                      />
                      <span className="font-medium text-[#0F172A]">Ingat saya</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => setIsHelpOpen(true)}
                      className="font-semibold text-[#2563EB] hover:text-blue-700 hover:underline"
                    >
                      Lupa kata sandi?
                    </button>
                  </div>

                  {/* Primary Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-4 text-sm font-bold text-white shadow-md shadow-blue-500/20 transition-all duration-150 active:scale-98 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          <span>Memverifikasi akun...</span>
                        </>
                      ) : (
                        <span>Masuk ke Sistem</span>
                      )}
                    </button>
                  </div>
                </form>

                {/* Help Card Footer */}
                <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-3 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-xs text-[#64748B]">
                    <HelpCircle className="size-3.5 text-[#2563EB]" />
                    <span>Butuh bantuan?</span>
                    <button
                      type="button"
                      onClick={() => setIsHelpOpen(true)}
                      className="font-bold text-[#2563EB] hover:text-blue-700 hover:underline"
                    >
                      Hubungi Operator Sekolah
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* OPERATOR SUPPORT MODAL (Help Dialog)                      */}
        {/* ========================================================= */}
        {isHelpOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
                <div className="flex items-center gap-2">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-blue-50 text-[#2563EB]">
                    <LifeBuoy className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#0F172A]">
                      Bantuan Operator Sekolah
                    </h3>
                    <p className="text-[11px] text-[#64748B]">
                      Layanan pemulihan kata sandi & kendala teknis
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsHelpOpen(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="size-5" />
                </button>
              </div>

              <div className="my-4 space-y-3 text-xs leading-relaxed text-[#475569]">
                <p>
                  Jika Anda lupa kata sandi atau mengalami kendala masuk ke akun, silakan hubungi tim proktor atau operator IT sekolah Anda:
                </p>

                <div className="space-y-2 rounded-2xl bg-slate-50 p-3.5 border border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-600">Unit Layanan:</span>
                    <span className="font-bold text-[#0F172A]">Ruang Proktor CBT</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-600">Jam Operasional:</span>
                    <span className="font-bold text-[#0F172A]">07.00 - 16.00 WIB</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-600">Kontak WhatsApp:</span>
                    <span className="font-bold text-[#2563EB]">+62 812-3456-7890</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsHelpOpen(false)}
                  className="flex-1 h-10 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={() => {
                    window.open("https://wa.me/6281234567890", "_blank");
                    setIsHelpOpen(false);
                  }}
                  className="flex-1 h-10 rounded-xl bg-[#2563EB] text-xs font-bold text-white hover:bg-blue-700 flex items-center justify-center gap-1.5"
                >
                  <PhoneCall className="size-3.5" />
                  Hubungi Operator
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
