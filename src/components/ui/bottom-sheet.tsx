"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  size?: "auto" | "half" | "full";
  className?: string;
}

export function BottomSheet({
  isOpen,
  onClose,
  children,
  title,
  size = "auto",
  className,
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClass =
    size === "half"
      ? "max-h-[50vh]"
      : size === "full"
        ? "max-h-[90vh]"
        : "max-h-[85vh]";

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <button
        type="button"
        aria-label="Tutup"
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-200"
        onClick={onClose}
      />
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "relative w-full bg-white rounded-t-[28px] shadow-2xl",
          "animate-in slide-in-from-bottom duration-300 ease-out",
          "flex flex-col overflow-hidden",
          sizeClass,
          className,
        )}
      >
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-8 h-1 rounded-full bg-[#CBD5E1]" />
        </div>
        {title && (
          <div className="px-6 pt-2 pb-4 flex-shrink-0">
            <h2 className="text-[18px] font-semibold text-[#1E293B]">{title}</h2>
          </div>
        )}
        <div className="flex-1 overflow-y-auto overscroll-contain pb-safe">
          {children}
        </div>
      </div>
    </div>
  );
}

interface BottomSheetActionProps {
  icon?: ReactNode;
  label: string;
  description?: string;
  onClick?: () => void;
  tone?: "default" | "danger";
  disabled?: boolean;
}

export function BottomSheetAction({
  icon,
  label,
  description,
  onClick,
  tone = "default",
  disabled = false,
}: BottomSheetActionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "md-list-item w-full text-left ripple transition-colors",
        tone === "danger" ? "text-red-600" : "text-[#1E293B]",
        disabled && "opacity-40 cursor-not-allowed",
      )}
    >
      {icon && (
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-full",
            tone === "danger" ? "bg-red-50 text-red-600" : "bg-[#F1F5F9] text-[#64748B]",
          )}
        >
          {icon}
        </span>
      )}
      <span className="flex flex-col min-w-0">
        <span className="text-[15px] font-medium leading-snug">{label}</span>
        {description && (
          <span className="text-[13px] text-[#64748B] leading-snug mt-0.5">{description}</span>
        )}
      </span>
    </button>
  );
}

export function BottomSheetDivider() {
  return <div className="h-px bg-[#F1F5F9] mx-4 my-1" />;
}
