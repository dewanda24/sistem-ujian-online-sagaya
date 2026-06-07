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
        "rounded-xl border border-[#E2E8F0] bg-white p-4 text-[#0F172A] shadow-sm sm:p-5",
        className,
      )}
    >
      <div className="space-y-1">
        <h3 className="line-clamp-1 text-sm font-medium text-[#64748B]">{title}</h3>
        {value ? <p className="truncate text-2xl font-semibold">{value}</p> : null}
        {description ? (
          <p className="line-clamp-2 text-sm leading-6 text-[#64748B]">
            {description}
          </p>
        ) : null}
      </div>
      {children ? <div className="mt-4">{children}</div> : null}
    </section>
  );
}
