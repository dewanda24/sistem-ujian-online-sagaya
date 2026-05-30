import { NextResponse } from "next/server";

import {
  getTemplate,
  templateToCsv,
  type TemplateType,
} from "@/features/import-export/templates";
import { logAuditEvent } from "@/lib/audit/log-audit-event";
import { hasPermission } from "@/lib/auth/has-permission";
import { requireAuth } from "@/lib/auth/require-auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ type: string }> },
) {
  const user = await requireAuth();

  if (!hasPermission(user, "import_export.view")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { type } = await params;
  const template = getTemplate(type);

  if (!template) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  const csv = templateToCsv(type as TemplateType);

  await logAuditEvent({
    userId: user.id,
    action: "templates.download",
    entityType: "import_templates",
    entityId: type,
    payload: {
      template_type: type,
      filename: template.filename,
    },
    ipAddress:
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    userAgent: request.headers.get("user-agent"),
  });

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${template.filename}"`,
    },
  });
}
