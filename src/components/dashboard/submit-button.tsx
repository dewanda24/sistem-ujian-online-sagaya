"use client";

import { type ButtonHTMLAttributes, type ReactNode } from "react";
import { useFormStatus } from "react-dom";

import { cn } from "@/lib/utils";

interface SubmitButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  loadingText?: string;
  variant?: "default" | "outline" | "danger";
}

export function SubmitButton({
  children,
  className,
  disabled,
  loadingText = "Memproses...",
  variant = "default",
  ...props
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      {...props}
      type="submit"
      disabled={disabled || pending}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
        variant === "default" && "bg-[#2563EB] text-white hover:bg-blue-700",
        variant === "outline" &&
          "border border-[#E2E8F0] text-[#0F172A] hover:bg-[#F8FAFC]",
        variant === "danger" &&
          "bg-[#EF4444] text-white hover:bg-red-600",
        className,
      )}
    >
      {pending ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </button>
  );
}
