"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays } from "lucide-react";

import { StudentWelcomeBanner } from "./student-welcome-banner";
import { ActiveExamCard, type ActiveExamCardExam } from "./active-exam-card";
import { EmptyExamState } from "./empty-exam-state";
import { UpcomingExamCard, type UpcomingExamCardExam } from "./upcoming-exam-card";
import { StudentLatestResultsList } from "./student-latest-results-list";

import { PwaInstallBanner } from "./pwa-install-banner";

interface StudentDashboardClientProps {
  studentName: string;
  activeExam: ActiveExamCardExam | null;
  activeExamCount: number;
  upcomingExams: UpcomingExamCardExam[];
  latestAttempts: any[];
  startExamAction: (formData: FormData) => void | Promise<void>;
  statusType: "active" | "empty" | "waiting_grading" | "result_ready";
}

export function StudentDashboardClient({
  studentName,
  activeExam,
  activeExamCount,
  upcomingExams,
  latestAttempts,
  startExamAction,
  statusType,
}: StudentDashboardClientProps) {
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* PWA Install Banner (bottom priority — only shows when triggered) */}
      <PwaInstallBanner />

      {/* Welcome strip */}
      <StudentWelcomeBanner studentName={studentName} statusType={statusType} />

      {/* ── Hero: Ujian Aktif ── */}
      <section className="space-y-2">
        {activeExamCount > 1 && (
          <div className="flex items-center justify-between px-1 mb-1">
            <div className="flex items-center gap-2">
              <h2 className="text-[13px] font-semibold text-[#1E293B] uppercase tracking-wider">
                Ujian Aktif
              </h2>
              <span className="flex size-2 rounded-full bg-emerald-500 animate-ping" />
            </div>
            <Link
              href="/dashboard/student/active-exams"
              className="text-[13px] font-semibold text-[#2563EB] flex items-center gap-1"
            >
              Lihat Semua ({activeExamCount})
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        )}

        {activeExam ? (
          <ActiveExamCard exam={activeExam} action={startExamAction} />
        ) : (
          <EmptyExamState />
        )}
      </section>

      {/* ── Jadwal Mendatang ── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[15px] font-semibold text-[#1E293B]">Jadwal Mendatang</h3>
          <Link
            href="/dashboard/student/schedules"
            className="flex items-center gap-1 text-[13px] font-semibold text-[#2563EB]"
          >
            Semua <ArrowRight className="size-3.5" />
          </Link>
        </div>

        {upcomingExams.length > 0 ? (
          <div className="md-card-elevated divide-y divide-[#F1F5F9] overflow-hidden">
            {upcomingExams.map((exam) => (
              <UpcomingExamCard key={exam.id} exam={exam} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-[#E2E8F0] bg-white p-8 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-[#F1F5F9] text-[#94A3B8] mb-3">
              <CalendarDays className="size-6" />
            </div>
            <p className="text-[14px] font-semibold text-[#1E293B]">Belum ada jadwal ujian</p>
            <p className="text-[13px] text-[#64748B] mt-1">Jadwal ujianmu akan muncul di sini.</p>
          </div>
        )}
      </section>

      {/* ── Hasil Terbaru ── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[15px] font-semibold text-[#1E293B]">Hasil Terbaru</h3>
          <Link
            href="/dashboard/student/history"
            className="flex items-center gap-1 text-[13px] font-semibold text-[#2563EB]"
          >
            Semua <ArrowRight className="size-3.5" />
          </Link>
        </div>
        <StudentLatestResultsList attempts={latestAttempts} maxDisplay={3} />
      </section>
    </div>
  );
}
