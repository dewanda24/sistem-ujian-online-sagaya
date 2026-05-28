import { NextResponse } from "next/server";

import { getReportsByStudent, toCsv } from "@/features/reports/queries";
import { hasPermission } from "@/lib/auth/has-permission";
import { requireAuth } from "@/lib/auth/require-auth";

export async function GET() {
  const user = await requireAuth();

  if (!hasPermission(user, "reports.export")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows = await getReportsByStudent();
  const csv = toCsv(
    rows.map((row) => ({
      siswa: row.studentName,
      nis: row.nis,
      ujian: row.examTitle,
      mapel: row.subject,
      skor: row.score,
      skor_maks: row.maxScore,
      persen: row.percent.toFixed(2),
      status: row.status,
      grading_status: row.gradingStatus,
    })),
  );

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="exam-report.csv"',
    },
  });
}
