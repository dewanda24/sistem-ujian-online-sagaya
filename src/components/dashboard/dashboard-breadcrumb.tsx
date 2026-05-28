"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { usePathname } from "next/navigation";

function formatSegment(segment: string) {
  return segment
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function DashboardBreadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  return (
    <nav className="flex min-w-0 items-center gap-1 text-sm text-muted-foreground">
      <Link href="/dashboard" className="shrink-0 hover:text-foreground">
        Dashboard
      </Link>
      {segments.slice(1).map((segment, index) => {
        const href = `/${segments.slice(0, index + 2).join("/")}`;
        const isLast = index === segments.slice(1).length - 1;

        return (
          <span key={href} className="flex min-w-0 items-center gap-1">
            <ChevronRight className="size-4 shrink-0" />
            {isLast ? (
              <span className="truncate text-foreground">
                {formatSegment(segment)}
              </span>
            ) : (
              <Link href={href} className="truncate hover:text-foreground">
                {formatSegment(segment)}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
