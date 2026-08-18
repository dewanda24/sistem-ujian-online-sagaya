"use client";

import { useEffect, useState } from "react";
import { Download, Smartphone, Sparkles, X, Share } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function PwaInstallBanner() {
  const [mounted, setMounted] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [isDismissed, setIsDismissed] = useState(true);

  useEffect(() => {
    setMounted(true);
    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsIos(/iphone|ipad|ipod/.test(userAgent));

    const isStandaloneMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (isStandaloneMode) {
      setIsDismissed(true);
      return;
    }

    const dismissed = localStorage.getItem("cbt_pwa_banner_dismissed");
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10);
      if (Date.now() - dismissedTime < 3 * 24 * 60 * 60 * 1000) {
        setIsDismissed(true);
        return;
      }
    }

    setIsDismissed(false);
  }, []);

  useEffect(() => {
    // Listen for beforeinstallprompt event (Android / Chromium)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setIsDismissed(true);
        setDeferredPrompt(null);
      }
    } else if (isIos) {
      setShowIosGuide(true);
    } else {
      // Fallback for browsers that don't emit beforeinstallprompt
      alert("Untuk memasang aplikasi: Ketuk menu titik tiga (⋮) di browser, lalu pilih 'Instal aplikasi' atau 'Tambahkan ke Layar Utama'.");
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem("cbt_pwa_banner_dismissed", Date.now().toString());
  };

  if (!mounted || isDismissed) {
    return null;
  }

  return (
    <div className="relative overflow-hidden rounded-3xl border-2 border-blue-400/40 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 p-4 text-white shadow-lg sm:p-5">
      {/* Dismiss button */}
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Tutup banner"
        className="absolute right-3 top-3 flex size-7 items-center justify-center rounded-full bg-black/20 text-white/80 transition hover:bg-black/30 hover:text-white"
      >
        <X className="size-4" />
      </button>

      <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between pr-6 sm:pr-8">
        <div className="flex items-start gap-3.5">
          {/* App Icon preview */}
          <div className="relative flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-md">
            <Smartphone className="size-6 text-blue-600" />
            <span className="absolute -bottom-1 -right-1 flex size-4 items-center justify-center rounded-full bg-emerald-500 text-white">
              <Sparkles className="size-2.5" />
            </span>
          </div>

          <div className="min-w-0">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-bold text-blue-100 backdrop-blur-xs">
              <span>📲 Pasang Aplikasi di HP</span>
            </div>
            <h3 className="text-sm font-extrabold text-white sm:text-base mt-0.5">
              Jadikan Layar Penuh Seperti Aplikasi Android!
            </h3>
            <p className="text-xs text-blue-100 mt-0.5 leading-relaxed">
              Ujian lebih fokus tanpa gangguan bilah alamat browser & akses instan dari menu HP.
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 pt-1 sm:pt-0">
          <button
            type="button"
            onClick={handleInstallClick}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-xs font-black text-blue-700 shadow-md transition hover:bg-blue-50 active:scale-95"
          >
            <Download className="size-4" />
            <span>Pasang Sekarang</span>
          </button>
        </div>
      </div>

      {/* iOS Safari instructions tooltip */}
      {showIosGuide && (
        <div className="mt-3 rounded-2xl bg-blue-950/60 p-3 text-xs text-blue-100 border border-white/15">
          <div className="flex items-center gap-2 font-bold text-white mb-1">
            <Share className="size-4 text-amber-300" />
            <span>Cara Pasang di iPhone/iPad:</span>
          </div>
          <ol className="list-decimal list-inside space-y-1 text-[11px] text-blue-200">
            <li>Ketuk tombol <strong>Bagikan (Share)</strong> di bagian bawah browser Safari.</li>
            <li>Geser ke bawah lalu pilih <strong>&quot;Tambah ke Layar Utama&quot; (Add to Home Screen)</strong>.</li>
            <li>Ketuk <strong>&quot;Tambah&quot;</strong> di pojok kanan atas. Selesai!</li>
          </ol>
        </div>
      )}
    </div>
  );
}
