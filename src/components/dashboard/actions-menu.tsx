import type { ReactNode } from "react";

type ActionsMenuProps = {
  label?: string;
  children: ReactNode;
};

export function ActionsMenu({ label = "Actions", children }: ActionsMenuProps) {
  return (
    <details className="relative inline-block">
      <summary className="w-28 cursor-pointer list-none rounded-md border px-3 py-1.5 text-center text-xs font-medium hover:bg-muted">
        {label}
      </summary>
      <div className="absolute right-0 z-20 mt-2 w-52 space-y-2 rounded-lg border bg-card p-2 shadow-lg">
        {children}
      </div>
    </details>
  );
}
