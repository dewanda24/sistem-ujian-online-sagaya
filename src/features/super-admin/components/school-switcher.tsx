"use client";

import { useState, useTransition } from "react";
import { Building2, ChevronDown, Check, Globe, Shield } from "lucide-react";
import {
  switchSchoolImpersonationAction,
  exitSchoolImpersonationAction,
} from "@/features/super-admin/impersonation-actions";

type MinimalSchool = {
  id: string;
  name: string;
  education_level?: string | null;
};

type SchoolSwitcherProps = {
  schools: MinimalSchool[];
  activeSchoolId?: string | null;
};

export function SchoolSwitcher({
  schools,
  activeSchoolId,
}: SchoolSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();

  const activeSchool = schools.find((s) => s.id === activeSchoolId);
  const filteredSchools = schools.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        disabled={isPending}
        className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
      >
        {activeSchool ? (
          <>
            <Building2 className="size-3.5 text-amber-600 shrink-0" />
            <span className="max-w-[140px] truncate font-semibold text-amber-800">
              {activeSchool.name}
            </span>
          </>
        ) : (
          <>
            <Globe className="size-3.5 text-blue-600 shrink-0" />
            <span className="text-slate-600">Platform Global</span>
          </>
        )}
        <ChevronDown className="size-3.5 text-slate-400" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 z-50 mt-1.5 w-72 origin-top-right rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl ring-1 ring-black/5 animate-in fade-in-50 zoom-in-95">
            <div className="p-1.5 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-1.5 px-1 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <Shield className="size-3.5 text-blue-500" />
                <span>Cakupan Data Sekolah</span>
              </div>
              <input
                type="text"
                placeholder="Cari sekolah..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-200 px-2 py-1 text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                autoFocus
              />
            </div>

            <div className="max-h-56 overflow-y-auto py-1">
              {/* Option: Global Platform */}
              <form
                action={(formData) => {
                  setIsOpen(false);
                  startTransition(() => {
                    exitSchoolImpersonationAction(formData);
                  });
                }}
              >
                <button
                  type="submit"
                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition ${
                    !activeSchoolId
                      ? "bg-blue-50 text-blue-700 font-semibold"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Globe className="size-3.5 text-blue-600" />
                    <span>Platform Global (Semua Sekolah)</span>
                  </div>
                  {!activeSchoolId && <Check className="size-3.5 text-blue-600" />}
                </button>
              </form>

              <div className="my-1 border-t border-slate-100" />

              {filteredSchools.length === 0 ? (
                <div className="p-3 text-center text-xs text-slate-400">
                  Sekolah tidak ditemukan
                </div>
              ) : (
                filteredSchools.map((s) => {
                  const isSelected = s.id === activeSchoolId;
                  return (
                    <form
                      key={s.id}
                      action={(formData) => {
                        setIsOpen(false);
                        startTransition(() => {
                          switchSchoolImpersonationAction(formData);
                        });
                      }}
                    >
                      <input type="hidden" name="school_id" value={s.id} />
                      <button
                        type="submit"
                        className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition ${
                          isSelected
                            ? "bg-amber-50 text-amber-900 font-semibold"
                            : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className="truncate font-medium">{s.name}</div>
                          {s.education_level && (
                            <span className="text-[10px] text-slate-400 uppercase">
                              {s.education_level}
                            </span>
                          )}
                        </div>
                        {isSelected && (
                          <Check className="size-3.5 text-amber-600 shrink-0" />
                        )}
                      </button>
                    </form>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
