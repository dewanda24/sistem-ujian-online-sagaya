import Link from "next/link";
import { Download, FolderTree, ListChecks } from "lucide-react";

import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { requirePermission } from "@/lib/auth/require-permission";

const modules = [
  {
    title: "Bank Soal",
    href: "/dashboard/question-bank/questions",
    icon: ListChecks,
    description: "Buat dan kelola soal pilihan ganda, esai, dan media soal.",
  },
  {
    title: "Kategori Soal",
    href: "/dashboard/question-bank/categories",
    icon: FolderTree,
    description: "Atur kategori, topik, bab, atau tingkat kesulitan soal.",
  },
  {
    title: "Impor & Ekspor Soal",
    href: "/dashboard/question-bank/import-excel",
    icon: Download,
    description: "Unggah atau unduh soal menggunakan template yang tersedia.",
  },
];

export default async function QuestionBankPage() {
  await requirePermission("question_bank.view");

  return (
    <div>
      <DashboardPageHeader
        title="Kelola Soal"
        description="Buat, susun, dan atur soal untuk berbagai kebutuhan ujian."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {modules.map((module) => {
          const Icon = module.icon;

          return (
            <Link key={module.href} href={module.href}>
              <DashboardCard
                title={module.title}
                description={module.description}
                className="h-full rounded-xl border-[#E2E8F0] bg-white shadow-sm transition hover:border-[#2563EB]/40 hover:shadow-md"
              >
                <Icon className="mb-4 size-5 text-[#2563EB]" />
              </DashboardCard>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
