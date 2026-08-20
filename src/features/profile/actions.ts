"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getFriendlyErrorMessage } from "@/lib/actions/action-result";
import { requireAuth } from "@/lib/auth/require-auth";
import { createClient } from "@/lib/supabase/server";
import { getServiceRoleClient } from "@/lib/supabase/admin";

const profileSettingsSchema = z.object({
  full_name: z.string().min(2, "Nama lengkap wajib diisi"),
  phone: z.string().optional().default(""),
  avatar_url: z.string().url("Avatar URL tidak valid").or(z.literal("")).default(""),
});

const changePasswordSchema = z
  .object({
    new_password: z.string().min(6, "Password baru minimal 6 karakter"),
    confirm_password: z.string().min(6, "Konfirmasi password minimal 6 karakter"),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Konfirmasi password tidak cocok dengan password baru",
    path: ["confirm_password"],
  });

function formString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

function redirectTo(result: { ok: boolean; message: string }): never {
  const params = new URLSearchParams({
    status: result.ok ? "success" : "error",
    message: result.ok ? result.message : getFriendlyErrorMessage(result.message),
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
  const dbClient = getServiceRoleClient() ?? supabase;
  const { error } = await dbClient.from("user_profiles").upsert(
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
    message: error ? getFriendlyErrorMessage(error) : "Profil berhasil diperbarui.",
  });
}

export async function changePasswordAction(formData: FormData) {
  const user = await requireAuth();
  const parsed = changePasswordSchema.safeParse({
    new_password: formString(formData, "new_password"),
    confirm_password: formString(formData, "confirm_password"),
  });

  if (!parsed.success) {
    redirectTo({
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Password tidak valid.",
    });
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.new_password,
  });

  revalidatePath("/dashboard/profile");
  redirectTo({
    ok: !error,
    message: error
      ? getFriendlyErrorMessage(error)
      : "Kata sandi akun Anda berhasil diubah. Gunakan kata sandi baru untuk login berikutnya.",
  });
}
