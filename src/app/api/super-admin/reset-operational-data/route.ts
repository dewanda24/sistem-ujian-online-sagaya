import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { resetOperationalData } from "@/features/operational-reset/reset-operational-data";
import {
  OPERATIONAL_RESET_CONFIRMATION,
  operationalResetScopes,
  type OperationalResetScope,
} from "@/features/operational-reset/reset-plan";
import {
  DEMO_MUTATION_BLOCKED_MESSAGE,
  isDemoUser,
} from "@/lib/auth/demo-mode";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (user?.roles?.name !== "super_admin" || user.status !== "active") {
    return NextResponse.json(
      { ok: false, message: "Hanya Super Admin yang dapat reset data." },
      { status: 403 },
    );
  }

  if (isDemoUser(user)) {
    return NextResponse.json(
      { ok: false, message: DEMO_MUTATION_BLOCKED_MESSAGE },
      { status: 403 },
    );
  }

  const body = await request.json().catch(() => null);
  const allowedScopes = new Set<OperationalResetScope>(
    operationalResetScopes.map((scope) => scope.id),
  );
  const scopes = Array.isArray(body?.scopes)
    ? body.scopes.filter(
        (scope: unknown): scope is OperationalResetScope =>
          typeof scope === "string" &&
          allowedScopes.has(scope as OperationalResetScope),
      )
    : [];

  if (body?.confirmation !== OPERATIONAL_RESET_CONFIRMATION) {
    return NextResponse.json(
      {
        ok: false,
        message: `Ketik ${OPERATIONAL_RESET_CONFIRMATION} untuk konfirmasi.`,
      },
      { status: 400 },
    );
  }

  if (scopes.length === 0) {
    return NextResponse.json(
      { ok: false, message: "Pilih minimal satu kategori data untuk reset." },
      { status: 400 },
    );
  }

  try {
    const summary = await resetOperationalData(user, scopes);

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/super-admin");
    revalidatePath("/dashboard/super-admin/settings");

    return NextResponse.json({
      ok: true,
      message: "Data operasional berhasil dikosongkan.",
      summary,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "Reset data operasional gagal.",
      },
      { status: 500 },
    );
  }
}
