import Link from "next/link";
import { AlertCircle, Inbox, Loader2 } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
  icon?: "empty" | "error" | "loading";
}

export function EmptyState({
  title,
  description,
  actionHref,
  actionLabel,
  icon = "empty",
}: EmptyStateProps) {
  const Icon = icon === "error" ? AlertCircle : icon === "loading" ? Loader2 : Inbox;

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-[#F1F5F9] text-[#64748B] mb-4">
        <Icon className={`size-8 ${icon === "loading" ? "animate-spin" : ""}`} />
      </div>
      <p className="text-[17px] font-semibold text-[#1E293B] mb-2">{title}</p>
      <p className="text-[14px] leading-relaxed text-[#64748B] max-w-xs">{description}</p>
      {actionHref && actionLabel ? (
        <Link
          href={actionHref}
          className="mt-6 md-btn-filled text-[14px]"
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}

export function ErrorState({
  title = "Terjadi Kesalahan",
  description = "Gagal memuat data. Coba lagi.",
  actionHref = ".",
  actionLabel = "Coba Lagi",
}: Partial<Pick<EmptyStateProps, "title" | "description" | "actionHref" | "actionLabel">>) {
  return (
    <EmptyState
      title={title}
      description={description}
      actionHref={actionHref}
      actionLabel={actionLabel}
      icon="error"
    />
  );
}

export function LoadingState({
  title = "Memuat data...",
  description = "Harap tunggu sebentar.",
}: Partial<Pick<EmptyStateProps, "title" | "description">>) {
  return <EmptyState title={title} description={description} icon="loading" />;
}
