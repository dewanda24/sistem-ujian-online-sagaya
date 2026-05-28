import Link from "next/link";

import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { requirePermission } from "@/lib/auth/require-permission";

const modules = [
  {
    title: "Semua Soal",
    href: "/dashboard/question-bank/questions",
    description:
      "Kelola soal pilihan ganda dan essay berdasarkan mapel, kategori, difficulty, dan status.",
  },
  {
    title: "Kategori Soal",
    href: "/dashboard/question-bank/categories",
    description:
      "Kelola kategori soal per mata pelajaran untuk membantu penyusunan paket ujian.",
  },
];

export default async function QuestionBankPage() {
  await requirePermission("question_bank.view");

  return (
    <div>
      <DashboardPageHeader
        title="Question Bank"
        description="Fondasi bank soal CBT untuk guru dan admin. Target kelas akan ditangani pada sprint paket ujian dan jadwal ujian."
      />
      <div className="grid gap-4 md:grid-cols-2">
        {modules.map((module) => (
          <Link key={module.href} href={module.href}>
            <DashboardCard
              title={module.title}
              description={module.description}
              className="h-full transition hover:border-primary/40 hover:shadow-md"
            />
          </Link>
        ))}
      </div>
    </div>
  );
}
