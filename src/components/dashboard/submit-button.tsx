"use client";

import { type ButtonHTMLAttributes, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

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
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-150 select-none active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100",
        variant === "default" &&
          "bg-[#2563EB] text-white shadow-sm hover:bg-blue-700 hover:shadow active:bg-blue-800",
        variant === "outline" &&
          "border border-[#E2E8F0] bg-white text-[#0F172A] shadow-sm hover:bg-[#F8FAFC] hover:border-slate-300",
        variant === "danger" &&
          "bg-[#EF4444] text-white shadow-sm hover:bg-red-600 hover:shadow active:bg-red-700",
        className,
      )}
    >
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin shrink-0" />
          <span>{loadingText}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}

