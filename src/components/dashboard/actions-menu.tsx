import type { ReactNode } from "react";

type ActionsMenuProps = {
  label?: string;
  children: ReactNode;
};

export function ActionsMenu({ label = "Actions", children }: ActionsMenuProps) {
  return (
    <details className="relative inline-block">
      <summary className="inline-flex min-h-8 w-28 cursor-pointer list-none items-center justify-center rounded-xl border border-[#E2E8F0] px-3 py-1.5 text-center text-xs font-medium text-[#0F172A] hover:bg-[#F8FAFC]">
        {label}
      </summary>
      <div className="absolute right-0 z-20 mt-2 w-52 space-y-2 rounded-xl border border-[#E2E8F0] bg-white p-2 shadow-lg">
        {children}
      </div>
    </details>
  );
}
