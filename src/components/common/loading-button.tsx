"use client";

import { ReactNode } from "react";

export interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loadingText?: string;
  children: ReactNode;
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
}

export function LoadingButton({
  isLoading = false,
  loadingText = "Memproses...",
  children,
  variant = "default",
  disabled,
  className = "",
  ...props
}: LoadingButtonProps) {
  const baseClasses =
    "rounded-xl px-4 py-2 text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2";

  const variantClasses = {
    default: "bg-[#2563EB] text-white hover:bg-blue-700",
    destructive:
      "bg-[#EF4444] text-white hover:bg-red-600",
    outline: "border border-[#E2E8F0] text-[#0F172A] hover:bg-[#F8FAFC]",
    secondary: "bg-[#F8FAFC] text-[#0F172A] hover:bg-slate-100",
    ghost: "text-[#0F172A] hover:bg-[#F8FAFC]",
    link: "text-[#2563EB] underline-offset-4 hover:underline",
  };

  return (
    <button
      disabled={isLoading || disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {isLoading && (
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {isLoading ? loadingText : children}
    </button>
  );
}
