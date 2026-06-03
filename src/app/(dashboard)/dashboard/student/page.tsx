import Link from "next/link";

import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { StatusPill } from "@/components/dashboard/status-pill";
import { DataTable } from "@/components/master-data/data-table";
import {
  getStudentAcademicContext,
  getStudentExamSchedules,
} from "@/features/exam-room/queries";
import {
  firstRelation,
  getStudentSubmittedAttempts,
} from "@/features/results/queries";
import { requireRole } from "@/lib/auth/require-role";
import { formatJakartaDateTime } from "@/lib/date-time";

type Relation<T> = T | T[] | null | undefined;

function relation<T>(value: Relation<T>) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return "-";
  }

  return formatJakartaDateTime(value);
}

function getParticipant(schedule: {
  exam_participants?: Array<{
    id: string;
    status: string;
    exam_attempts?: Array<{ id: string; status: string }> | null;
  }> | null;
}) {
  return schedule.exam_participants?.[0] ?? null;
}

function scoreText(score?: number | null, maxScore?: number | null) {
  const max = Number(maxScore ?? 0);

  if (max <= 0) {
    return "-";
  }

  return `${Number(score ?? 0)} / ${max}`;
}

export default async function StudentDashboardPage() {
  const user = await requireRole("student");
  const [classes, schedules, attempts] = await Promise.all([
    getStudentAcademicContext(),
    getStudentExamSchedules(),
    getStudentSubmittedAttempts(),
  ]);
  const now = new Date();
  const activeClasses = classes.filter(
    (member: { left_at?: string | null }) => !member.left_at,
  );
  const activeSchedules = schedules.filter((schedule) => {
    const startAt = schedule.start_at ? new Date(schedule.start_at) : null;
    const endAt = schedule.end_at ? new Date(schedule.end_at) : null;

    return (
      ["scheduled", "active"].includes(schedule.status) &&
      Boolean(startAt && endAt && startAt <= now && endAt >= now)
    );
  });
  const upcomingSchedules = schedules
    .filter((schedule) => {
      const startAt = schedule.start_at ? new Date(schedule.start_at) : null;

      return ["scheduled", "active"].includes(schedule.status) && Boolean(startAt && startAt > now);
    })
    .slice(0, 5);
  const inProgress = schedules
    .map((schedule) => ({
      schedule,
      attempt: getParticipant(schedule)?.exam_attempts?.find(
        (attempt) => attempt.status === "in_progress",
      ),
    }))
    .find((item) => item.attempt);
  const latestAttempt = attempts[0] ?? null;
  const visibleScores = attempts.filter((attempt) => {
    const schedule = firstRelation(attempt.exam_schedules);
    const examPackage = firstRelation(schedule?.exam_packages);

    return Boolean(examPackage?.show_result) && attempt.grading_status !== "needs_manual_grading";
  });
  const averagePercent =
    visibleScores.length > 0
      ? visibleScores.reduce((total, attempt) => {
          const maxScore = Number(attempt.max_score ?? 0);

          return total + (maxScore > 0 ? (Number(attempt.score ?? 0) / maxScore) * 100 : 0);
        }, 0) / visibleScores.length
      : 0;

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Student Dashboard"
        description={`Ringkasan ujian, jadwal, dan hasil belajar. Selamat datang, ${
          user.user_profiles?.full_name ?? user.username
        }.`}
      />

      <div className="grid gap-4 md:grid-cols-4">
        <Link href="/dashboard/student/active-exams">
          <DashboardCard
            title="Ujian Aktif"
            value={String(activeSchedules.length)}
            description="Ujian yang sedang bisa dikerjakan sekarang."
            className="h-full transition hover:border-primary/40 hover:shadow-md"
          />
        </Link>
        <Link href="/dashboard/student/schedules">
          <DashboardCard
            title="Jadwal Mendatang"
            value={String(upcomingSchedules.length)}
            description="Jadwal terdekat berdasarkan kelas aktif."
            className="h-full transition hover:border-primary/40 hover:shadow-md"
          />
        </Link>
        <Link href="/dashboard/student/history">
          <DashboardCard
            title="Riwayat"
            value={String(attempts.length)}
            description="Ujian yang sudah dikumpulkan atau expired."
            className="h-full transition hover:border-primary/40 hover:shadow-md"
          />
        </Link>
        <DashboardCard
          title="Rata-rata Terlihat"
          value={`${averagePercent.toFixed(1)}%`}
          description="Hanya menghitung nilai yang sudah boleh ditampilkan."
        />
      </div>

      {inProgress?.attempt ? (
        <section className="rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm text-sky-950">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-semibold">Ujian sedang berjalan</div>
              <div className="mt-1">
                {inProgress.schedule.title} selesai pada{" "}
                {formatDateTime(inProgress.schedule.end_at)}
              </div>
            </div>
            <Link
              href={`/dashboard/exam-room/${inProgress.attempt.id}`}
              className="rounded-md bg-primary px-4 py-2 text-primary-foreground"
            >
              Lanjutkan
            </Link>
          </div>
        </section>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-2">
        <DashboardCard
          title="Profil Akademik"
          description="Kelas aktif dan riwayat kelas berasal dari class_members."
        >
          {activeClasses.length === 0 ? (
            <EmptyState
              title="Belum ada kelas aktif"
              description="Hubungi admin sekolah jika jadwal ujian belum muncul."
            />
          ) : (
            <div className="space-y-3">
              {activeClasses.map(
                (member: {
                  id: string;
                  joined_at?: string | null;
                  classes?: Relation<{
                    name?: string | null;
                    grade_level?: number | string | null;
                    schools?: Relation<{ name?: string | null }>;
                    academic_years?: Relation<{ name?: string | null }>;
                  }>;
                }) => {
                  const classItem = relation(member.classes);
                  const school = relation(classItem?.schools);
                  const academicYear = relation(classItem?.academic_years);

                  return (
                    <div key={member.id} className="rounded-md border p-3">
                      <div className="font-medium">{classItem?.name ?? "Kelas"}</div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        Tingkat {classItem?.grade_level ?? "-"} ·{" "}
                        {academicYear?.name ?? "Tahun ajaran"} ·{" "}
                        {school?.name ?? "Sekolah"}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        Bergabung: {member.joined_at ?? "-"}
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          )}
        </DashboardCard>

        <DashboardCard
          title="Hasil Terakhir"
          description="Nilai ditampilkan jika paket ujian mengizinkan dan koreksi sudah final."
        >
          {latestAttempt ? (
            <LatestAttemptCard attempt={latestAttempt} />
          ) : (
            <EmptyState
              title="Belum ada hasil"
              description="Hasil akan tampil setelah kamu menyelesaikan ujian."
            />
          )}
        </DashboardCard>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Jadwal Terdekat</h2>
        <DataTable
          columns={["Ujian", "Mapel", "Waktu", "Durasi", "Status", "Aksi"]}
          isEmpty={upcomingSchedules.length === 0 && activeSchedules.length === 0}
          empty={
            <EmptyState
              title="Belum ada jadwal dekat"
              description="Jadwal akan tampil setelah kelasmu menjadi target ujian."
            />
          }
        >
          {[...activeSchedules, ...upcomingSchedules].slice(0, 6).map((schedule) => {
            const participant = getParticipant(schedule);
            const activeAttempt = participant?.exam_attempts?.find(
              (attempt) => attempt.status === "in_progress",
            );

            return (
              <tr key={schedule.id}>
                <td className="px-4 py-3 font-medium">{schedule.title}</td>
                <td className="px-4 py-3">
                  {schedule.exam_packages?.subjects?.code ?? "-"}
                  <div className="text-xs text-muted-foreground">
                    {schedule.exam_packages?.subjects?.name ?? ""}
                  </div>
                </td>
                <td className="px-4 py-3 text-xs">
                  {formatDateTime(schedule.start_at)}
                  <br />
                  {formatDateTime(schedule.end_at)}
                </td>
                <td className="px-4 py-3">
                  {schedule.exam_packages?.duration_minutes ?? "-"} menit
                </td>
                <td className="px-4 py-3">
                  <StatusPill value={participant?.status ?? schedule.status} />
                </td>
                <td className="px-4 py-3">
                  {activeAttempt ? (
                    <Link
                      href={`/dashboard/exam-room/${activeAttempt.id}`}
                      className="rounded-md border px-3 py-1.5 text-xs hover:bg-muted"
                    >
                      Lanjutkan
                    </Link>
                  ) : activeSchedules.some((item) => item.id === schedule.id) ? (
                    <Link
                      href="/dashboard/student/active-exams"
                      className="rounded-md border px-3 py-1.5 text-xs hover:bg-muted"
                    >
                      Mulai
                    </Link>
                  ) : (
                    <span className="text-xs text-muted-foreground">Menunggu</span>
                  )}
                </td>
              </tr>
            );
          })}
        </DataTable>
      </section>
    </div>
  );
}

function LatestAttemptCard({
  attempt,
}: {
  attempt: Awaited<ReturnType<typeof getStudentSubmittedAttempts>>[number];
}) {
  const schedule = firstRelation(attempt.exam_schedules);
  const examPackage = firstRelation(schedule?.exam_packages);
  const subject = firstRelation(examPackage?.subjects);
  const canShowScore =
    Boolean(examPackage?.show_result) &&
    attempt.grading_status !== "needs_manual_grading";

  return (
    <div className="rounded-md border p-3">
      <div className="font-medium">{schedule?.title ?? "Ujian"}</div>
      <div className="mt-1 text-sm text-muted-foreground">
        {subject?.code ?? "-"} · {subject?.name ?? "Mapel"}
      </div>
      <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <div className="text-xs text-muted-foreground">Dikumpulkan</div>
          <div>{formatDateTime(attempt.submitted_at)}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Skor</div>
          <div>{canShowScore ? scoreText(attempt.score, attempt.max_score) : "Menunggu hasil"}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Status</div>
          <StatusPill value={attempt.grading_status ?? attempt.status} />
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Detail</div>
          <Link
            href={`/dashboard/exam-results/${attempt.id}`}
            className="text-primary hover:underline"
          >
            Buka hasil
          </Link>
        </div>
      </div>
    </div>
  );
}
