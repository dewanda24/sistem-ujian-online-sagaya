import { getRoleLabel } from "@/constants/ui-labels";
import type { CurrentUser } from "@/types/auth";

interface RoleBadgeProps {
  user: CurrentUser;
}

export function RoleBadge({ user }: RoleBadgeProps) {
  const roleLabel = getRoleLabel(user.roles?.name) || user.roles?.label;

  return (
    <span className="inline-flex items-center rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-2 py-1 text-xs font-medium text-[#64748B]">
      {roleLabel}
    </span>
  );
}
