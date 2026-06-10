import AuditLogsPage from "@/app/(dashboard)/dashboard/admin/audit-logs/page";
import { requireRole } from "@/lib/auth/require-role";

type PageProps = {
  searchParams: Promise<{
    q?: string;
    action?: string;
    entity_type?: string;
    user_id?: string;
    date_from?: string;
    date_to?: string;
    limit?: string;
  }>;
};

export default async function SuperAdminAuditLogsPage(props: PageProps) {
  await requireRole("super_admin");

  return <AuditLogsPage {...props} basePath="/dashboard/super-admin/audit-logs" />;
}
