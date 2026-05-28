import { LogoutButton } from "@/features/auth/components/logout-button";
import { CurrentUser } from "@/types/auth";

interface DashboardTopbarProps {
  user: CurrentUser;
}

export function DashboardTopbar({ user }: DashboardTopbarProps) {
  const fullName = user.user_profiles?.full_name ?? user.username;

  const roleLabel = user.roles?.label ?? "User";

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-6">
      <div>
        <h2 className="text-lg font-semibold">Admin Dashboard</h2>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium">{fullName}</p>

          <p className="text-xs text-muted-foreground">{roleLabel}</p>
        </div>

        <LogoutButton />
      </div>
    </header>
  );
}
