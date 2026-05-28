"use client";

import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

interface ConfirmSubmitButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  confirmMessage: string;
  variant?: "default" | "danger" | "outline";
}

export function ConfirmSubmitButton({
  children,
  className,
  confirmMessage,
  variant = "outline",
  onClick,
  ...props
}: ConfirmSubmitButtonProps) {
  return (
    <button
      {...props}
      type="submit"
      onClick={(event) => {
        onClick?.(event);

        if (event.defaultPrevented) {
          return;
        }

        if (!window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
      className={cn(
        "rounded-md px-3 py-1.5 text-xs transition disabled:cursor-not-allowed disabled:opacity-50",
        variant === "default" &&
          "bg-primary font-medium text-primary-foreground hover:bg-primary/90",
        variant === "danger" &&
          "border text-destructive hover:bg-muted",
        variant === "outline" && "border hover:bg-muted",
        className,
      )}
    >
      {children}
    </button>
  );
}
