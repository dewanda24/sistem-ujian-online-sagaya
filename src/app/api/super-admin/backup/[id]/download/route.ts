import { NextResponse, type NextRequest } from "next/server";

import { logAuditEvent } from "@/lib/audit/log-audit-event";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const user = await requireRole("super_admin");
  const { id } = await context.params;
  const supabase = await createClient();

  const { data: job, error } = await supabase
    .from("super_admin_backup_jobs")
    .select("id, scope, school_id, status, row_counts, snapshot, created_at, schools(name)")
    .eq("id", id)
    .maybeSingle();

  if (error || !job) {
    return NextResponse.json(
      { ok: false, message: "Data backup tidak ditemukan." },
      { status: 404 },
    );
  }

  const schoolName = Array.isArray(job.schools)
    ? job.schools[0]?.name
    : (job.schools as { name?: string | null } | null)?.name;

  const dateStr = (job.created_at || new Date().toISOString()).slice(0, 10);
  const scopeTag = job.scope === "school" && schoolName ? `school-${schoolName.replace(/[^a-zA-Z0-9]/g, "_")}` : "global";
  const filename = `sagaya-backup-${scopeTag}-${dateStr}-${id.slice(0, 8)}.json`;

  const exportPayload = {
    backup_id: job.id,
    scope: job.scope,
    school_id: job.school_id,
    school_name: schoolName ?? null,
    created_at: job.created_at,
    row_counts: job.row_counts,
    snapshot: job.snapshot,
    exported_at: new Date().toISOString(),
    exported_by: user.id,
  };

  await logAuditEvent({
    userId: user.id,
    action: "backup.download_json",
    entityType: "super_admin_backup_jobs",
    entityId: job.id,
    payload: {
      scope: job.scope,
      filename,
    },
  });

  return new NextResponse(JSON.stringify(exportPayload, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
