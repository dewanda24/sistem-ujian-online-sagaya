import { Activity } from "lucide-react";

import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { ActionToast } from "@/components/master-data/action-toast";
import { RecoveryCenterView } from "@/features/recovery-center/components/recovery-center-view";
import { getRecoveryCenterData } from "@/features/recovery-center/queries";
import { requirePermission } from "@/lib/auth/require-permission";

type PageProps = {
  searchParams: Promise<{
    notice?: string;
    message?: string;
  }>;
};

export default async function RecoveryCenterPage({ searchParams }: PageProps) {
  const user = await requirePermission("exam_monitoring.view");
  const params = await searchParams;
  const data = await getRecoveryCenterData(user);

  return (
    <div className="space-y-5">
      <ActionToast status={params.notice} message={params.message} />
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <DashboardPageHeader
          title="Recovery Center"
          description="Pusat kendali pemulihan operasional ujian: failed submit, session conflict, locked attempt, offline, dan expired attempt."
        />
        <a
          href="/dashboard/recovery-center"
          className="inline-flex items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-4 py-2 text-sm font-medium text-[#0F172A] shadow-sm transition hover:bg-[#F8FAFC]"
        >
          <Activity className="size-4" />
          Refresh Queue
        </a>
      </div>

      <RecoveryCenterView
        data={data}
        returnTo="/dashboard/recovery-center"
      />
    </div>
  );
}
