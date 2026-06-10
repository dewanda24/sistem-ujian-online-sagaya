import UsersPage from "@/app/(dashboard)/dashboard/admin/users/page";
import { requireRole } from "@/lib/auth/require-role";

type PageProps = {
  searchParams: Promise<{
    q?: string;
    role_id?: string;
    school_id?: string;
    user_status?: string;
    edit?: string;
    status?: string;
    message?: string;
  }>;
};

export default async function SuperAdminUsersPage(props: PageProps) {
  await requireRole("super_admin");

  return <UsersPage {...props} basePath="/dashboard/super-admin/users" />;
}
