"use client";

import { useEffect } from "react";
import { toast } from "sonner";

interface ActionToastProps {
  status?: string;
  notice?: string;
  message?: string;
}

export function ActionToast({ status, notice, message }: ActionToastProps) {
  const effectiveStatus = status ?? notice;

  useEffect(() => {
    if (!effectiveStatus || !message) {
      return;
    }

    // Try to split message if it uses custom delimiter "||" for Title||Description
    const parts = message.split("||");
    const isSuccess = effectiveStatus === "success";
    const title =
      parts.length > 1
        ? parts[0]
        : isSuccess
          ? "Berhasil"
          : "Terjadi Kesalahan";
    const description = parts.length > 1 ? parts[1] : message;

    if (isSuccess) {
      toast.success(title, {
        description: description,
        duration: 4000,
      });
    } else {
      toast.error(title, {
        description: description,
        duration: 5000,
      });
    }

    // Clean URL query parameters to avoid re-triggering toast on refresh
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.has("notice") || url.searchParams.has("status") || url.searchParams.has("message")) {
        url.searchParams.delete("notice");
        url.searchParams.delete("status");
        url.searchParams.delete("message");
        window.history.replaceState({}, "", url.pathname + (url.search ? url.search : ""));
      }
    } catch {
      // Ignore if history replacement fails
    }
  }, [effectiveStatus, message]);

  return null;
}

