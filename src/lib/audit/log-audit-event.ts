import { createClient as createServiceClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

type JsonObject = Record<string, unknown>;

type LogAuditEventInput = {
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  payload?: JsonObject | null;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export async function logAuditEvent({
  userId,
  action,
  entityType,
  entityId,
  payload,
  ipAddress,
  userAgent,
}: LogAuditEventInput) {
  try {
    const supabase = await getAuditClient();

    await supabase.from("audit_logs").insert({
      user_id: userId ?? null,
      action,
      entity_type: entityType,
      entity_id: entityId ?? null,
      payload: payload ?? null,
      ip_address: ipAddress ?? null,
      user_agent: userAgent ?? null,
    });
  } catch {
    // Audit logging must never break the primary business action.
  }
}

async function getAuditClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && serviceRoleKey) {
    return createServiceClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return createClient();
}
