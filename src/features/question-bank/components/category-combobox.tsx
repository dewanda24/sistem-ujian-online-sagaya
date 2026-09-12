"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronsUpDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

type CategoryOption = {
  value: string;
  label: string;
  subject_id?: string;
};

type CategoryComboboxProps = {
  categories: CategoryOption[];
  value: string;
  onChange: (value: string) => void;
  name?: string;
  placeholder?: string;
};

export function CategoryCombobox({
  categories,
  value,
  onChange,
  name = "category_id",
  placeholder = "Pilih / Cari Kategori...",
}: CategoryComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedCategory = categories.find((c) => c.value === value);

  const filtered = categories.filter((c) =>
    c.label.toLowerCase().includes(search.toLowerCase().trim())
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setSearch("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative w-full">
      <input type="hidden" name={name} value={value} />

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-10 w-full items-center justify-between rounded-xl border border-[#CBD5E1] bg-white px-3 text-xs font-semibold text-slate-800 outline-none transition hover:border-slate-400 focus:border-[#2563EB]"
      >
        <span className="truncate">
          {selectedCategory ? selectedCategory.label : "Tanpa kategori (Umum)"}
        </span>
        <div className="flex items-center gap-1 text-slate-400">
          {value && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.stopPropagation();
                  onChange("");
                }
              }}
              className="rounded p-0.5 hover:bg-slate-100 hover:text-slate-600"
              title="Hapus kategori"
            >
              <X className="size-3.5" />
            </span>
          )}
          <ChevronsUpDown className="size-4 shrink-0" />
        </div>
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-full rounded-xl border border-slate-200 bg-white p-2 shadow-xl ring-1 ring-slate-900/5">
          {/* Search Input */}
          <div className="relative mb-2 flex items-center border-b border-slate-100 pb-2">
            <Search className="absolute left-2.5 size-3.5 text-slate-400" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ketik nama kategori..."
              className="h-8 w-full rounded-lg bg-slate-50 pl-8 pr-3 text-xs font-medium text-slate-800 placeholder:text-slate-400 outline-none focus:bg-white focus:ring-1 focus:ring-blue-600"
            />
          </div>

          {/* Options List */}
          <div className="max-h-48 overflow-y-auto space-y-0.5 [scrollbar-width:thin]">
            <button
              type="button"
              onClick={() => {
                onChange("");
                setIsOpen(false);
              }}
              className={cn(
                "flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs font-medium transition",
                !value
                  ? "bg-blue-50 font-bold text-blue-700"
                  : "text-slate-700 hover:bg-slate-50"
              )}
            >
              <span>Tanpa kategori (Umum)</span>
              {!value && <Check className="size-3.5 text-blue-600" />}
            </button>

            {filtered.length === 0 ? (
              <div className="py-3 text-center text-xs text-slate-400">
                Tidak ada kategori cocok
              </div>
            ) : (
              filtered.map((cat) => {
                const isSelected = cat.value === value;
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => {
                      onChange(cat.value);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs font-medium transition",
                      isSelected
                        ? "bg-blue-50 font-bold text-blue-700"
                        : "text-slate-700 hover:bg-slate-50"
                    )}
                  >
                    <span className="truncate">{cat.label}</span>
                    {isSelected && <Check className="size-3.5 text-blue-600" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
