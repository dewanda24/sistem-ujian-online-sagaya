import Link from "next/link";

import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { StatusPill } from "@/components/dashboard/status-pill";
import { DataTable } from "@/components/master-data/data-table";
import {
  firstRelation,
  getHomeroomClasses,
  getHomeroomScheduleSummary,
} from "@/features/homeroom/queries";
import { requireRole } from "@/lib/auth/require-role";

function formatDateTime(value?: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function TeacherHomeroomPage() {
  await requireRole("teacher");
  const classes = await getHomeroomClasses();
  const classIds = classes.map((classItem) => classItem.id as string);
  const schedules = await getHomeroomScheduleSummary(classIds);
  const activeMembers = classes.flatMap((classItem) =>
    (classItem.class_members ?? []).filter(
      (member: { left_at?: string | null }) => !member.left_at,
    ),
  );
  const submittedAttempts = schedules.flatMap((schedule) =>
    (schedule.exam_participants ?? [])
      .filter((participant: { class_id?: string | null }) =>
        schedule.classIds.includes(participant.class_id ?? ""),
      )
      .flatMap(
        (participant: {
          exam_attempts?:
            | Array<{ status?: string | null; score?: number | null; max_score?: number | null }>
            | null;
        }) => participant.exam_attempts ?? [],
      )
      .filter((attempt: { status?: string | null }) => attempt.status === "submitted"),
  );
  const averagePercent =
    submittedAttempts.length > 0
      ? submittedAttempts.reduce((total, attempt) => {
          const maxScore = Number(attempt.max_score ?? 0);

          return (
            total +
            (maxScore > 0 ? (Number(attempt.score ?? 0) / maxScore) * 100 : 0)
          );
        }, 0) / submittedAttempts.length
      : 0;

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Kelas Binaan"
        description="Pantau kelas yang diampu sebagai wali kelas berdasarkan homeroom_teacher_id."
      />

      <div className="grid gap-3 md:grid-cols-4">
        <SummaryCard label="Kelas Binaan" value={classes.length} />
        <SummaryCard label="Siswa Aktif" value={activeMembers.length} />
        <SummaryCard label="Jadwal Ujian" value={schedules.length} />
        <SummaryCard label="Rata-rata Nilai" value={`${averagePercent.toFixed(1)}%`} />
      </div>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Daftar Siswa</h2>
        <DataTable
          columns={["Nama", "NIS/NISN", "Kelas", "Status", "Masuk"]}
          isEmpty={activeMembers.length === 0}
          empty={
            <EmptyState
              title="Belum ada siswa aktif"
              description="Siswa akan tampil jika kelas aktif memakai guru ini sebagai wali kelas."
            />
          }
        >
          {classes.flatMap((classItem) =>
            (classItem.class_members ?? [])
              .filter((member: { left_at?: string | null }) => !member.left_at)
              .map(
                (member: {
                  id: string;
                  joined_at?: string | null;
                  users?:
                    | {
                        username?: string | null;
                        email?: string | null;
                        status?: string | null;
                        user_profiles?:
                          | {
                              full_name?: string | null;
                              nis?: string | null;
                              nisn?: string | null;
                            }
                          | Array<{
                              full_name?: string | null;
                              nis?: string | null;
                              nisn?: string | null;
                            }>
                          | null;
                      }
                    | Array<{
                        username?: string | null;
                        email?: string | null;
                        status?: string | null;
                        user_profiles?: unknown;
                      }>
                    | null;
                }) => {
                  const student = firstRelation(member.users);
                  const profile = firstRelation(
                    student?.user_profiles as
                      | {
                          full_name?: string | null;
                          nis?: string | null;
                          nisn?: string | null;
                        }
                      | Array<{
                          full_name?: string | null;
                          nis?: string | null;
                          nisn?: string | null;
                        }>
                      | null
                      | undefined,
                  );

                  return (
                    <tr key={member.id}>
                      <td className="px-4 py-3">
                        <div className="font-medium">
                          {profile?.full_name ?? student?.username ?? "-"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {student?.email ?? ""}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {profile?.nis ?? "-"} / {profile?.nisn ?? "-"}
                      </td>
                      <td className="px-4 py-3">{classItem.name}</td>
                      <td className="px-4 py-3">
                        <StatusPill value={student?.status ?? "unknown"} />
                      </td>
                      <td className="px-4 py-3">{member.joined_at ?? "-"}</td>
                    </tr>
                  );
                },
              ),
          )}
        </DataTable>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Jadwal & Rekap Ujian Kelas</h2>
        <DataTable
          columns={["Jadwal", "Mapel", "Status", "Waktu", "Peserta", "Submitted", "Monitoring"]}
          isEmpty={schedules.length === 0}
          empty={
            <EmptyState
              title="Belum ada jadwal ujian"
              description="Jadwal akan tampil jika kelas binaan menjadi target ujian."
            />
          }
        >
          {schedules.map((schedule) => {
            const examPackage = firstRelation(schedule.exam_packages);
            const subject = firstRelation(examPackage?.subjects);
            const participants = (schedule.exam_participants ?? []).filter(
              (participant: { class_id?: string | null }) =>
                schedule.classIds.includes(participant.class_id ?? ""),
            );
            const submitted = participants.filter((participant) => {
              const attempt = firstRelation(participant.exam_attempts);

              return attempt?.status === "submitted";
            }).length;
            const primaryClassId = schedule.classIds[0] ?? "";
            const monitoringParams = new URLSearchParams({
              schedule_id: schedule.id,
            });

            if (primaryClassId) {
              monitoringParams.set("class_id", primaryClassId);
            }

            return (
              <tr key={schedule.id}>
                <td className="px-4 py-3 font-medium">{schedule.title}</td>
                <td className="px-4 py-3">
                  {subject?.code ?? "-"} - {subject?.name ?? "Mapel"}
                </td>
                <td className="px-4 py-3">
                  <StatusPill value={schedule.status} />
                </td>
                <td className="px-4 py-3 text-xs">
                  {formatDateTime(schedule.start_at)}
                  <br />
                  {formatDateTime(schedule.end_at)}
                </td>
                <td className="px-4 py-3">{participants.length}</td>
                <td className="px-4 py-3">{submitted}</td>
                <td className="px-4 py-3">
                  <Link
                    href={`/dashboard/teacher/monitoring?${monitoringParams.toString()}`}
                    className="rounded-md border px-3 py-1.5 text-xs hover:bg-muted"
                  >
                    Buka
                  </Link>
                </td>
              </tr>
            );
          })}
        </DataTable>
      </section>
    </div>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
}
