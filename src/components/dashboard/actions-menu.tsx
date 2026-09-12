"use client";

import { TableActions } from "@/components/dashboard/table-actions";
import type { ReactNode } from "react";

type ActionsMenuProps = {
  label?: string;
  children: ReactNode;
  className?: string;
  align?: "start" | "end";
};

export function ActionsMenu({
  label = "Aksi",
  children,
  className,
  align = "end",
}: ActionsMenuProps) {
  return (
    <TableActions label={label} align={align} className={className}>
      {children}
    </TableActions>
  );
}
