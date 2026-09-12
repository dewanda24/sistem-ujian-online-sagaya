import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { requireAuth } from "@/lib/auth/require-auth";
import { getSuperAdminImpersonationContext } from "@/lib/auth/school-scope";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();
  const isSuperAdmin = user.roles?.name === "super_admin";

  let impersonatedSchool = null;
  let superAdminSchools: Array<{
    id: string;
    name: string;
    education_level?: string | null;
  }> = [];

  if (isSuperAdmin) {
    const [impersonation, supabase] = await Promise.all([
      getSuperAdminImpersonationContext(),
      createClient(),
    ]);
    impersonatedSchool = impersonation;

    const { data: schools } = await supabase
      .from("schools")
      .select("id, name, education_level")
      .eq("is_active", true)
      .order("name", { ascending: true });

    superAdminSchools = schools ?? [];
  }

  return (
    <DashboardShell
      user={user}
      impersonatedSchool={impersonatedSchool}
      superAdminSchools={superAdminSchools}
    >
      {children}
    </DashboardShell>
  );
}

