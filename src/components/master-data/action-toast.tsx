"use client";

import { useEffect } from "react";
import { toast } from "sonner";

interface ActionToastProps {
  status?: string;
  message?: string;
}

export function ActionToast({ status, message }: ActionToastProps) {
  useEffect(() => {
    if (!status || !message) {
      return;
    }

    // Try to split message if it uses our custom delimiter "||" for Title||Description
    const parts = message.split("||");
    const title = parts.length > 1 ? parts[0] : (status === "success" ? "Berhasil" : "Terjadi Kesalahan");
    const description = parts.length > 1 ? parts[1] : message;

    if (status === "success") {
      toast.success(title, {
        description: description,
        duration: 4000,
      });
      return;
    }

    toast.error(title, {
      description: description,
      duration: 5000,
    });
  }, [message, status]);

  return null;
}
