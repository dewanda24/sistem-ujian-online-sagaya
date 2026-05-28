"use client";

import { useEffect } from "react";

type ExamEventType =
  | "tab_blur"
  | "tab_focus"
  | "visibility_hidden"
  | "visibility_visible"
  | "copy_attempt"
  | "paste_attempt"
  | "fullscreen_exit"
  | "before_unload";

interface ExamEventLoggerProps {
  attemptId: string;
  enabled: boolean;
}

export function ExamEventLogger({ attemptId, enabled }: ExamEventLoggerProps) {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const sendEvent = (eventType: ExamEventType) => {
      const payload = JSON.stringify({
        attempt_id: attemptId,
        event_type: eventType,
        metadata: {
          path: window.location.pathname,
          at: new Date().toISOString(),
        },
      });

      if (navigator.sendBeacon) {
        navigator.sendBeacon(
          "/api/exam-events",
          new Blob([payload], { type: "application/json" }),
        );
        return;
      }

      void fetch("/api/exam-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      });
    };

    const onBlur = () => sendEvent("tab_blur");
    const onFocus = () => sendEvent("tab_focus");
    const onCopy = () => sendEvent("copy_attempt");
    const onPaste = () => sendEvent("paste_attempt");
    const onBeforeUnload = () => sendEvent("before_unload");
    const onVisibilityChange = () => {
      sendEvent(
        document.hidden ? "visibility_hidden" : "visibility_visible",
      );
    };
    const onFullscreenChange = () => {
      if (!document.fullscreenElement) {
        sendEvent("fullscreen_exit");
      }
    };

    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    window.addEventListener("copy", onCopy);
    window.addEventListener("paste", onPaste);
    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("visibilitychange", onVisibilityChange);
    document.addEventListener("fullscreenchange", onFullscreenChange);

    return () => {
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("copy", onCopy);
      window.removeEventListener("paste", onPaste);
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
    };
  }, [attemptId, enabled]);

  return null;
}
