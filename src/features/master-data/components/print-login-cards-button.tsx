"use client";

import { Printer } from "lucide-react";

export function PrintLoginCardsButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
    >
      <Printer className="size-4" aria-hidden="true" />
      Cetak Kartu
    </button>
  );
}
