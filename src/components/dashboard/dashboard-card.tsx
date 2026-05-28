import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface DashboardCardProps {
  title: string;
  value?: string;
  description?: string;
  children?: ReactNode;
  className?: string;
}

export function DashboardCard({
  title,
  value,
  description,
  children,
  className,
}: DashboardCardProps) {
  return (
    <section
      className={cn(
        "rounded-lg border bg-card p-5 text-card-foreground shadow-sm",
        className,
      )}
    >
      <div className="space-y-1">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        {value ? <p className="text-2xl font-semibold">{value}</p> : null}
        {description ? (
          <p className="text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {children ? <div className="mt-4">{children}</div> : null}
    </section>
  );
}
