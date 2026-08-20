import { requirePermission } from "@/lib/auth/require-permission";
import { getStudentLoginCardsData } from "@/features/reports/login-cards-queries";
import { StudentLoginCardsView } from "@/features/reports/components/student-login-cards-view";

type PageProps = {
  searchParams: Promise<{
    class_id?: string;
    academic_year_id?: string;
    q?: string;
  }>;
};

export const metadata = {
  title: "Cetak Kartu Login Siswa | Sistem Ujian Online CBT",
  description: "Cetak kartu login dan kartu peserta ujian siswa siap cetak kertas A4.",
};

export default async function StudentLoginCardsPage({ searchParams }: PageProps) {
  await requirePermission("students.view");
  const params = await searchParams;
  const data = await getStudentLoginCardsData(params);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <StudentLoginCardsView data={data} />
    </div>
  );
}
