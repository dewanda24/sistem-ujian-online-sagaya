"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAuth } from "@/lib/auth/require-auth";
import { createClient } from "@/lib/supabase/server";

const profileSettingsSchema = z.object({
  full_name: z.string().min(2, "Nama lengkap wajib diisi"),
  phone: z.string().optional().default(""),
  avatar_url: z.string().url("Avatar URL tidak valid").or(z.literal("")).default(""),
});

function formString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

function redirectTo(result: { ok: boolean; message: string }): never {
  const params = new URLSearchParams({
    status: result.ok ? "success" : "error",
    message: result.message,
  });

  redirect(`/dashboard/profile?${params.toString()}`);
}

export async function saveProfileSettingsAction(formData: FormData) {
  const user = await requireAuth();
  const parsed = profileSettingsSchema.safeParse({
    full_name: formString(formData, "full_name"),
    phone: formString(formData, "phone"),
    avatar_url: formString(formData, "avatar_url"),
  });

  if (!parsed.success) {
    redirectTo({
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Data profil tidak valid.",
    });
  }

  const supabase = await createClient();
  const { error } = await supabase.from("user_profiles").upsert(
    {
      user_id: user.id,
      full_name: parsed.data.full_name,
      phone: parsed.data.phone,
      avatar_url: parsed.data.avatar_url || null,
    },
    { onConflict: "user_id" },
  );

  revalidatePath("/dashboard/profile");
  redirectTo({
    ok: !error,
    message: error ? error.message : "Profil berhasil diperbarui.",
  });
}
