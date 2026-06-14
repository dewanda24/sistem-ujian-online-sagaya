export type ActionResult = {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
};

type FriendlyErrorInput =
  | string
  | {
      message?: string | null;
      code?: string | null;
      details?: string | null;
    }
  | null
  | undefined;

function normalizeError(input: FriendlyErrorInput) {
  if (!input) {
    return "";
  }

  if (typeof input === "string") {
    return input;
  }

  return [input.message, input.details, input.code].filter(Boolean).join(" ");
}

export function getFriendlyErrorMessage(input: FriendlyErrorInput) {
  const rawMessage = normalizeError(input);
  const message = rawMessage.toLowerCase();

  if (!rawMessage.trim()) {
    return "Terjadi kesalahan.";
  }

  if (
    message.includes("duplicate") ||
    message.includes("unique") ||
    message.includes("already exists") ||
    message.includes("already registered") ||
    message.includes("has already been registered") ||
    message.includes("violates unique constraint")
  ) {
    if (message.includes("email")) {
      return "Email sudah digunakan.";
    }

    if (message.includes("username")) {
      return "Username sudah digunakan.";
    }

    if (message.includes("npsn")) {
      return "NPSN sudah terdaftar.";
    }

    return "Data sudah terdaftar.";
  }

  if (message.includes("invalid login credentials")) {
    return "Email atau password tidak sesuai.";
  }

  if (
    message.includes("permission") ||
    message.includes("not authorized") ||
    message.includes("row-level security") ||
    message.includes("violates row-level security policy")
  ) {
    return "Anda tidak memiliki akses untuk melakukan aksi ini.";
  }

  if (message.includes("foreign key") || message.includes("violates")) {
    return "Data terkait tidak valid atau belum tersedia.";
  }

  if (message.includes("network") || message.includes("fetch failed")) {
    return "Koneksi bermasalah. Coba lagi beberapa saat.";
  }

  if (
    message.includes("supabase") ||
    message.includes("postgres") ||
    message.includes("sql") ||
    message.includes("constraint") ||
    message.includes("uuid")
  ) {
    return "Terjadi kesalahan.";
  }

  return rawMessage;
}

export function actionSuccess(message: string): ActionResult {
  return {
    success: true,
    message,
  };
}

export function actionFailure(
  error: FriendlyErrorInput,
  fallback = "Terjadi kesalahan.",
  errors?: Record<string, string[]>,
): ActionResult {
  const message = getFriendlyErrorMessage(error) || fallback;

  return {
    success: false,
    message,
    errors,
  };
}

export function toLegacyActionResult(result: ActionResult) {
  return {
    ok: result.success,
    message: result.message,
    errors: result.errors,
  };
}
