import Link from "next/link";

import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { getProductionReadinessItems } from "@/features/admin/readiness";
import { requireRole } from "@/lib/auth/require-role";

type ReadinessStatus = "ready" | "warning" | "missing";

const statusLabel: Record<ReadinessStatus, string> = {
  ready: "Ready",
  warning: "Warning",
  missing: "Missing",
};

const statusClassName: Record<ReadinessStatus, string> = {
  ready: "bg-emerald-100 text-emerald-700",
  warning: "bg-amber-100 text-amber-700",
  missing: "bg-red-100 text-red-700",
};

export default async function SuperAdminReadinessPage() {
  await requireRole("super_admin");
  const items = await getProductionReadinessItems();
  const readyCount = items.filter((item) => item.status === "ready").length;
  const warningCount = items.filter((item) => item.status === "warning").length;
  const missingCount = items.filter((item) => item.status === "missing").length;

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Production Readiness"
        description="Pemeriksaan cepat untuk akun, peserta ujian, audit log, dan konfigurasi operasional sebelum sistem dipakai lebih luas."
      />

      <section className="grid gap-4 md:grid-cols-3">
        <DashboardCard
          title="Ready"
          value={String(readyCount)}
          description="Komponen yang sudah memenuhi baseline."
        />
        <DashboardCard
          title="Warning"
          value={String(warningCount)}
          description="Perlu dicek sebelum simulasi/produksi."
        />
        <DashboardCard
          title="Missing"
          value={String(missingCount)}
          description="Perlu dilengkapi agar alur inti aman."
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        {items.map((item) => (
          <DashboardCard
            key={item.title}
            title={item.title}
            value={item.value}
            description={item.description}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClassName[item.status]}`}
              >
                {statusLabel[item.status]}
              </span>
              {item.href ? (
                <Link
                  href={item.href}
                  className="rounded-md border px-3 py-1.5 text-xs font-medium transition hover:bg-muted"
                >
                  Buka modul
                </Link>
              ) : null}
            </div>
          </DashboardCard>
        ))}
      </section>

      <DashboardCard
        title="Catatan"
        description="Readiness ini bersifat read-only dan tidak mengubah database."
      >
        <p className="text-sm leading-6 text-muted-foreground">
          Item berstatus warning tidak selalu berarti error. Gunakan halaman ini
          sebagai daftar cek sebelum demo, simulasi ujian, atau deployment.
        </p>
      </DashboardCard>
    </div>
  );
}
