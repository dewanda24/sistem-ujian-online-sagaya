import { DashboardPlaceholderPage } from "@/features/dashboard/components/dashboard-placeholder-page";
import { requireRole } from "@/lib/auth/require-role";

export default async function TeacherExamsPage() {
  await requireRole("teacher");

  return (
    <DashboardPlaceholderPage
      title="Exams"
      description="Susun, jadwalkan, dan publish ujian dari workspace guru."
      emptyTitle="Belum ada ujian"
      emptyDescription="Modul ujian dapat ditambahkan di sini pada Sprint 3."
    />
  );
}
