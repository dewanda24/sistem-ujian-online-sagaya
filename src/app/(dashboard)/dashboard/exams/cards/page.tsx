import Link from "next/link";

import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { PrintExamCardsButton } from "@/features/exams/components/print-exam-cards-button";
import {
  getExamAdmissionCards,
  getExamSchedules,
  getScopedClassOptions,
  type ExamAdmissionCard,
} from "@/features/exams/queries";
import { requirePermission } from "@/lib/auth/require-permission";
import { formatJakartaDateTime } from "@/lib/date-time";

type PageProps = {
  searchParams: Promise<{
    schedule_id?: string;
    class_id?: string;
    status?: string;
    q?: string;
    preview?: string;
  }>;
};

const participantStatuses = [
  { value: "assigned", label: "Assigned" },
  { value: "in_progress", label: "In Progress" },
  { value: "submitted", label: "Submitted" },
  { value: "absent", label: "Absent" },
  { value: "cancelled", label: "Cancelled" },
];

function formatDateTime(value: string) {
  if (!value) {
    return "-";
  }

  return formatJakartaDateTime(value);
}

function buildPreviewHref(
  cardId: string,
  params: Awaited<PageProps["searchParams"]>,
) {
  const query = new URLSearchParams();

  for (const key of ["schedule_id", "class_id", "status", "q"] as const) {
    if (params[key]) {
      query.set(key, params[key]);
    }
  }

  query.set("preview", cardId);

  return `/dashboard/exams/cards?${query.toString()}`;
}

function ExamCardPreview({
  card,
  variant = "default",
}: {
  card: ExamAdmissionCard;
  variant?: "default" | "compact";
}) {
  const subject = [card.subject_code, card.subject_name]
    .filter(Boolean)
    .join(" - ");

  return (
    <article
      className={
        variant === "compact"
          ? "break-inside-avoid rounded-md border bg-card p-4 shadow-sm print:shadow-none"
          : "rounded-md border bg-card p-5 shadow-sm"
      }
    >
      <div className="border-b pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Kartu Ujian
            </p>
            <h2 className="mt-1 text-base font-semibold">
              {card.student_name}
            </h2>
          </div>
          <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium">
            {card.status}
          </span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {card.class_name}
          {card.academic_year ? ` - ${card.academic_year}` : ""}
        </p>
      </div>

      <dl className="mt-3 grid gap-2 text-sm">
        <div className="grid grid-cols-[104px_1fr] gap-2">
          <dt className="text-muted-foreground">Jadwal</dt>
          <dd className="font-medium">{card.schedule_title}</dd>
        </div>
        <div className="grid grid-cols-[104px_1fr] gap-2">
          <dt className="text-muted-foreground">Paket</dt>
          <dd>{card.package_title}</dd>
        </div>
        <div className="grid grid-cols-[104px_1fr] gap-2">
          <dt className="text-muted-foreground">Mapel</dt>
          <dd>{subject || "-"}</dd>
        </div>
        <div className="grid grid-cols-[104px_1fr] gap-2">
          <dt className="text-muted-foreground">Waktu</dt>
          <dd>
            {formatDateTime(card.start_at)}
            <br />
            <span className="text-muted-foreground">
              sampai {formatDateTime(card.end_at)}
            </span>
          </dd>
        </div>
        <div className="grid grid-cols-[104px_1fr] gap-2">
          <dt className="text-muted-foreground">Durasi</dt>
          <dd>{card.duration_minutes || "-"} menit</dd>
        </div>
        <div className="grid grid-cols-[104px_1fr] gap-2">
          <dt className="text-muted-foreground">Username</dt>
          <dd className="font-medium">{card.student_username}</dd>
        </div>
        <div className="grid grid-cols-[104px_1fr] gap-2">
          <dt className="text-muted-foreground">NIS/NISN</dt>
          <dd>{[card.nis, card.nisn].filter(Boolean).join(" / ") || "-"}</dd>
        </div>
        <div className="grid grid-cols-[104px_1fr] gap-2">
          <dt className="text-muted-foreground">Token</dt>
          <dd className="font-semibold">
            {card.token_required ? card.access_token || "Belum dibuat" : "Tidak wajib"}
          </dd>
        </div>
      </dl>
    </article>
  );
}

export default async function ExamCardsPage({ searchParams }: PageProps) {
  await requirePermission("exam_schedules.view");
  const params = await searchParams;
  const filters = {
    schedule_id: params.schedule_id,
    class_id: params.class_id,
    status: params.status,
    q: params.q,
  };
  const [cards, schedules, classes] = await Promise.all([
    getExamAdmissionCards(filters),
    getExamSchedules({}),
    getScopedClassOptions(),
  ]);
  const previewCard = cards.find((card) => card.id === params.preview) ?? cards[0];
  const scheduleCount = new Set(cards.map((card) => card.schedule_id)).size;
  const classCount = new Set(cards.map((card) => card.class_id)).size;
  const needsToken = cards.filter(
    (card) => card.token_required && !card.access_token,
  ).length;

  return (
    <div className="space-y-6">
      <div className="print:hidden">
        <DashboardPageHeader
          title="Kartu Ujian"
          description="Dashboard khusus untuk preview, filter, dan cetak kartu ujian peserta."
        />
      </div>

      <section className="grid gap-4 md:grid-cols-4 print:hidden">
        <DashboardCard
          title="Kartu Sesuai Filter"
          value={String(cards.length)}
          description="Jumlah kartu yang siap ditinjau."
        />
        <DashboardCard
          title="Jadwal"
          value={String(scheduleCount)}
          description="Jadwal yang masuk filter."
        />
        <DashboardCard
          title="Kelas"
          value={String(classCount)}
          description="Kelas peserta terpilih."
        />
        <DashboardCard
          title="Token Kosong"
          value={String(needsToken)}
          description="Kartu wajib token tanpa kode."
        />
      </section>

      <section className="rounded-lg border bg-card p-5 shadow-sm print:hidden">
        <form className="grid gap-3 md:grid-cols-6">
          <select
            name="schedule_id"
            defaultValue={params.schedule_id ?? ""}
            className="rounded-md border bg-background px-3 py-2 text-sm md:col-span-2"
          >
            <option value="">Semua jadwal</option>
            {schedules.map((schedule) => (
              <option key={schedule.id} value={schedule.id}>
                {schedule.title}
              </option>
            ))}
          </select>
          <select
            name="class_id"
            defaultValue={params.class_id ?? ""}
            className="rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="">Semua kelas</option>
            {classes.map((classItem) => (
              <option key={classItem.value} value={classItem.value}>
                {classItem.label}
              </option>
            ))}
          </select>
          <select
            name="status"
            defaultValue={params.status ?? ""}
            className="rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="">Semua status peserta</option>
            {participantStatuses.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
          <input
            name="q"
            defaultValue={params.q ?? ""}
            placeholder="Cari siswa, NIS, mapel"
            className="rounded-md border bg-background px-3 py-2 text-sm md:col-span-2"
          />
          <div className="flex flex-wrap justify-end gap-2 md:col-span-6">
            <Link
              href="/dashboard/exams/cards"
              className="rounded-md border px-4 py-2 text-sm hover:bg-muted"
            >
              Reset
            </Link>
            <button className="rounded-md border px-4 py-2 text-sm hover:bg-muted">
              Filter
            </button>
            <PrintExamCardsButton />
          </div>
        </form>
      </section>

      {cards.length === 0 ? (
        <EmptyState
          title="Belum ada kartu ujian"
          description="Sync peserta pada jadwal ujian, lalu gunakan filter untuk menampilkan kartu."
        />
      ) : (
        <>
          <section className="grid gap-4 lg:grid-cols-[360px_1fr] print:hidden">
            <div className="rounded-lg border bg-card p-4">
              <h2 className="text-sm font-semibold">Peserta</h2>
              <div className="mt-3 max-h-[620px] space-y-2 overflow-auto pr-1">
                {cards.map((card) => (
                  <Link
                    key={card.id}
                    href={buildPreviewHref(card.id, params)}
                    className={
                      previewCard?.id === card.id
                        ? "block rounded-md border border-primary bg-primary/5 p-3 text-sm"
                        : "block rounded-md border p-3 text-sm hover:bg-muted"
                    }
                  >
                    <div className="font-medium">{card.student_name}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {card.class_name} | {card.schedule_title}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold">Preview Kartu</h2>
                <span className="text-xs text-muted-foreground">
                  Cetak akan memakai semua kartu sesuai filter.
                </span>
              </div>
              {previewCard ? <ExamCardPreview card={previewCard} /> : null}
            </div>
          </section>

          <div className="hidden print:block">
            <h1 className="text-xl font-bold">Kartu Ujian</h1>
            <p className="text-sm text-muted-foreground">
              {cards.length} peserta sesuai filter
            </p>
          </div>

          <section className="hidden gap-3 print:grid print:grid-cols-2">
            {cards.map((card) => (
              <ExamCardPreview key={card.id} card={card} variant="compact" />
            ))}
          </section>
        </>
      )}
    </div>
  );
}
