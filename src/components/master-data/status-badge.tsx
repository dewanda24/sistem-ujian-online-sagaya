interface StatusBadgeProps {
  active: boolean;
}

export function StatusBadge({ active }: StatusBadgeProps) {
  return (
    <span
      className={
        active
          ? "inline-flex rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-600/20"
          : "inline-flex rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground ring-1 ring-border"
      }
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}
