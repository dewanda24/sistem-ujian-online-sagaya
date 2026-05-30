import { NextResponse } from "next/server";

import {
  filterStudentReportRows,
  getReportsByClass,
  getReportsByExam,
  getReportsByStudent,
  getReportsBySubject,
  toCsv,
} from "@/features/reports/queries";
import { logAuditEvent } from "@/lib/audit/log-audit-event";
import { hasPermission } from "@/lib/auth/has-permission";
import { requireAuth } from "@/lib/auth/require-auth";

export async function GET(request: Request) {
  const user = await requireAuth();

  if (!hasPermission(user, "reports.export")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const reportType = url.searchParams.get("type") ?? "students";
  const filters = {
    q: url.searchParams.get("q"),
    status: url.searchParams.get("status"),
    grading_status: url.searchParams.get("grading_status"),
    schedule_id: url.searchParams.get("schedule_id"),
    class_id: url.searchParams.get("class_id"),
    subject_id: url.searchParams.get("subject_id"),
    academic_year_id: url.searchParams.get("academic_year_id"),
    semester_id: url.searchParams.get("semester_id"),
  };
  const { csv, rowCount, filename } = await buildReportCsv(reportType, filters);

  await logAuditEvent({
    userId: user.id,
    action: "reports.export",
    entityType: "reports",
    payload: {
      report: reportType,
      filters,
      row_count: rowCount,
    },
  });

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

async function buildReportCsv(
  reportType: string,
  filters: {
    q?: string | null;
    status?: string | null;
    grading_status?: string | null;
    schedule_id?: string | null;
    class_id?: string | null;
    subject_id?: string | null;
    academic_year_id?: string | null;
    semester_id?: string | null;
  },
) {
  if (reportType === "exams") {
    const rows = await getReportsByExam(filters);

    return {
      rowCount: rows.length,
      filename: "exam-report-per-ujian.csv",
      csv: toCsv(
        rows.map((row) => ({
          ujian: row.title,
          attempts: row.count,
          submitted: row.submitted,
          finalized: row.finalized,
          pending_grading: row.pending,
          expired: row.expired,
          absent: row.absent,
          rata_rata_skor: row.averageScore.toFixed(2),
          rata_rata_persen: row.averagePercent.toFixed(2),
        })),
      ),
    };
  }

  if (reportType === "classes") {
    const rows = await getReportsByClass(filters);

    return {
      rowCount: rows.length,
      filename: "exam-report-per-kelas.csv",
      csv: toCsv(
        rows.map((row) => ({
          kelas: row.name,
          attempts: row.count,
          submitted: row.submitted,
          finalized: row.finalized,
          pending_grading: row.pending,
          absent: row.absent,
          completion:
            row.count > 0
              ? ((row.submitted / row.count) * 100).toFixed(2)
              : "0.00",
          rata_rata_persen: row.averagePercent.toFixed(2),
        })),
      ),
    };
  }

  if (reportType === "subjects") {
    const rows = await getReportsBySubject(filters);

    return {
      rowCount: rows.length,
      filename: "exam-report-per-mapel.csv",
      csv: toCsv(
        rows.map((row) => ({
          kode: row.code,
          mapel: row.name,
          attempts: row.count,
          submitted: row.submitted,
          finalized: row.finalized,
          pending_grading: row.pending,
          absent: row.absent,
          rata_rata_persen: row.averagePercent.toFixed(2),
        })),
      ),
    };
  }

  const rows = filterStudentReportRows(await getReportsByStudent(filters), filters);

  return {
    rowCount: rows.length,
    filename: "exam-report-per-siswa.csv",
    csv: toCsv(
      rows.map((row) => ({
        siswa: row.studentName,
        nis: row.nis,
        ujian: row.examTitle,
        mapel: row.subject,
        skor: row.gradingStatus === "finalized" ? row.score : "Belum final",
        skor_maks: row.maxScore,
        persen: row.gradingStatus === "finalized" ? row.percent.toFixed(2) : "Belum final",
        status: row.status,
        grading_status: row.gradingStatus,
      })),
    ),
  };
}
