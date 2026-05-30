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
  {
    title: "Stimulus / Bacaan",
    href: "/dashboard/question-bank/stimuli",
    description:
      "Kelola bacaan, gambar, audio, video, atau pengantar yang bisa dipakai oleh banyak soal.",
  },
  {
    title: "Import Word",
    href: "/dashboard/question-bank/import-word",
    description:
      "Import soal dari template Word resmi, preview hasil parsing, lalu simpan sebagai draft.",
  },
  {
    title: "Import Excel/CSV",
    href: "/dashboard/question-bank/import-excel",
    description:
      "Import soal dari Excel atau CSV dengan preview validasi per baris sebelum disimpan.",
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
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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
