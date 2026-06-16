import { NextResponse } from "next/server";

import { hasPermission } from "@/lib/auth/has-permission";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { createClient } from "@/lib/supabase/server";

const BUCKET = "question-media";
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "audio/mpeg",
  "audio/wav",
  "audio/mp4",
  "audio/aac",
  "audio/ogg",
  "video/mp4",
  "video/webm",
  "video/ogg",
  "application/pdf",
]);

export async function GET(request: Request) {
  const user = await getCurrentUser();

  if (!user?.school_id) {
    return NextResponse.json(
      { ok: false, message: "Akun belum memiliki scope sekolah." },
      { status: 403 },
    );
  }

  const path = new URL(request.url).searchParams.get("path") ?? "";
  const mediaSchoolId = path.split("/")[0];

  if (!path || mediaSchoolId !== user.school_id) {
    return NextResponse.json(
      { ok: false, message: "Media tidak dapat diakses." },
      { status: 403 },
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.storage.from(BUCKET).download(path);

  if (error || !data) {
    return NextResponse.json(
      { ok: false, message: error?.message ?? "Media tidak ditemukan." },
      { status: 404 },
    );
  }

  return new Response(data, {
    headers: {
      "Cache-Control": "private, max-age=3600",
      "Content-Type": data.type || "application/octet-stream",
    },
  });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (
    !hasPermission(user, "question_bank.manage") &&
    !hasPermission(user, "questions.create") &&
    !hasPermission(user, "questions.update")
  ) {
    return NextResponse.json(
      { ok: false, message: "Tidak memiliki akses upload media soal." },
      { status: 403 },
    );
  }

  if (!user?.school_id) {
    return NextResponse.json(
      { ok: false, message: "Akun belum memiliki scope sekolah." },
      { status: 403 },
    );
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { ok: false, message: "File media wajib dipilih." },
      { status: 400 },
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { ok: false, message: "Ukuran file maksimal 10 MB." },
      { status: 400 },
    );
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { ok: false, message: "Tipe file tidak didukung." },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const extension = getExtension(file.name, file.type);
  const path = `${user.school_id}/${user.id}/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}${extension}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    return NextResponse.json(
      { ok: false, message: error.message },
      { status: 500 },
    );
  }

  const stableUrl = `/api/question-bank/media?path=${encodeURIComponent(path)}`;

  return NextResponse.json({
    ok: true,
    url: stableUrl,
    storage_path: path,
    media_type: resolveMediaType(file.type),
    file_name: file.name,
  });
}

function getExtension(fileName: string, mimeType: string) {
  const extension = fileName.match(/\.[a-z0-9]+$/i)?.[0];

  if (extension) {
    return extension.toLowerCase();
  }

  if (mimeType === "application/pdf") return ".pdf";
  if (mimeType.startsWith("image/")) return ".png";
  if (mimeType.startsWith("audio/")) return ".mp3";
  if (mimeType.startsWith("video/")) return ".mp4";

  return "";
}

function resolveMediaType(mimeType: string) {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType === "application/pdf") return "file";

  return "file";
}
