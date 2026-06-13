import Link from "next/link";

import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { StatusPill } from "@/components/dashboard/status-pill";
import { getEnvStatus } from "@/lib/env";
import { requireRole } from "@/lib/auth/require-role";

export default async function SuperAdminHelpPage() {
  await requireRole("super_admin");
  const envStatus = getEnvStatus();
  const readyCount = envStatus.filter((item) => item.configured).length;

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Bantuan / Troubleshooting"
        description="FAQ, panduan cepat, status sistem, dan langkah troubleshooting dasar untuk platform Sagaya."
      />

      <section className="grid gap-4 md:grid-cols-3">
        <DashboardCard
          title="Status Sistem"
          value={`${readyCount}/${envStatus.length}`}
          description="Variabel runtime wajib yang terdeteksi."
        >
          <StatusPill value={readyCount === envStatus.length ? "ready" : "pending"} />
        </DashboardCard>
        <DashboardCard
          title="Panduan"
          description="Dokumentasi manual tersedia di folder docs project."
        >
          <Link
            href="/dashboard/super-admin/settings"
            className="inline-flex rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            Cek Pengaturan
          </Link>
        </DashboardCard>
        <DashboardCard
          title="Troubleshooting"
          description="Mulai dari catatan aktivitas, status sistem, lalu data sekolah."
        >
          <Link
            href="/dashboard/super-admin/audit-logs"
            className="inline-flex rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            Buka Audit Log
          </Link>
        </DashboardCard>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <DashboardCard title="FAQ" description="Pertanyaan operasional yang paling sering muncul.">
          <div className="space-y-3 text-sm leading-6">
            <HelpItem
              question="Admin sekolah tidak bisa login"
              answer="Pastikan akun aktif, peran admin terpasang, akun login tersedia, dan sekolah sudah dipetakan."
            />
            <HelpItem
              question="Sekolah tidak muncul di laporan"
              answer="Pastikan sekolah aktif dan data guru, siswa, atau jadwal ujian sudah terkait ke sekolah tersebut."
            />
            <HelpItem
              question="Izin tidak berubah"
              answer="Cek Peran & Izin, lalu pastikan pengguna memiliki izin yang sinkron dengan matriks akses."
            />
          </div>
        </DashboardCard>

        <DashboardCard
          title="Troubleshooting Dasar"
          description="Urutan pengecekan cepat saat ada insiden operasional."
        >
          <ol className="space-y-3 text-sm leading-6 text-muted-foreground">
            <li>1. Cek Dashboard Pusat untuk status data utama.</li>
            <li>2. Cek Pengaturan Sistem untuk environment yang belum siap.</li>
            <li>3. Cek Audit Log untuk aksi terakhir pada modul terkait.</li>
            <li>4. Cek detail sekolah dan mapping admin sekolah.</li>
            <li>5. Jika terkait data ujian, minta admin sekolah/guru memeriksa jadwal.</li>
          </ol>
        </DashboardCard>
      </section>
    </div>
  );
}

function HelpItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="rounded-md border p-3">
      <div className="font-medium">{question}</div>
      <div className="mt-1 text-muted-foreground">{answer}</div>
    </div>
  );
}
