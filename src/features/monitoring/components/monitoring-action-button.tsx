"use client";

import type { ReactNode } from "react";

import { ConfirmSubmitButton } from "@/components/dashboard/confirm-submit-button";

type MonitoringActionButtonProps = {
  children: ReactNode;
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
  return (
    <ConfirmSubmitButton
      className={className}
      confirmMessage={confirmMessage}
      confirmationText={variant === "danger" ? "RESET" : undefined}
      disabled={disabled}
      variant={variant === "danger" ? "danger" : "outline"}
    >
      {children}
    </ConfirmSubmitButton>
  );
}
