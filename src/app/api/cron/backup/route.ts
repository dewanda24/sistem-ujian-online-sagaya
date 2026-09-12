import { NextResponse } from "next/server";
import { performBackupOperation } from "@/features/super-admin/advanced-actions";

export async function POST(request: Request) {
  return handleBackup(request);
}

export async function GET(request: Request) {
  return handleBackup(request);
}

async function handleBackup(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // Verifikasi token jika CRON_SECRET dikonfigurasi di environment
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: "Unauthorized: Invalid CRON_SECRET token." },
      { status: 401 },
    );
  }

  try {
    const result = await performBackupOperation({
      scope: "global",
      schoolId: null,
      kind: "scheduled",
      createdBy: null,
    });

    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: result.error || "Gagal membuat snapshot cadangan terjadwal.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Cadangan otomatis global berhasil dibuat dan dicatat.",
      jobId: result.jobId,
      rowCounts: result.rowCounts,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Internal Server Error",
      },
      { status: 500 },
    );
  }
}
