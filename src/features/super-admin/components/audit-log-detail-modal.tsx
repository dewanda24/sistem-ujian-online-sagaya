"use client";

import { useState } from "react";
import { Eye, X, Copy, Check } from "lucide-react";

type AuditLogItem = {
  id?: string | number;
  action?: string | null;
  entity_type?: string | null;
  entity_id?: string | null;
  user_id?: string | null;
  created_at?: string | null;
  payload?: unknown;
};

export function AuditLogDetailButton({ item }: { item: AuditLogItem }) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const formattedPayload = JSON.stringify(item.payload ?? {}, null, 2);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formattedPayload);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1 rounded-md border border-border/80 bg-background px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted focus:outline-hidden"
      >
        <Eye className="h-3 w-3 text-primary" />
        <span>Detail</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="relative flex max-h-[85vh] w-full max-w-2xl flex-col rounded-xl border border-border bg-card shadow-xl animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <h3 className="font-semibold text-foreground">Detail Jejak Audit</h3>
                <p className="text-xs text-muted-foreground">
                  Aksi: <span className="font-mono font-medium text-foreground">{item.action ?? "-"}</span> | Data: <span className="font-mono text-foreground">{item.entity_type ?? "-"}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 space-y-4 overflow-y-auto p-5 text-sm">
              <div className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-muted/30 p-3 text-xs">
                <div>
                  <span className="text-muted-foreground">Waktu Kejadian:</span>
                  <div className="mt-0.5 font-medium">
                    {item.created_at ? new Date(item.created_at).toLocaleString("id-ID") : "-"}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">User ID / Pelaku:</span>
                  <div className="mt-0.5 font-mono font-medium truncate">{item.user_id ?? "Sistem / Anonim"}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">ID Entitas:</span>
                  <div className="mt-0.5 font-mono font-medium truncate">{item.entity_id ?? "-"}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Modul / Tipe:</span>
                  <div className="mt-0.5 font-medium">{item.entity_type ?? "-"}</div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold uppercase text-muted-foreground">Data Perubahan (Payload JSON):</span>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-600" />
                        <span className="text-emerald-600">Disalin</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Salin JSON</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="max-h-64 overflow-auto rounded-lg border border-border bg-muted/60 p-3 font-mono text-xs text-foreground leading-relaxed">
                  {formattedPayload}
                </pre>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end border-t border-border px-5 py-3">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-md border border-input bg-background px-4 py-2 text-xs font-medium hover:bg-muted"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
