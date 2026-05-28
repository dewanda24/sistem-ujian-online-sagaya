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

    if (status === "success") {
      toast.success(message);
      return;
    }

    toast.error(message);
  }, [message, status]);

  return null;
}
