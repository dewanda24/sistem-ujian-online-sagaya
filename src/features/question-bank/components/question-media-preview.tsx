"use client";

import { FileText, ImageOff, PlaySquare, Volume2 } from "lucide-react";
import { useState } from "react";

type QuestionMediaPreviewProps = {
  mediaType?: string | null;
  url?: string | null;
  title?: string | null;
  caption?: string | null;
  className?: string;
};

export function QuestionMediaPreview({
  mediaType,
  url,
  title,
  caption,
  className = "",
}: QuestionMediaPreviewProps) {
  const [imageError, setImageError] = useState(false);

  if (!url) {
    return null;
  }

  const resolvedType = resolveMediaType(mediaType, url);
  const label = caption || title || mediaLabel(resolvedType);

  if (resolvedType === "image") {
    if (imageError) {
      return (
        <div
          className={`flex items-center gap-2 rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground ${className}`}
        >
          <ImageOff className="size-4" />
          Gambar tidak dapat dimuat.{" "}
          <a
            href={url}
            className="text-primary hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            Buka link
          </a>
        </div>
      );
    }

    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={label}
        onError={() => setImageError(true)}
        className={`max-h-80 w-full rounded-md border object-contain ${className}`}
      />
    );
  }

  if (resolvedType === "pdf") {
    return (
      <div
        className={`flex items-center justify-between gap-3 rounded-md border p-3 text-sm ${className}`}
      >
        <span className="flex items-center gap-2 font-medium">
          <FileText className="size-4 text-destructive" />
          {label}
        </span>
        <a
          href={url}
          className="rounded-md border px-3 py-1.5 text-xs hover:bg-muted"
          target="_blank"
          rel="noreferrer"
        >
          Buka dokumen
        </a>
      </div>
    );
  }

  if (resolvedType === "video") {
    return (
      <div className={`rounded-md border p-3 ${className}`}>
        <div className="mb-2 flex items-center gap-2 text-sm font-medium">
          <PlaySquare className="size-4" />
          {label}
        </div>
        {isDirectVideoUrl(url) ? (
          <video src={url} controls className="max-h-80 w-full rounded-md border" />
        ) : (
          <a
            href={url}
            className="text-sm text-primary hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            Buka video
          </a>
        )}
      </div>
    );
  }

  if (resolvedType === "audio") {
    return (
      <div className={`rounded-md border p-3 ${className}`}>
        <div className="mb-2 flex items-center gap-2 text-sm font-medium">
          <Volume2 className="size-4" />
          {label}
        </div>
        <audio src={url} controls className="w-full" />
      </div>
    );
  }

  return (
    <a
      href={url}
      className={`inline-flex rounded-md border px-3 py-2 text-sm text-primary hover:bg-muted ${className}`}
      target="_blank"
      rel="noreferrer"
    >
      {label}
    </a>
  );
}

function resolveMediaType(mediaType: string | null | undefined, url: string) {
  if (isPdfUrl(url)) {
    return "pdf";
  }

  if (mediaType === "image" || isImageUrl(url)) {
    return "image";
  }

  if (mediaType === "video" || isDirectVideoUrl(url)) {
    return "video";
  }

  if (mediaType === "audio" || isDirectAudioUrl(url)) {
    return "audio";
  }

  return mediaType || "link";
}

function mediaLabel(mediaType: string) {
  if (mediaType === "pdf") {
    return "Dokumen PDF";
  }

  if (mediaType === "video") {
    return "Media video";
  }

  if (mediaType === "image") {
    return "Media gambar";
  }

  if (mediaType === "audio") {
    return "Media audio";
  }

  return "Buka media";
}

function isImageUrl(value: string) {
  return /^https?:\/\/\S+\.(png|jpe?g|gif|webp|svg)(\?\S*)?$/i.test(value);
}

function isPdfUrl(value: string) {
  return /^https?:\/\/\S+\.pdf(\?\S*)?$/i.test(value);
}

function isDirectVideoUrl(value: string) {
  return /^https?:\/\/\S+\.(mp4|webm|ogg)(\?\S*)?$/i.test(value);
}

function isDirectAudioUrl(value: string) {
  return /^https?:\/\/\S+\.(mp3|wav|m4a|aac|ogg)(\?\S*)?$/i.test(value);
}
