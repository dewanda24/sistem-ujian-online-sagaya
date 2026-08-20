"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

type SemesterToggleButtonProps = {
  name: string;
  isActive: boolean;
};

export function SemesterToggleButton({ name, isActive }: SemesterToggleButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={
        isActive
          ? "inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-300 shadow-xs cursor-pointer disabled:opacity-50"
          : "inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-blue-50 hover:text-blue-700 hover:ring-blue-200 ring-1 ring-slate-200 cursor-pointer transition disabled:opacity-50"
      }
      title={isActive ? "Semester ini sedang aktif" : `Klik untuk mengaktifkan semester ${name}`}
    >
      {pending ? (
        <>
          <Loader2 className="size-3 animate-spin text-blue-600" />
          <span>Mengubah...</span>
        </>
      ) : (
        <>
          {isActive ? (
            <span className="h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-emerald-200" />
          ) : null}
          <span>
            {name} {isActive ? "(Aktif)" : ""}
          </span>
        </>
      )}
    </button>
  );
}
