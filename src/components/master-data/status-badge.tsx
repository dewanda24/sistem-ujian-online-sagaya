interface StatusBadgeProps {
  active: boolean;
}

export function StatusBadge({ active }: StatusBadgeProps) {
  return (
    <span
      className={
        active
          ? "inline-flex rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-[#16A34A] ring-1 ring-[#22C55E]/25"
          : "inline-flex rounded-md bg-[#F8FAFC] px-2 py-1 text-xs font-medium text-[#64748B] ring-1 ring-[#E2E8F0]"
      }
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}
