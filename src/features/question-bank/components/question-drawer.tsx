"use client";

import { ReactNode, useEffect, useState } from "react";
import { X } from "lucide-react";
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

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/40 transition-opacity",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={handleClose}
        aria-hidden="true"
      />

      <div
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-full max-w-2xl flex-col bg-[#F8FAFC] shadow-2xl transition-transform duration-300 sm:max-w-3xl",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-[#E2E8F0] bg-white px-6 py-4">
          <h2 className="text-lg font-semibold text-[#0F172A]">{title}</h2>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-2 text-[#64748B] transition hover:bg-[#F1F5F9] hover:text-[#0F172A]"
            aria-label="Tutup form"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {isOpen ? children : null}
        </div>
      </div>
    </>
  );
}
