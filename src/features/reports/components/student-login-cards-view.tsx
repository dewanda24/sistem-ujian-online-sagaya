"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Printer,
  Search,
  School,
  QrCode,
  Sparkles,
  ArrowLeft,
  Users,
  ShieldCheck,
} from "lucide-react";
import type { LoginCardsPageData, StudentLoginCard } from "@/features/reports/login-cards-queries";

type Props = {
  data: LoginCardsPageData;
};

export function StudentLoginCardsView({ data }: Props) {
  const [search, setSearch] = useState("");
  const [selectedClass, setSelectedClass] = useState<string>(data.selectedClassId ?? "");
  const [layoutMode, setLayoutMode] = useState<"standard" | "compact">("standard");

  const filteredCards = data.cards.filter((card) => {
    const matchSearch =
      !search ||
      card.name.toLowerCase().includes(search.toLowerCase()) ||
      card.username.toLowerCase().includes(search.toLowerCase()) ||
      card.nis.toLowerCase().includes(search.toLowerCase()) ||
      card.nisn.toLowerCase().includes(search.toLowerCase());

    const matchClass = !selectedClass || card.className === selectedClass;

    return matchSearch && matchClass;
  });

  const handlePrint = () => {
    window.print();
  };

  const currentDate = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* Screen Control Bar (Hidden on Print) */}
      <div className="no-print space-y-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/master-data/students"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900"
              title="Kembali ke Data Siswa"
            >
              <ArrowLeft className="size-4" />
            </Link>
            <div>
              <h1 className="text-lg font-bold text-slate-900">
                Cetak Kartu Login & Peserta Ujian
              </h1>
              <p className="text-xs text-slate-500">
                Format kertas standar A4 (Grid 2x4 / 8 kartu per lembar siap potong)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              disabled={filteredCards.length === 0}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm shadow-blue-500/20 transition-all hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50"
            >
              <Printer className="size-4" />
              <span>Cetak / Simpan PDF ({filteredCards.length})</span>
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama siswa / NIS / username..."
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">Semua Kelas ({data.classes.length} kelas)</option>
              {data.classes.map((cls) => (
                <option key={cls.id} value={cls.name}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-500">
              Menampilkan: <strong className="text-slate-900">{filteredCards.length}</strong> kartu
            </span>
            <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-[11px]">
              <button
                type="button"
                onClick={() => setLayoutMode("standard")}
                className={`rounded-md px-2.5 py-1 font-medium transition-all ${
                  layoutMode === "standard"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Grid 2x4 (A4)
              </button>
              <button
                type="button"
                onClick={() => setLayoutMode("compact")}
                className={`rounded-md px-2.5 py-1 font-medium transition-all ${
                  layoutMode === "compact"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Kompak
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Empty Filter State */}
      {filteredCards.length === 0 ? (
        <div className="no-print rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 p-12 text-center">
          <Users className="mx-auto size-10 text-slate-400" />
          <h3 className="mt-3 text-sm font-semibold text-slate-900">
            Tidak ada kartu siswa ditemukan
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Coba ubah kata kunci pencarian atau filter kelas yang dipilih.
          </p>
        </div>
      ) : null}

      {/* Printable Cards Grid */}
      <div
        className={`print-container ${
          layoutMode === "standard"
            ? "grid grid-cols-1 gap-4 sm:grid-cols-2 print:grid-cols-2"
            : "grid grid-cols-1 gap-3 sm:grid-cols-2 print:grid-cols-2"
        }`}
      >
        {filteredCards.map((card) => (
          <StudentCardItem
            key={card.id}
            card={card}
            school={data.school}
            currentDate={currentDate}
          />
        ))}
      </div>

      {/* Custom Embedded Print Stylesheet */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm 6mm;
          }

          body {
            background-color: white !important;
            color: black !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .no-print,
          nav,
          aside,
          header,
          footer,
          .dashboard-header {
            display: none !important;
          }

          .print-container {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 4mm !important;
            width: 100% !important;
          }

          .student-card-box {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            box-shadow: none !important;
            border: 1.5px solid #0f172a !important;
            border-radius: 6px !important;
          }
        }
      `}</style>
    </div>
  );
}

function StudentCardItem({
  card,
  school,
  currentDate,
}: {
  card: StudentLoginCard;
  school: LoginCardsPageData["school"];
  currentDate: string;
}) {
  return (
    <div className="student-card-box relative overflow-hidden rounded-xl border border-slate-300 bg-white p-3.5 shadow-sm transition-all print:p-3">
      {/* Header Kop Kartu */}
      <div className="flex items-center gap-2.5 border-b-2 border-slate-900 pb-2">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
          {school.logoUrl ? (
            <img
              src={school.logoUrl}
              alt="Logo"
              className="size-9 object-contain"
            />
          ) : (
            <School className="size-6 text-blue-700" />
          )}
        </div>
        <div className="min-w-0 flex-1 text-center">
          <h2 className="line-clamp-1 text-[11px] font-black uppercase tracking-tight text-slate-900">
            {school.name}
          </h2>
          <p className="line-clamp-1 text-[9px] text-slate-600">
            {school.address && school.address !== "-" ? school.address : "KARTU PESERTA CBT ONLINE"}
          </p>
          <div className="mt-0.5 inline-block rounded bg-slate-900 px-2 py-0.2 text-[8px] font-bold uppercase tracking-wider text-white">
            KARTU LOGIN PESERTA UJIAN
          </div>
        </div>
      </div>

      {/* Body Content */}
      <div className="mt-2.5 flex items-start justify-between gap-2.5">
        {/* Detail Tabel Data Siswa */}
        <div className="flex-1 space-y-1 text-[10px]">
          <div className="grid grid-cols-[68px_6px_1fr] items-baseline">
            <span className="font-semibold text-slate-600">Nama Siswa</span>
            <span>:</span>
            <span className="font-bold text-slate-950 truncate uppercase">
              {card.name}
            </span>
          </div>

          <div className="grid grid-cols-[68px_6px_1fr] items-baseline">
            <span className="font-semibold text-slate-600">NIS / NISN</span>
            <span>:</span>
            <span className="text-slate-800">
              {card.nis !== "-" ? card.nis : card.nisn !== "-" ? card.nisn : "-"}
            </span>
          </div>

          <div className="grid grid-cols-[68px_6px_1fr] items-baseline">
            <span className="font-semibold text-slate-600">Kelas</span>
            <span>:</span>
            <span className="font-semibold text-slate-900">{card.className}</span>
          </div>

          <div className="mt-1.5 rounded-lg border border-dashed border-blue-200 bg-blue-50/60 p-1.5 text-[9.5px]">
            <div className="grid grid-cols-[64px_6px_1fr] items-baseline">
              <span className="font-bold text-blue-900">Username</span>
              <span className="text-blue-900">:</span>
              <span className="font-mono font-bold text-blue-950">{card.username}</span>
            </div>
            <div className="grid grid-cols-[64px_6px_1fr] items-baseline">
              <span className="font-bold text-blue-900">Password</span>
              <span className="text-blue-900">:</span>
              <span className="font-mono font-bold text-blue-950">{card.defaultPassword}</span>
            </div>
          </div>
        </div>

        {/* Sisi Kanan: QR Code + Kotak Foto */}
        <div className="flex shrink-0 flex-col items-center gap-1">
          {card.qrCodeDataUrl ? (
            <div className="rounded border border-slate-200 bg-white p-0.5 shadow-2xs">
              <img
                src={card.qrCodeDataUrl}
                alt={`QR-${card.username}`}
                className="size-14"
              />
            </div>
          ) : (
            <div className="flex size-14 items-center justify-center rounded border border-dashed border-slate-300 text-[8px] text-slate-400">
              Scan Login
            </div>
          )}
          <span className="text-[7.5px] font-medium text-slate-500">Scan Login</span>
        </div>
      </div>

      {/* Footer Kartu & Tanda Tangan */}
      <div className="mt-2.5 flex items-end justify-between border-t border-slate-200 pt-1.5 text-[8.5px] text-slate-500">
        <div className="space-y-0.5">
          <p className="flex items-center gap-1 font-medium text-emerald-700">
            <ShieldCheck className="size-3" />
            <span>Resmi Sistem CBT Online</span>
          </p>
          <p className="text-[7.5px] text-slate-400">Simpan kartu ini selama ujian.</p>
        </div>

        <div className="text-right">
          <p>{currentDate}</p>
          <p className="mt-3 font-semibold text-slate-900">Panitia Pelaksana</p>
        </div>
      </div>
    </div>
  );
}
