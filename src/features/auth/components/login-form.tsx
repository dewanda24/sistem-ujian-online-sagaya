"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  UserRound,
  X,
  LifeBuoy,
  PhoneCall,
} from "lucide-react";

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
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<string | null>(null);
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
        setErrorMessage("Silakan isi username dan kata sandi.");
        setErrorType("validation");
        setIsSubmitting(false);
        return;
      }

      const resolved = await resolveUserIdentifierAction(trimmedIdentifier);
      if (!resolved.exists || !resolved.email) {
        setErrorType("user-not-found");
        setErrorMessage("Akun tidak ditemukan. Periksa kembali username atau email kamu.");
        setIsSubmitting(false);
        return;
      }

      const supabase = createClient();
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: resolved.email,
        password: trimmedPassword,
      });

      if (authError || !authData.user) {
        setErrorType("wrong-password");
        setErrorMessage("Kata sandi yang kamu masukkan salah.");
        setIsSubmitting(false);
        return;
      }

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

      setUserSession(sessionResult.userSession);
      setRedirectTo(sessionResult.redirectTo || "/dashboard");
      setIsSubmitting(false);
      setIsLoggedIn(true);
    } catch {
      setErrorType("network");
      setErrorMessage("Koneksi bermasalah. Periksa internet kamu lalu coba lagi.");
      setIsSubmitting(false);
    }
  };

  const handleProceedToDashboard = () => {
    window.location.href = redirectTo;
  };

  if (showSplash) {
    return <SplashScreen autoDismissMs={1800} onComplete={() => setShowSplash(false)} />;
  }

  if (isLoggedIn && userSession) {
    return (
      <WelcomeSessionScreen
        session={userSession}
        onProceed={handleProceedToDashboard}
      />
    );
  }

  return (
    <>
      {/* ── MOBILE: Full-screen Android login layout ── */}
      <div className="min-h-screen flex flex-col lg:hidden">
        {/* Hero / Brand area */}
        <div className="relative flex flex-col items-center justify-center bg-[#2563EB] px-8 pt-16 pb-10 text-white flex-shrink-0"
          style={{ minHeight: "38vh" }}>
          {/* Subtle pattern */}
          <div className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: "radial-gradient(circle at 80% 20%, #FFFFFF 0%, transparent 50%), radial-gradient(circle at 20% 80%, #FFFFFF 0%, transparent 50%)",
            }}
          />
          <div className="relative z-10 flex flex-col items-center gap-4">
            <div className="flex size-16 items-center justify-center rounded-[22px] bg-white/20 backdrop-blur-sm">
              <span className="text-3xl font-black text-white tracking-tight">S</span>
            </div>
            <div className="text-center">
              <p className="text-[22px] font-bold tracking-tight">Sagaya CBT</p>
              <p className="text-[14px] text-blue-100 mt-1">Sistem Ujian Online</p>
            </div>
          </div>
        </div>

        {/* Form card — slides up over the hero */}
        <div className="flex-1 bg-white rounded-t-[28px] -mt-5 px-6 pt-8 pb-6 shadow-[0_-4px_24px_rgba(0,0,0,0.08)]">
          <h1 className="text-[22px] font-bold text-[#1E293B] mb-2">Masuk ke Akun</h1>
          <p className="text-[14px] text-[#64748B] mb-6">Gunakan akun yang diberikan sekolah</p>

          {/* Session message banner */}
          {sessionMessage && (
            <div className="flex items-start gap-3 rounded-2xl bg-[#EFF6FF] border border-blue-200 px-4 py-3 mb-5 text-[14px] text-blue-800">
              <AlertCircle className="size-5 shrink-0 text-blue-600 mt-0.5" />
              <span>{sessionMessage}</span>
            </div>
          )}

          {/* Error banner */}
          {errorMessage && (
            <div className="flex items-start gap-3 rounded-2xl bg-[#FEE2E2] border border-red-200 px-4 py-3 mb-5 text-[14px] text-red-800">
              <AlertCircle className="size-5 shrink-0 text-red-600 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username field */}
            <div>
              <label className="block text-[14px] font-semibold text-[#1E293B] mb-2">
                Username atau Email
              </label>
              <div className="relative">
                <UserRound className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-[#94A3B8] pointer-events-none" />
                <input
                  name="identifier"
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  autoComplete="username"
                  autoFocus
                  required
                  disabled={isSubmitting}
                  placeholder="Masukkan username atau email"
                  className="w-full h-[52px] rounded-2xl border-[1.5px] border-[#CBD5E1] bg-white pl-12 pr-4 text-[15px] text-[#1E293B] outline-none transition-all focus:border-[#2563EB] focus:border-2 placeholder:text-[#94A3B8]"
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <label className="block text-[14px] font-semibold text-[#1E293B] mb-2">
                Kata Sandi
              </label>
              <div className="relative">
                <LockKeyhole className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-[#94A3B8] pointer-events-none" />
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  disabled={isSubmitting}
                  placeholder="Masukkan kata sandi"
                  className="w-full h-[52px] rounded-2xl border-[1.5px] border-[#CBD5E1] bg-white pl-12 pr-12 text-[15px] text-[#1E293B] outline-none transition-all focus:border-[#2563EB] focus:border-2 placeholder:text-[#94A3B8]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  disabled={isSubmitting}
                  aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                  className="absolute right-2 top-1/2 -translate-y-1/2 md-icon-btn size-10"
                >
                  {showPassword ? <EyeOff className="size-5 text-[#64748B]" /> : <Eye className="size-5 text-[#64748B]" />}
                </button>
              </div>
            </div>

            {/* Submit button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-[52px] rounded-full bg-[#2563EB] text-white text-[15px] font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.97] disabled:opacity-50"
              >
                {isSubmitting ? (
                  <><Loader2 className="size-5 animate-spin" /><span>Memverifikasi...</span></>
                ) : (
                  <span>Masuk</span>
                )}
              </button>
            </div>
          </form>

          {/* Help link */}
          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={() => setIsHelpOpen(true)}
              className="text-[14px] text-[#2563EB] font-semibold"
            >
              Lupa kata sandi? Hubungi operator
            </button>
          </div>
        </div>
      </div>

      {/* ── DESKTOP: 2-column layout ── */}
      <div className="hidden lg:flex min-h-screen items-center justify-center px-8 py-12">
        <div className="grid w-full max-w-5xl items-center gap-12 lg:grid-cols-[1.2fr_0.8fr]">
          {/* Left: Brand */}
          <section className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="flex size-14 items-center justify-center rounded-[18px] bg-[#2563EB]">
                <span className="text-2xl font-black text-white">S</span>
              </div>
              <div>
                <p className="text-[20px] font-bold text-[#1E293B]">Sagaya CBT</p>
                <p className="text-[14px] text-[#64748B]">Sistem Ujian Online</p>
              </div>
            </div>
            <h1 className="text-[32px] font-bold tracking-tight text-[#1E293B] leading-tight">
              Platform Ujian Sekolah Digital yang Tertata dan Aman.
            </h1>
            <p className="text-[15px] leading-relaxed text-[#64748B]">
              Masuk menggunakan akun yang diberikan oleh sekolah untuk mengakses jadwal ujian, pengerjaan soal CBT, dan laporan nilai.
            </p>
            <ul className="space-y-3 text-[14px] font-medium text-[#1E293B]">
              {["Akses cepat dan aman", "Penyimpanan jawaban otomatis", "Monitoring real-time untuk pengawas", "Laporan nilai yang jelas"].map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <span className="flex size-6 items-center justify-center rounded-full bg-[#DBEAFE] text-[#2563EB]">
                    <svg className="size-3.5" viewBox="0 0 12 12" fill="currentColor">
                      <path d="M1 6l4 4 6-7" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          {/* Right: Form card */}
          <div className="md-card-elevated p-8">
            <h2 className="text-[22px] font-bold text-[#1E293B] mb-1">Masuk ke Akun</h2>
            <p className="text-[14px] text-[#64748B] mb-6">Gunakan akun yang diberikan sekolah</p>

            {sessionMessage && (
              <div className="flex items-start gap-3 rounded-2xl bg-[#EFF6FF] border border-blue-200 px-4 py-3 mb-5 text-[14px] text-blue-800">
                <AlertCircle className="size-5 shrink-0 text-blue-600 mt-0.5" />
                <span>{sessionMessage}</span>
              </div>
            )}
            {errorMessage && (
              <div className="flex items-start gap-3 rounded-2xl bg-[#FEE2E2] border border-red-200 px-4 py-3 mb-5 text-[14px] text-red-800">
                <AlertCircle className="size-5 shrink-0 text-red-600 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[14px] font-semibold text-[#1E293B] mb-2">Username atau Email</label>
                <div className="relative">
                  <UserRound className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-[#94A3B8] pointer-events-none" />
                  <input
                    name="identifier" type="text" value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    autoComplete="username" autoFocus required disabled={isSubmitting}
                    placeholder="Username atau email"
                    className="w-full h-[50px] rounded-2xl border-[1.5px] border-[#CBD5E1] bg-white pl-12 pr-4 text-[15px] outline-none transition-all focus:border-[#2563EB] focus:border-2 placeholder:text-[#94A3B8]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[14px] font-semibold text-[#1E293B] mb-2">Kata Sandi</label>
                <div className="relative">
                  <LockKeyhole className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-[#94A3B8] pointer-events-none" />
                  <input
                    name="password" type={showPassword ? "text" : "password"} value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password" required disabled={isSubmitting}
                    placeholder="Kata sandi"
                    className="w-full h-[50px] rounded-2xl border-[1.5px] border-[#CBD5E1] bg-white pl-12 pr-12 text-[15px] outline-none transition-all focus:border-[#2563EB] focus:border-2 placeholder:text-[#94A3B8]"
                  />
                  <button type="button" onClick={() => setShowPassword((p) => !p)} disabled={isSubmitting}
                    aria-label={showPassword ? "Sembunyikan" : "Tampilkan"}
                    className="absolute right-2 top-1/2 -translate-y-1/2 md-icon-btn size-10">
                    {showPassword ? <EyeOff className="size-5 text-[#64748B]" /> : <Eye className="size-5 text-[#64748B]" />}
                  </button>
                </div>
              </div>
              <div className="pt-1">
                <button type="submit" disabled={isSubmitting}
                  className="w-full h-[50px] rounded-full bg-[#2563EB] text-white text-[15px] font-semibold flex items-center justify-center gap-2 transition-all hover:bg-[#1D4ED8] active:scale-[0.97] disabled:opacity-50">
                  {isSubmitting
                    ? <><Loader2 className="size-5 animate-spin" /><span>Memverifikasi...</span></>
                    : <span>Masuk ke Sistem</span>
                  }
                </button>
              </div>
            </form>

            <div className="mt-6 text-center">
              <button type="button" onClick={() => setIsHelpOpen(true)}
                className="text-[14px] text-[#2563EB] font-semibold hover:underline">
                Lupa kata sandi? Hubungi operator
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Help / Support Dialog */}
      {isHelpOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-[2px] p-4">
          <div className="w-full max-w-sm bg-white rounded-t-[28px] sm:rounded-[24px] shadow-2xl animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-8 h-1 rounded-full bg-[#CBD5E1]" />
            </div>
            <div className="px-6 pt-4 pb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-[#EFF6FF] text-[#2563EB]">
                    <LifeBuoy className="size-5" />
                  </div>
                  <div>
                    <p className="text-[16px] font-bold text-[#1E293B]">Bantuan Login</p>
                    <p className="text-[13px] text-[#64748B]">Hubungi operator sekolah</p>
                  </div>
                </div>
                <button type="button" onClick={() => setIsHelpOpen(false)}
                  className="md-icon-btn size-10">
                  <X className="size-5" />
                </button>
              </div>

              <div className="space-y-3 text-[14px] text-[#475569] mb-5">
                <p>Jika lupa kata sandi atau mengalami kendala login, hubungi tim proktor atau operator IT sekolah:</p>
                <div className="rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Unit Layanan</span>
                    <span className="font-semibold text-[#1E293B]">Ruang Proktor CBT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Jam Operasional</span>
                    <span className="font-semibold text-[#1E293B]">07.00 – 16.00 WIB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">WhatsApp</span>
                    <span className="font-semibold text-[#2563EB]">+62 812-3456-7890</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setIsHelpOpen(false)}
                  className="flex-1 h-[48px] rounded-full border border-[#CBD5E1] text-[14px] font-semibold text-[#1E293B]">
                  Tutup
                </button>
                <button type="button"
                  onClick={() => { window.open("https://wa.me/6281234567890", "_blank"); setIsHelpOpen(false); }}
                  className="flex-1 h-[48px] rounded-full bg-[#2563EB] text-white text-[14px] font-semibold flex items-center justify-center gap-2">
                  <PhoneCall className="size-4" />
                  Hubungi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
