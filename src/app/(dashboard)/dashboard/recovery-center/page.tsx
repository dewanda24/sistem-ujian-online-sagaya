import { Activity } from "lucide-react";

import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { ActionToast } from "@/components/master-data/action-toast";
import { RecoveryCenterView } from "@/features/recovery-center/components/recovery-center-view";
import { getRecoveryCenterData } from "@/features/recovery-center/queries";
import { hasAnyActiveProctorAssignment } from "@/lib/auth/proctor-scope";
import { requirePermission } from "@/lib/auth/require-permission";
import { redirect } from "next/navigation";

type PageProps = {
  searchParams: Promise<{
    notice?: string;
    message?: string;
  }>;
};

export default async function RecoveryCenterPage({ searchParams }: PageProps) {
  const user = await requirePermission("exam_monitoring.view");
  if (
    ["teacher", "proctor"].includes(user.roles?.name ?? "") &&
    !(await hasAnyActiveProctorAssignment(user.id))
  ) {
    redirect("/dashboard/forbidden");
  }
  const params = await searchParams;
  const data = await getRecoveryCenterData(user);

  return (
    <div className="space-y-5">
      <ActionToast status={params.notice} message={params.message} />
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <DashboardPageHeader
          title="Pusat Pemulihan"
          description="Pusat tindak lanjut masalah pelaksanaan ujian: gagal mengumpulkan, akses ganda, pengerjaan terkunci, koneksi terputus, dan waktu habis."
        />
        <a
          href="/dashboard/recovery-center"
          className="inline-flex items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-4 py-2 text-sm font-medium text-[#0F172A] shadow-sm transition hover:bg-[#F8FAFC]"
        >
          <Activity className="size-4" />
          Muat Ulang Daftar
        </a>
      </div>

      <RecoveryCenterView
        data={data}
        returnTo="/dashboard/recovery-center"
      />
    </div>
  );
}
