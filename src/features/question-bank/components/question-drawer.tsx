"use client";

import { ReactNode, useEffect, useState } from "react";
import { ExternalLink, Maximize2, Minimize2, X } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";

export function QuestionDrawer({
  isOpen,
  title,
  children,
}: {
  isOpen: boolean;
  title: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  function handleClose() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("action");
    params.delete("id");
    router.push(`?${params.toString()}`);
  }

  const fullPageHref = `/dashboard/question-bank/questions/create?${searchParams.toString()}`;

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/40 transition-opacity backdrop-blur-xs",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={handleClose}
        aria-hidden="true"
      />

      <div
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-full flex-col bg-[#F8FAFC] shadow-2xl transition-all duration-300",
          isMaximized ? "max-w-6xl" : "max-w-2xl sm:max-w-3xl",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-[#E2E8F0] bg-white px-6 py-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-[#0F172A]">{title}</h2>
            {isMaximized && (
              <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-700">
                Layar Lebar
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setIsMaximized(!isMaximized)}
              className="rounded-lg p-2 text-[#64748B] transition hover:bg-[#F1F5F9] hover:text-[#0F172A]"
              title={isMaximized ? "Perkecil Tampilan" : "Perlebar Tampilan (Layar Lebar)"}
              aria-label={isMaximized ? "Perkecil Tampilan" : "Perlebar Tampilan"}
            >
              {isMaximized ? (
                <Minimize2 className="size-4.5" />
              ) : (
                <Maximize2 className="size-4.5" />
              )}
            </button>
            <Link
              href={fullPageHref}
              className="rounded-lg p-2 text-[#64748B] transition hover:bg-[#F1F5F9] hover:text-[#0F172A]"
              title="Buka di Halaman Penuh Mandiri"
              aria-label="Buka di Halaman Penuh"
            >
              <ExternalLink className="size-4.5" />
            </Link>
            <div className="my-1 h-4 w-px bg-slate-200" />
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg p-2 text-[#64748B] transition hover:bg-[#F1F5F9] hover:text-[#0F172A]"
              aria-label="Tutup form"
              title="Tutup (Esc)"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-6 [scrollbar-width:thin]">
          {isOpen ? children : null}
        </div>
      </div>
    </>
  );
}
