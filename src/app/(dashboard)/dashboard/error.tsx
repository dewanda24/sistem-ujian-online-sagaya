"use client";

import { AlertCircle } from "lucide-react";

export default function DashboardError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="grid min-h-[50vh] place-items-center">
      <div className="w-full max-w-md rounded-xl border border-[#E2E8F0] bg-white p-6 text-center shadow-sm">
        <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-xl border border-[#E2E8F0] bg-red-50 text-[#EF4444]">
          <AlertCircle className="size-5" />
        </div>
        <h2 className="text-base font-semibold text-[#0F172A]">
          Data belum bisa ditampilkan
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#64748B]">
          Terjadi kendala saat memuat halaman. Coba lagi, atau buka ulang halaman
          setelah beberapa saat.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-4 rounded-xl bg-[#2563EB] px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Coba Lagi
        </button>
      </div>
    </div>
  );
}
