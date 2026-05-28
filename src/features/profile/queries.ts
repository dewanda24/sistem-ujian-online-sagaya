import { requireAuth } from "@/lib/auth/require-auth";
import { createClient } from "@/lib/supabase/server";

type Relation<T> = T | T[] | null | undefined;

function firstRelation<T>(value: Relation<T>): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export async function getProfileSettings() {
  const user = await requireAuth();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("users")
    .select(
      "id, username, email, status, roles(name, label), user_profiles(full_name, avatar_url, nip, nis, nisn, phone)",
    )
    .eq("id", user.id)
    .single();

  if (error || !data) {
    return {
      user,
      profile: {
        full_name: user.user_profiles?.full_name ?? "",
        avatar_url: user.user_profiles?.avatar_url ?? "",
        nip: "",
        nis: "",
        nisn: "",
        phone: "",
      },
    };
  }

  return {
    user: {
      ...user,
      username: data.username ?? user.username,
      email: data.email ?? user.email,
      status: data.status ?? user.status,
      roles: firstRelation(data.roles) ?? user.roles,
    },
    profile:
      firstRelation(data.user_profiles) ?? {
        full_name: user.user_profiles?.full_name ?? "",
        avatar_url: user.user_profiles?.avatar_url ?? "",
        nip: "",
        nis: "",
        nisn: "",
        phone: "",
      },
  };
}
