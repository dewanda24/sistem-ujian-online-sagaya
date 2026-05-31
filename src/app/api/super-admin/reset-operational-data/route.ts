import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { resetOperationalData } from "@/features/operational-reset/reset-operational-data";
import { OPERATIONAL_RESET_CONFIRMATION } from "@/features/operational-reset/reset-plan";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (user?.roles?.name !== "super_admin" || user.status !== "active") {
    return NextResponse.json(
      { ok: false, message: "Hanya Super Admin yang dapat reset data." },
      { status: 403 },
    );
  }

  const body = await request.json().catch(() => null);

  if (body?.confirmation !== OPERATIONAL_RESET_CONFIRMATION) {
    return NextResponse.json(
      {
        ok: false,
        message: `Ketik ${OPERATIONAL_RESET_CONFIRMATION} untuk konfirmasi.`,
      },
      { status: 400 },
    );
  }

  try {
    const summary = await resetOperationalData(user);

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/super-admin");

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
