import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/get-current-user";

export async function requireAuth() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?error=session-expired");
  }

  if (user.status !== "active") {
    redirect("/login?error=inactive");
  }

  if (!user.roles?.name) {
    redirect("/login?error=no-role");
  }

  return user;
}
