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

  const [isZoomed, setIsZoomed] = useState(false);

  if (!url) {
    return null;
  }

  const resolvedType = resolveMediaType(mediaType, url);
  const label = caption || title || mediaLabel(resolvedType);

  if (resolvedType === "image") {
    if (imageError) {
      return (
        <div
          className={`flex items-center gap-2 rounded-xl border border-dashed border-slate-200 px-3 py-2 text-xs text-slate-500 ${className}`}
        >
          <ImageOff className="size-4 text-slate-400" />
          Gambar tidak dapat dimuat.{" "}
          <a
            href={url}
            className="text-blue-600 font-bold hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            Buka link
          </a>
        </div>
      );
    }

    return (
      <>
        <div className="group relative inline-block max-w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={label}
            onError={() => setImageError(true)}
            onClick={() => setIsZoomed(true)}
            className={`max-h-80 w-full cursor-zoom-in object-contain transition-transform duration-200 group-hover:scale-[1.01] ${className}`}
          />
          <button
            type="button"
            onClick={() => setIsZoomed(true)}
            className="absolute bottom-2 right-2 flex items-center gap-1 rounded-lg bg-slate-900/80 px-2 py-1 text-[10px] font-bold text-white backdrop-blur-xs shadow-xs hover:bg-slate-900 active:scale-95 transition"
            title="Klik untuk memperbesar gambar"
          >
            <span>🔍 Ketuk untuk Perbesar</span>
          </button>
        </div>

        {/* FULLSCREEN LIGHTBOX ZOOM MODAL */}
        {isZoomed ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 backdrop-blur-sm animate-in fade-in select-none"
            onClick={() => setIsZoomed(false)}
          >
            <div
              className="relative max-h-[92vh] max-w-[95vw] overflow-auto rounded-2xl bg-slate-950 p-2 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-800 p-2 text-white">
                <span className="text-xs font-bold text-slate-200 truncate pr-2">
                  {label}
                </span>
                <button
                  type="button"
                  onClick={() => setIsZoomed(false)}
                  className="rounded-lg bg-slate-800 px-3 py-1 text-xs font-bold text-white hover:bg-slate-700 active:scale-95 transition"
                >
                  Tutup [ESC]
                </button>
              </div>
              <div className="flex items-center justify-center p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={label}
                  className="max-h-[80vh] max-w-full rounded-lg object-contain"
                />
              </div>
            </div>
          </div>
        ) : null}
      </>
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
