"use client";

type MonitoringActionButtonProps = {
  children: React.ReactNode;
  className?: string;
  confirmMessage: string;
  disabled?: boolean;
  variant?: "danger" | "default";
};

export function MonitoringActionButton({
  children,
  className,
  confirmMessage,
  disabled,
  variant = "default",
}: MonitoringActionButtonProps) {
  const baseClass =
    "rounded-md border px-3 py-1.5 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-50";
  const variantClass =
    variant === "danger"
      ? "border-destructive/40 text-destructive hover:bg-destructive/10"
      : "hover:bg-muted";

  return (
    <button
      disabled={disabled}
      onClick={(event) => {
        if (!window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
      className={`${baseClass} ${variantClass} ${className ?? ""}`}
    >
      {children}
    </button>
  );
}
