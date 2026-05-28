import type { CurrentUser } from "@/types/auth";

interface RoleBadgeProps {
  user: CurrentUser;
}

export function RoleBadge({ user }: RoleBadgeProps) {
  const roleLabel = user.roles?.label ?? "User";

  return (
    <span className="inline-flex items-center rounded-md border bg-background px-2 py-1 text-xs font-medium text-muted-foreground">
      {roleLabel}
    </span>
  );
}
