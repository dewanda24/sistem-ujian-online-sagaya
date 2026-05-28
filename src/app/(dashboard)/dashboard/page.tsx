import { redirect } from "next/navigation";

import { requireAuth } from "@/lib/auth/require-auth";
import { getDashboardPath } from "@/lib/auth/role-redirect";

export default async function DashboardIndexPage() {
  const user = await requireAuth();

  redirect(getDashboardPath(user.roles?.name));
}
