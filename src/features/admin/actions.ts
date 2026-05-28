"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient as createServiceClient } from "@supabase/supabase-js";

import { requirePermission } from "@/lib/auth/require-permission";
import { createClient } from "@/lib/supabase/server";
import { adminUserSchema } from "@/lib/validations/admin";

type ActionResult = {
  ok: boolean;
  message: string;
};

function formString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

function redirectTo(path: string, result: ActionResult): never {
  const params = new URLSearchParams({
    status: result.ok ? "success" : "error",
    message: result.message,
  });

  redirect(`${path}${path.includes("?") ? "&" : "?"}${params.toString()}`);
}

function serviceRoleClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    return null;
  }

  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}

export async function saveAdminUserAction(formData: FormData) {
  const parsed = adminUserSchema.safeParse({
    id: formString(formData, "id"),
    auth_user_id: formString(formData, "auth_user_id"),
    email: formString(formData, "email"),
    username: formString(formData, "username"),
    password: formString(formData, "password"),
    full_name: formString(formData, "full_name"),
    role_id: formString(formData, "role_id"),
    status: formString(formData, "status") || "active",
  });

  if (!parsed.success) {
    redirectTo("/dashboard/admin/users", {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Data user tidak valid.",
    });
  }

  await requirePermission(parsed.data.id ? "users.update" : "users.create");
  const supabase = await createClient();
  const adminClient = serviceRoleClient();
  const {
    id,
    auth_user_id,
    email,
    username,
    password,
    full_name,
    role_id,
    status,
  } = parsed.data;
  let authUserId = auth_user_id;

  if (!id) {
    if (!adminClient) {
      redirectTo("/dashboard/admin/users", {
        ok: false,
        message:
          "SUPABASE_SERVICE_ROLE_KEY belum tersedia. User auth tidak dapat dibuat.",
      });
    }

    const { data, error } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error || !data.user) {
      redirectTo("/dashboard/admin/users", {
        ok: false,
        message: error?.message ?? "Gagal membuat auth user.",
      });
    }

    authUserId = data.user.id;
  }

  if (id && authUserId && adminClient && password) {
    const { error } = await adminClient.auth.admin.updateUserById(authUserId, {
      password,
    });

    if (error) {
      redirectTo(`/dashboard/admin/users?edit=${id}`, {
        ok: false,
        message: error.message,
      });
    }
  }

  if (id && authUserId && adminClient) {
    const { error } = await adminClient.auth.admin.updateUserById(authUserId, {
      email,
    });

    if (error) {
      redirectTo(`/dashboard/admin/users?edit=${id}`, {
        ok: false,
        message: error.message,
      });
    }
  }

  const userPayload = {
    auth_user_id: authUserId,
    email,
    username,
    role_id,
    status,
  };

  const { data: savedUser, error: userError } = id
    ? await supabase
        .from("users")
        .update(userPayload)
        .eq("id", id)
        .select("id")
        .single()
    : await supabase.from("users").insert(userPayload).select("id").single();

  if (userError || !savedUser) {
    redirectTo(id ? `/dashboard/admin/users?edit=${id}` : "/dashboard/admin/users", {
      ok: false,
      message: userError?.message ?? "Gagal menyimpan user.",
    });
  }

  const { error: profileError } = await supabase.from("user_profiles").upsert(
    {
      user_id: savedUser.id,
      full_name,
    },
    { onConflict: "user_id" },
  );

  revalidatePath("/dashboard/admin/users");
  redirectTo("/dashboard/admin/users", {
    ok: !profileError,
    message: profileError ? profileError.message : "User berhasil disimpan.",
  });
}

export async function toggleAdminUserStatusAction(formData: FormData) {
  await requirePermission("users.update");
  const supabase = await createClient();
  const id = formString(formData, "id");
  const status = formString(formData, "status") === "active" ? "active" : "inactive";
  const { error } = await supabase.from("users").update({ status }).eq("id", id);

  revalidatePath("/dashboard/admin/users");
  redirectTo("/dashboard/admin/users", {
    ok: !error,
    message: error ? error.message : "Status user berhasil diperbarui.",
  });
}

export async function updateRolePermissionAction(formData: FormData) {
  await requirePermission("roles.manage");
  const supabase = await createClient();
  const roleId = formString(formData, "role_id");
  const permissionId = formString(formData, "permission_id");
  const enabled = formString(formData, "enabled") === "true";

  const { error } = enabled
    ? await supabase
        .from("role_permissions")
        .insert({ role_id: roleId, permission_id: permissionId })
    : await supabase
        .from("role_permissions")
        .delete()
        .eq("role_id", roleId)
        .eq("permission_id", permissionId);

  revalidatePath("/dashboard/admin/permissions");
  redirectTo("/dashboard/admin/permissions", {
    ok: !error,
    message: error ? error.message : "Matrix permission berhasil diperbarui.",
  });
}
