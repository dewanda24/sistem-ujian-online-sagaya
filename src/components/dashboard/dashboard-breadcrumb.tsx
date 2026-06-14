"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { usePathname } from "next/navigation";

const segmentLabels: Record<string, string> = {
  dashboard: "Beranda",
  admin: "Admin",
  "super-admin": "Super Admin",
  "master-data": "Data Sekolah",
  "question-bank": "Bank Soal",
  questions: "Soal",
  categories: "Kategori",
  exams: "Ujian",
  packages: "Paket Ujian",
  schedules: "Jadwal Ujian",
  reports: "Laporan",
  monitoring: "Monitoring Ujian",
  assignments: "Kelas Saya",
  grading: "Koreksi Esai",
  profile: "Profil",
  students: "Siswa",
  teachers: "Guru",
  classes: "Kelas",
  subjects: "Mata Pelajaran",
  permissions: "Izin Akses",
  roles: "Hak Akses",
  users: "Pengguna",
  "import-export": "Impor & Ekspor",
  proctors: "Pengawas Ujian",
  "academic-years": "Tahun Ajaran & Semester",
};

function formatSegment(segment: string) {
  if (segmentLabels[segment]) {
    return segmentLabels[segment];
  }

  return segment
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function DashboardBreadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  return (
    <nav className="flex min-w-0 items-center gap-1 text-sm text-muted-foreground">
      <Link href="/dashboard" className="shrink-0 hover:text-foreground">
        Beranda
      </Link>
      {segments.slice(1).map((segment, index) => {
        const href = `/${segments.slice(0, index + 2).join("/")}`;
        const isLast = index === segments.slice(1).length - 1;

        return (
          <span key={href} className="flex min-w-0 items-center gap-1">
            <ChevronRight className="size-4 shrink-0" />
            {isLast ? (
              <span className="truncate text-foreground">
                {formatSegment(segment)}
              </span>
            ) : (
              <Link href={href} className="truncate hover:text-foreground">
                {formatSegment(segment)}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
