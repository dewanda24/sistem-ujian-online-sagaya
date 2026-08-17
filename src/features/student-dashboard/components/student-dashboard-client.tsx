"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays } from "lucide-react";

import { StudentWelcomeBanner } from "./student-welcome-banner";
import { StudentQuickActions } from "./student-quick-actions";
import { ActiveExamCard, type ActiveExamCardExam } from "./active-exam-card";
import { EmptyExamState } from "./empty-exam-state";
import { UpcomingExamCard, type UpcomingExamCardExam } from "./upcoming-exam-card";
import { StudentLatestResultsList } from "./student-latest-results-list";
import {
  StudentNotificationDrawer,
  type StudentNotificationItem,
} from "./student-notification-drawer";
import { PwaInstallBanner } from "./pwa-install-banner";

interface StudentDashboardClientProps {
  studentName: string;
  activeExam: ActiveExamCardExam | null;
  activeExamCount: number;
  upcomingExams: UpcomingExamCardExam[];
  latestAttempts: any[];
  startExamAction: (formData: FormData) => void | Promise<void>;
  notifications: StudentNotificationItem[];
  statusType: "active" | "empty" | "waiting_grading" | "result_ready";
}

export function StudentDashboardClient({
  studentName,
  activeExam,
  activeExamCount,
  upcomingExams,
  latestAttempts,
  startExamAction,
  notifications,
  statusType,
}: StudentDashboardClientProps) {
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(
    notifications.filter((n) => !n.isRead).length,
  );

  useEffect(() => {
    const handleOpen = () => {
      setNotificationOpen(true);
    };

    window.addEventListener("sagaya-open-notifications", handleOpen);
    return () => {
      window.removeEventListener("sagaya-open-notifications", handleOpen);
    };
  }, []);

  const handleMarkAllRead = () => {
    setUnreadCount(0);
  };

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* PWA 1-Click Install Banner for mobile */}
      <PwaInstallBanner />

      {/* Sapaan Ramah Siswa (Banner) */}
      <StudentWelcomeBanner
        studentName={studentName}
        statusType={statusType}
      />

      {/* Adaptive Hero Card (Ujian Aktif / Status Ujian) */}
      <section className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wider">
              {activeExam?.status === "in_progress" || activeExam?.status === "not_started"
                ? "Ujian Aktif"
                : "Aktivitas Ujian"}
            </h2>
            {activeExamCount > 0 && (
              <span className="flex size-2 rounded-full bg-emerald-500 animate-ping" />
            )}
          </div>
          {activeExamCount > 1 && (
            <Link
              href="/dashboard/student/active-exams"
              className="text-xs font-bold text-blue-600 hover:text-blue-700 transition"
            >
              Lihat Semua ({activeExamCount})
            </Link>
          )}
        </div>

        {activeExam ? (
          <ActiveExamCard exam={activeExam} action={startExamAction} />
        ) : (
          <EmptyExamState />
        )}
      </section>

      {/* Quick Actions (4 Menu Cepat) */}
      <StudentQuickActions
        activeCount={activeExamCount}
        upcomingCount={upcomingExams.length}
        historyCount={latestAttempts.length}
        unreadNotificationCount={unreadCount}
        onOpenNotifications={() => setNotificationOpen(true)}
      />

      {/* 2-Column Grid for Upcoming Schedules & Latest Results */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Jadwal Mendatang */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
              Jadwal Mendatang
            </h3>
            <Link
              href="/dashboard/student/schedules"
              className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 transition"
            >
              <span>Lihat Semua</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>

          {upcomingExams.length > 0 ? (
            <div className="space-y-2.5">
              {upcomingExams.map((exam) => (
                <UpcomingExamCard key={exam.id} exam={exam} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-white p-6 text-center shadow-2xs">
              <div className="flex size-10 items-center justify-center rounded-xl bg-slate-100 text-slate-400 mb-2">
                <CalendarDays className="size-5" />
              </div>
              <p className="text-xs font-bold text-slate-700">
                Belum ada jadwal ujian mendatang
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Jadwal ujian kelasmu akan otomatis muncul di sini.
              </p>
            </div>
          )}
        </section>

        {/* Hasil Terbaru */}
        <section>
          <StudentLatestResultsList
            attempts={latestAttempts}
            maxDisplay={3}
          />
        </section>
      </div>

      {/* Notifikasi & Pengingat Drawer (Preview 3.6) */}
      <StudentNotificationDrawer
        isOpen={notificationOpen}
        onClose={() => setNotificationOpen(false)}
        notifications={notifications}
        onMarkAllAsRead={handleMarkAllRead}
      />
    </div>
  );
}
