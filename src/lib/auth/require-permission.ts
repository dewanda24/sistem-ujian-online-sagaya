import { redirect } from "next/navigation";

import { hasPermission } from "@/lib/auth/has-permission";
import { requireAuth } from "@/lib/auth/require-auth";

export async function requirePermission(permission: string) {
  const user = await requireAuth();

  if (!hasPermission(user, permission)) {
    redirect("/dashboard");
  }

  return user;
}
