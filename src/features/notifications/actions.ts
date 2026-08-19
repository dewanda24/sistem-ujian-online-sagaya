"use server";

import { requireAuth } from "@/lib/auth/require-auth";
import { getStudentExamSchedules } from "@/features/exam-room/queries";
import { getStudentSubmittedAttempts, getTeacherResultRecap, firstRelation } from "@/features/results/queries";
import { formatJakartaDate, formatJakartaDateTime } from "@/lib/date-time";
import { getSuperAdminDashboardData } from "@/features/super-admin/school-management";

export type AppNotificationCategory = "all" | "exam" | "system" | "announcement";

export type AppNotificationItem = {
  id: string;
  category: AppNotificationCategory;
  title: string;
  message: string;
  timestamp: string;
  isRead?: boolean;
  actionUrl?: string;
  priority?: "high" | "medium" | "low";
};

export async function getNotificationsAction(): Promise<AppNotificationItem[]> {
  const user = await requireAuth();
  const roleName = user.roles?.name;
  const notifications: AppNotificationItem[] = [];
  const now = new Date();

  try {
    if (roleName === "student") {
      const [schedules, attempts] = await Promise.all([
        getStudentExamSchedules(),
        getStudentSubmittedAttempts(),
      ]);

      const activeSchedules = schedules.filter((schedule) => {
        const startAt = schedule.start_at ? new Date(schedule.start_at) : null;
        const endAt = schedule.end_at ? new Date(schedule.end_at) : null;
        return (
          ["scheduled", "active"].includes(schedule.status) &&
          startAt &&
          endAt &&
          startAt <= now &&
          endAt >= now
        );
      });

      const upcomingSchedules = schedules
        .filter((schedule) => {
          const startAt = schedule.start_at ? new Date(schedule.start_at) : null;
          return ["scheduled", "active"].includes(schedule.status) && startAt && startAt > now;
        })
        .slice(0, 5);

      const latestAttempt = attempts[0] ?? null;

      if (activeSchedules.length > 0) {
        const activeFirst = activeSchedules[0];
        const subjName = activeFirst.exam_packages?.subjects?.name || activeFirst.title;
        notifications.push({
          id: `active-${activeFirst.id}`,
          category: "exam",
          title: "Ujian Dimulai",
          message: `Ujian ${subjName} telah dimulai. Jangan lupa kerjakan sekarang.`,
          timestamp: "Sekarang",
          isRead: false,
          actionUrl: "/dashboard/student/active-exams",
        });
      }

      if (latestAttempt) {
        const schedule = firstRelation(latestAttempt.exam_schedules);
        const examPackage = firstRelation(schedule?.exam_packages);
        const subject = firstRelation(examPackage?.subjects);
        const subjName = subject?.name || schedule?.title || "Ujian";

        if (
          examPackage?.show_result &&
          latestAttempt.grading_status !== "needs_manual_grading" &&
          latestAttempt.score !== null
        ) {
          notifications.push({
            id: `result-${latestAttempt.id}`,
            category: "exam",
            title: "Nilai Tersedia",
            message: `Nilai ${subjName} sudah tersedia (${latestAttempt.score}/${latestAttempt.max_score ?? 100}). Silakan lihat hasil Anda.`,
            timestamp: latestAttempt.submitted_at ? formatJakartaDate(latestAttempt.submitted_at) : "Baru saja",
            isRead: false,
            actionUrl: "/dashboard/student/history",
          });
        }
      }

      if (upcomingSchedules.length > 0) {
        const nextUpcoming = upcomingSchedules[0];
        const subjName = nextUpcoming.exam_packages?.subjects?.name || nextUpcoming.title;
        notifications.push({
          id: `upcoming-${nextUpcoming.id}`,
          category: "exam",
          title: "Ujian Akan Datang",
          message: `Ujian ${subjName} akan dilaksanakan pada ${formatJakartaDateTime(nextUpcoming.start_at)}.`,
          timestamp: formatJakartaDate(nextUpcoming.start_at),
          isRead: true,
          actionUrl: "/dashboard/student/schedules",
        });
      }
    } else if (roleName === "teacher") {
      const attempts = await getTeacherResultRecap({ grading_status: "needs_manual_grading" });
      if (attempts.length > 0) {
        notifications.push({
          id: "needs-grading",
          category: "exam",
          title: "Perlu Koreksi Manual",
          message: `Terdapat ${attempts.length} jawaban esai yang perlu dikoreksi.`,
          timestamp: "Sekarang",
          isRead: false,
          actionUrl: "/dashboard/teacher/grading?grading_status=needs_manual_grading",
          priority: "high",
        });
      }
    } else if (roleName === "super_admin") {
      const { notifications: superAdminNotifs } = await getSuperAdminDashboardData();
      
      superAdminNotifs.forEach((notif) => {
        notifications.push({
          id: `sa-notif-${notif.title}-${notif.href}`,
          category: "system",
          title: notif.title,
          message: notif.description,
          actionUrl: notif.href,
          timestamp: "Penting",
          priority: notif.priority,
          isRead: false,
        });
      });
    } else if (roleName === "admin") {
      // Basic notification for admin if needed
      notifications.push({
        id: "admin-welcome",
        category: "system",
        title: "Selamat datang",
        message: "Sistem beroperasi dengan normal.",
        timestamp: "Sekarang",
        isRead: true,
      });
    }

    return notifications.slice(0, 8); // Max 8 notifications
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
    return [];
  }
}
