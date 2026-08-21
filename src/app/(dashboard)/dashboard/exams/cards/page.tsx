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
  { value: "assigned", label: "Belum Mulai" },
  { value: "in_progress", label: "Sedang Ujian" },
  { value: "submitted", label: "Sudah Dikumpulkan" },
  { value: "absent", label: "Tidak Hadir" },
  { value: "cancelled", label: "Dibatalkan" },
];

function participantStatusLabel(status: string) {
  return (
    participantStatuses.find((item) => item.value === status)?.label ?? status
  );
}

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
          ? "break-inside-avoid rounded-xl border border-slate-300 bg-white p-4 shadow-2xs print:shadow-none print:border-slate-400 print:p-3 text-slate-800"
          : "rounded-2xl border border-slate-200/90 bg-white p-6 shadow-2xs text-slate-800"
      }
    >
      {/* CARD HEADER / KOP */}
      <div className="border-b border-slate-200 pb-3 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
              KARTU PESERTA UJIAN
            </span>
            {card.academic_year ? (
              <span className="text-[10px] font-medium text-slate-500">
                TP {card.academic_year}
              </span>
            ) : null}
          </div>
          <h2 className="mt-1 text-sm font-black text-slate-900 leading-snug">
            {card.student_name}
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Kelas: <strong className="text-slate-800">{card.class_name}</strong> • NIS/NISN:{" "}
            <strong className="text-slate-800">{[card.nis, card.nisn].filter(Boolean).join(" / ") || "-"}</strong>
          </p>
        </div>
        <span className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-700 uppercase tracking-wide shrink-0">
          {participantStatusLabel(card.status)}
        </span>
      </div>

      {/* CARD BODY DETAILS */}
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-lg bg-slate-50 p-2 border border-slate-100">
          <div className="text-[10px] font-bold text-slate-400 uppercase">Jadwal & Mapel</div>
          <div className="font-bold text-slate-900 truncate mt-0.5">{card.schedule_title}</div>
          <div className="text-blue-700 font-medium truncate text-[11px]">{subject || "-"}</div>
        </div>
        <div className="rounded-lg bg-slate-50 p-2 border border-slate-100">
          <div className="text-[10px] font-bold text-slate-400 uppercase">Waktu & Durasi</div>
          <div className="font-semibold text-slate-800 mt-0.5 text-[11px]">
            {formatDateTime(card.start_at)}
          </div>
          <div className="text-slate-500 text-[10px] font-medium">{card.duration_minutes || "-"} Menit Pengerjaan</div>
        </div>
      </div>

      {/* LOGIN & TOKEN SECTION */}
      <div className="mt-2.5 rounded-xl border border-dashed border-blue-200 bg-blue-50/40 p-2.5 flex items-center justify-between gap-2">
        <div>
          <div className="text-[10px] font-bold uppercase text-slate-500">Username Login</div>
          <div className="font-mono text-xs font-bold text-slate-900">{card.student_username}</div>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-bold uppercase text-slate-500">Token Masuk</div>
          <div className="font-mono text-xs font-black text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200 inline-block shadow-2xs">
            {card.token_required ? card.access_token || "BELUM DIBUAT" : "TANPA TOKEN"}
          </div>
        </div>
      </div>

      {/* SIGNATURE SECTION (FOR PRINT) */}
      <div className="mt-3 pt-2 border-t border-slate-200 grid grid-cols-2 text-center text-[10px] text-slate-500">
        <div>
          <span>Tanda Tangan Peserta</span>
          <div className="h-9"></div>
          <span className="font-medium text-slate-800">({card.student_name})</span>
        </div>
        <div>
          <span>Pengawas Ruangan</span>
          <div className="h-9"></div>
          <span className="font-medium text-slate-800">( ........................................ )</span>
        </div>
      </div>
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
          title="Kartu Peserta Ujian"
          description="Filter dan cetak kartu ujian resmi peserta dengan detail sesi, token, dan tanda tangan pengawas."
        />
      </div>

      {/* METRIC SUMMARY */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 print:hidden">
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Kartu</div>
          <div className="mt-1 text-2xl font-black text-slate-900">{cards.length}</div>
          <div className="mt-0.5 text-[11px] text-slate-500">Siap dicetak sesuai filter</div>
        </div>
        <div className="rounded-2xl border border-blue-200/90 bg-blue-50/50 p-4 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-blue-700">Jadwal Terpilih</div>
          <div className="mt-1 text-2xl font-black text-blue-900">{scheduleCount}</div>
          <div className="mt-0.5 text-[11px] text-blue-600 font-medium">Jadwal ujian aktif</div>
        </div>
        <div className="rounded-2xl border border-purple-200/90 bg-purple-50/50 p-4 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-purple-700">Kelas Terdaftar</div>
          <div className="mt-1 text-2xl font-black text-purple-900">{classCount}</div>
          <div className="mt-0.5 text-[11px] text-purple-600 font-medium">Rombongan belajar</div>
        </div>
        <div className={`rounded-2xl border p-4 shadow-2xs ${
          needsToken > 0 ? "border-amber-200 bg-amber-50" : "border-emerald-200 bg-emerald-50"
        }`}>
          <div className={`text-[11px] font-bold uppercase tracking-wider ${
            needsToken > 0 ? "text-amber-800" : "text-emerald-800"
          }`}>
            Status Token
          </div>
          <div className={`mt-1 text-2xl font-black ${
            needsToken > 0 ? "text-amber-900" : "text-emerald-900"
          }`}>
            {needsToken > 0 ? `${needsToken} Kosong` : "Lengkap"}
          </div>
          <div className={`mt-0.5 text-[11px] font-medium ${
            needsToken > 0 ? "text-amber-700" : "text-emerald-700"
          }`}>
            {needsToken > 0 ? "Token belum dibuat" : "Semua jadwal ber-token"}
          </div>
        </div>
      </section>

      {/* FILTER BAR */}
      <section className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs print:hidden">
        <form className="grid gap-3 md:grid-cols-6">
          <select
            name="schedule_id"
            defaultValue={params.schedule_id ?? ""}
            className="h-10 rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none font-medium md:col-span-2"
          >
            <option value="">Semua Jadwal Ujian</option>
            {schedules.map((schedule) => (
              <option key={schedule.id} value={schedule.id}>
                {schedule.title}
              </option>
            ))}
          </select>
          <select
            name="class_id"
            defaultValue={params.class_id ?? ""}
            className="h-10 rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none font-medium"
          >
            <option value="">Semua Kelas</option>
            {classes.map((classItem) => (
              <option key={classItem.value} value={classItem.value}>
                {classItem.label}
              </option>
            ))}
          </select>
          <select
            name="status"
            defaultValue={params.status ?? ""}
            className="h-10 rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none font-medium"
          >
            <option value="">Semua Status Peserta</option>
            {participantStatuses.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
          <input
            name="q"
            defaultValue={params.q ?? ""}
            placeholder="Cari siswa, NIS, mapel..."
            className="h-10 rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none font-medium md:col-span-2"
          />
          <div className="flex flex-wrap items-center justify-end gap-2 md:col-span-6 pt-1 border-t border-slate-100">
            <Link
              href="/dashboard/exams/cards"
              className="inline-flex h-9 items-center rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
            >
              Bersihkan Filter
            </Link>
            <button
              type="submit"
              className="inline-flex h-9 items-center rounded-xl bg-slate-900 px-4 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition"
            >
              Terapkan Filter
            </button>
            <PrintExamCardsButton />
          </div>
        </form>
      </section>

      {cards.length === 0 ? (
        <EmptyState
          title="Belum ada kartu ujian"
          description="Sinkronkan peserta pada jadwal ujian, lalu gunakan filter untuk menampilkan kartu."
        />
      ) : (
        <>
          <section className="grid gap-4 lg:grid-cols-[340px_1fr] print:hidden">
            <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">Daftar Siswa</h2>
                <span className="text-[11px] font-medium text-slate-500">{cards.length} siswa</span>
              </div>
              <div className="mt-2.5 max-h-[600px] space-y-1.5 overflow-y-auto pr-1">
                {cards.map((card) => (
                  <Link
                    key={card.id}
                    href={buildPreviewHref(card.id, params)}
                    className={
                      previewCard?.id === card.id
                        ? "block rounded-xl border border-blue-300 bg-blue-50/60 p-2.5 text-xs transition shadow-2xs"
                        : "block rounded-xl border border-slate-150 p-2.5 text-xs hover:bg-slate-50 transition"
                    }
                  >
                    <div className="font-bold text-slate-900">{card.student_name}</div>
                    <div className="mt-0.5 text-[11px] text-slate-500">
                      {card.class_name} • {card.schedule_title}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">Pratinjau Kartu Peserta</h2>
                <span className="text-[11px] text-slate-500">
                  * Tombol "Cetak Kartu Ujian" akan mencetak seluruh kartu sesuai filter aktif.
                </span>
              </div>
              {previewCard ? <ExamCardPreview card={previewCard} /> : null}
            </div>
          </section>

          {/* PRINTABLE CARDS CONTAINER */}
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
