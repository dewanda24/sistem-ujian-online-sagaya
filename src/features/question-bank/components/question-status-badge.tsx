interface QuestionStatusBadgeProps {
  status: string;
}

export function QuestionStatusBadge({ status }: QuestionStatusBadgeProps) {
  const styles = {
    draft: "bg-muted text-muted-foreground ring-border",
    published: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    archived: "bg-amber-50 text-amber-700 ring-amber-600/20",
  } as const;

  return (
    <span
      className={`inline-flex rounded-md px-2 py-1 text-xs font-medium ring-1 ${
        styles[status as keyof typeof styles] ?? styles.draft
      }`}
    >
      {status}
    </span>
  );
}
