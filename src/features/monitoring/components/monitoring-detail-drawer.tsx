"use client";

import { useState, type ReactNode } from "react";

import { StatusPill } from "@/components/dashboard/status-pill";

type MonitoringDetailDrawerProps = {
  participantName: string;
  identity: string;
  className: string;
  status: string;
  lockedReason?: string;
  startedAt: string;
  submittedAt: string;
  lastSavedAt: string;
  answerCount: number;
  eventCount: number;
  lastEventType: string;
  lastEventAt: string;
  actions?: ReactNode;
};

export function MonitoringDetailDrawer({
  participantName,
  identity,
  className,
  status,
  lockedReason,
  startedAt,
  submittedAt,
  lastSavedAt,
  answerCount,
  eventCount,
  lastEventType,
  lastEventAt,
  actions,
}: MonitoringDetailDrawerProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md border px-3 py-1.5 text-xs hover:bg-muted"
      >
        Detail
      </button>

      {open ? (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Tutup detail monitoring"
            className="absolute inset-0 bg-black/30"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute right-0 top-0 h-full w-full max-w-md overflow-y-auto border-l bg-background p-5 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">{participantName}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{identity}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
              >
                Tutup
              </button>
            </div>

            <div className="mt-5 grid gap-3 text-sm">
              <DetailItem label="Kelas" value={className} />
              <div className="rounded-md border p-3">
                <div className="text-xs text-muted-foreground">Status</div>
                <div className="mt-1">
                  <StatusPill value={status} />
                </div>
              </div>
              <DetailItem label="Mulai" value={startedAt} />
              <DetailItem label="Dikumpulkan" value={submittedAt} />
              <DetailItem label="Terakhir Tersimpan" value={lastSavedAt} />
              <DetailItem label="Jawaban" value={String(answerCount)} />
              <DetailItem label="Kejadian" value={String(eventCount)} />
              <DetailItem
                label="Kejadian Terakhir"
                value={lastEventType ? `${lastEventType} (${lastEventAt})` : "-"}
              />
              {lockedReason ? (
                <DetailItem label="Alasan Dikunci" value={lockedReason} />
              ) : null}
            </div>

            {actions ? (
              <div className="mt-5 rounded-lg border p-3">
                <div className="mb-3 text-sm font-medium">Aksi</div>
                <div className="grid gap-2">{actions}</div>
              </div>
            ) : null}
          </aside>
        </div>
      ) : null}
    </>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 font-medium">{value || "-"}</div>
    </div>
  );
}
