import Link from "next/link";
import { FolderTree, ListChecks, Plus } from "lucide-react";

import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { requirePermission } from "@/lib/auth/require-permission";

const modules = [
  {
    title: "Semua Soal",
    href: "/dashboard/question-bank/questions",
    icon: ListChecks,
    description: "Lihat, filter, edit, dan kelola status soal dari tabel ringkas.",
  },
  {
    title: "Tambah Soal",
    href: "/dashboard/question-bank/questions/create",
    icon: Plus,
    description: "Buat soal melalui wizard sederhana dengan preview sesuai kebutuhan.",
  },
  {
    title: "Kategori Soal",
    href: "/dashboard/question-bank/categories",
    icon: FolderTree,
    description: "Tambah, edit, nonaktifkan, atau arsipkan kategori soal.",
  },
];

export default async function QuestionBankPage() {
  await requirePermission("question_bank.view");

  return (
    <div>
      <DashboardPageHeader
        title="Bank Soal"
        description="Pilih alur yang dibutuhkan. Import dan unduh soal dikelola terpusat melalui pusat import."
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
