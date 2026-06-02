import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { requireAuth } from "@/lib/auth/require-auth";

type PageProps = {
  searchParams: Promise<{
    reason?: string;
  }>;
};

const messages: Record<string, { title: string; description: string }> = {
  "missing-school-scope": {
    title: "Scope sekolah belum diatur",
    description:
      "Akun ini belum terhubung ke sekolah. Hubungi Super Admin untuk menetapkan sekolah sebelum mengakses data operasional.",
  },
  "school-scope-mismatch": {
    title: "Akses sekolah tidak diizinkan",
    description:
      "Data yang diminta berada di luar sekolah yang terhubung dengan akun ini.",
  },
};

export default async function ForbiddenPage({ searchParams }: PageProps) {
  await requireAuth();
  const params = await searchParams;
  const message = messages[params.reason ?? ""] ?? {
    title: "Akses tidak diizinkan",
    description: "Akun ini tidak memiliki akses ke halaman atau data tersebut.",
  };

  return (
    <div>
      <DashboardPageHeader
        title="Forbidden"
        description="Pembatasan akses dashboard aktif."
      />
      <EmptyState title={message.title} description={message.description} />
    </div>
  );
}
