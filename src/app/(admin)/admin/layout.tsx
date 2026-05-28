import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return <DashboardLayout user={user}>{children}</DashboardLayout>;
}
