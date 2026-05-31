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
    "rounded-md px-4 py-2 text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2";

  const variantClasses = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    destructive:
      "bg-destructive text-primary-foreground hover:bg-destructive/90",
    outline: "border hover:bg-muted",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/90",
    ghost: "hover:bg-muted",
    link: "text-primary underline-offset-4 hover:underline",
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
