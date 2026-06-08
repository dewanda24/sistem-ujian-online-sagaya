import Link from "next/link";
import { AlertCircle, Inbox, Loader2 } from "lucide-react";

import { UI_LABELS } from "@/constants/ui-labels";

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
    <div className="rounded-xl border border-dashed border-[#E2E8F0] bg-[#F8FAFC] p-6 text-center sm:p-8">
      <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-xl border border-[#E2E8F0] bg-white text-[#64748B]">
        <Icon className={`size-5 ${icon === "loading" ? "animate-spin" : ""}`} />
      </div>
      <h3 className="text-sm font-semibold text-[#0F172A]">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#64748B]">
        {description}
      </p>
      {actionHref && actionLabel ? (
        <Link
          href={actionHref}
          className="mt-4 inline-flex rounded-xl bg-[#2563EB] px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}

export function ErrorState({
  title = UI_LABELS.messages.unexpectedError,
  description = UI_LABELS.messages.loadFailed,
  actionHref = ".",
  actionLabel = UI_LABELS.actions.retry,
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
  title = UI_LABELS.messages.loadingData,
  description = UI_LABELS.messages.loadingDescription,
}: Partial<Pick<EmptyStateProps, "title" | "description">>) {
  return <EmptyState title={title} description={description} icon="loading" />;
}
