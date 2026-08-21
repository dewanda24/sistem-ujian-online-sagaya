"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Bookmark,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  RefreshCw,
  Send,
  Trash2,
  Wifi,
  WifiOff,
} from "lucide-react";
import { toast } from "sonner";

import { submitAttemptAction } from "@/features/exam-room/actions";
import { ExamHeaderBar } from "@/features/exam-room/components/exam-header-bar";
import { ExamOptionsMenuDialog } from "@/features/exam-room/components/exam-options-menu-dialog";
import { ExamQuestionPaletteModal } from "@/features/exam-room/components/exam-question-palette-modal";
import { ExamInfoDetailDialog } from "@/features/exam-room/components/exam-info-detail-dialog";
import { ExamConnectionDialog } from "@/features/exam-room/components/exam-connection-dialog";
import { ExamQuickInfoSection } from "@/features/exam-room/components/exam-quick-info-section";
import { QuestionMathRenderer } from "@/features/question-bank/components/question-math-renderer";
import { QuestionMediaPreview } from "@/features/question-bank/components/question-media-preview";
import { formatJakartaDateTime } from "@/lib/date-time";
import { cn } from "@/lib/utils";

type ExamEventType =
  | "tab_blur"
  | "tab_focus"
  | "visibility_hidden"
  | "visibility_visible"
  | "copy_attempt"
  | "paste_attempt"
  | "fullscreen_exit"
  | "before_unload"
  | "offline"
  | "online"
  | "disconnected"
  | "failed_submit";

type QuestionOption = {
  id: string;
  option_label: string;
  option_text: string;
  order_number: number;
};

type ExamQuestion = {
  order_number: number;
  question: {
    id: string;
    type: "multiple_choice" | "essay" | string;
    content: string;
    point?: number | null;
    explanation?: string | null;
    question_stimuli?:
      | {
          id: string;
          title?: string | null;
          content?: string | null;
          media_url?: string | null;
          media_type?: string | null;
        }
      | Array<{
          id: string;
          title?: string | null;
          content?: string | null;
          media_url?: string | null;
          media_type?: string | null;
        }>
      | null;
    question_attachments?: Array<{
      id: string;
      media_type: string;
      url: string;
      file_name?: string | null;
      caption?: string | null;
      order_number: number;
    }> | null;
    question_options?: QuestionOption[] | null;
  };
};

type AttemptAnswer = {
  question_id: string;
  selected_option_id?: string | null;
  essay_answer?: string | null;
};

type ExamRoomWorkspaceProps = {
  attempt: {
    id: string;
    status: string;
    started_at: string;
    locked_at?: string | null;
    lock_reason?: string | null;
    exam_schedules?: {
      title?: string | null;
      start_at?: string | null;
      end_at?: string | null;
      exam_packages?: {
        title?: string | null;
        duration_minutes?: number | null;
        subjects?: {
          code?: string | null;
          name?: string | null;
        } | null;
      } | null;
    } | null;
  };
  questions: ExamQuestion[];
  answers: AttemptAnswer[];
  serverNow: string;
};

type AnswerState = {
  selected_option_id?: string | null;
  essay_answer?: string | null;
};

type SaveState = "idle" | "saving" | "saved" | "error";
type FontSizeOption = "sm" | "base" | "lg" | "xl";

const seriousEventTypes: ExamEventType[] = [
  "tab_blur",
  "visibility_hidden",
  "copy_attempt",
  "paste_attempt",
  "fullscreen_exit",
  "before_unload",
];
const maxAntiCheatViolations = 8;

export function ExamRoomWorkspace({
  attempt,
  questions,
  answers: initialAnswers,
  serverNow,
}: ExamRoomWorkspaceProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerState>>(() =>
    Object.fromEntries(
      initialAnswers.map((answer) => [
        answer.question_id,
        {
          selected_option_id: answer.selected_option_id,
          essay_answer: answer.essay_answer,
        },
      ]),
    ),
  );
  const [saveStatus, setSaveStatus] = useState<Record<string, SaveState>>({});
  const [, setSaveMessage] = useState<string>("Semua jawaban otomatis tersimpan.");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(() =>
    getRemainingSeconds(attempt.exam_schedules?.end_at, new Date(serverNow).getTime()),
  );
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine,
  );
  const [sessionConflict, setSessionConflict] = useState(false);
  const [submitLocked, setSubmitLocked] = useState(false);
  const [violationCount, setViolationCount] = useState(0);
  const [warning, setWarning] = useState<{
    count: number;
    title: string;
    message: string;
  } | null>(null);

  // Dialog & Modal States
  const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState(false);
  const [isPaletteModalOpen, setIsPaletteModalOpen] = useState(false);
  const [isInfoDialogOpen, setIsInfoDialogOpen] = useState(false);
  const [isConnectionDialogOpen, setIsConnectionDialogOpen] = useState(false);
  const [isSubmitConfirmOpen, setIsSubmitConfirmOpen] = useState(false);

  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(() =>
    readFlaggedQuestions(attempt.id),
  );
  const [fontSize, setFontSize] = useState<FontSizeOption>(() =>
    readFontSizePreference(),
  );
  const [examSessionId] = useState(() =>
    getOrCreateExamSessionId(attempt.id),
  );

  const answersRef = useRef(answers);
  const saveStatusRef = useRef(saveStatus);
  const debounceTimers = useRef<Record<string, number>>({});
  const retryTimers = useRef<Record<string, number>>({});
  const saveVersions = useRef<Record<string, number>>({});
  const dirtyAnswerIdsRef = useRef<Set<string>>(new Set());
  const submitFlushInProgressRef = useRef(false);
  const examRoomRef = useRef<HTMLDivElement>(null);
  const submitFormRef = useRef<HTMLFormElement>(null);
  const submitConfirmedRef = useRef(false);
  const autoSubmittingRef = useRef(false);
  const timeExpiredSubmitRef = useRef(false);
  const violationCountRef = useRef(violationCount);
  const lastViolationAtRef = useRef(0);
  const restoredDraftRef = useRef(false);

  const isLocked = Boolean(attempt.locked_at);
  const isReadOnly = attempt.status !== "in_progress" || isLocked || sessionConflict;
  const schedule = attempt.exam_schedules;
  const examPackage = schedule?.exam_packages;
  const currentItem = questions[activeIndex];
  const currentQuestion = currentItem?.question;

  const toggleFlagQuestion = (questionId: string) => {
    setFlaggedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) {
        next.delete(questionId);
      } else {
        next.add(questionId);
      }
      persistFlaggedQuestions(attempt.id, next);
      return next;
    });
  };

  const handleFontSizeChange = (size: FontSizeOption) => {
    setFontSize(size);
    persistFontSizePreference(size);
  };

  const answeredCount = useMemo(
    () =>
      questions.filter(({ question }) => isAnswered(answers[question.id]))
        .length,
    [answers, questions],
  );

  const flaggedCount = useMemo(
    () =>
      questions.filter(({ question }) => flaggedQuestions.has(question.id))
        .length,
    [flaggedQuestions, questions],
  );

  const unansweredCount = questions.length - answeredCount;

  const saveStates = Object.values(saveStatus);
  const pendingSaveCount = saveStates.filter((status) => status === "saving").length;
  const failedSaveCount = saveStates.filter((status) => status === "error").length;
  const canSubmitManually =
    !isReadOnly && !submitLocked && pendingSaveCount === 0 && failedSaveCount === 0;
  const saveSummary = getSaveSummary(pendingSaveCount, failedSaveCount);
  const saveStatusText = getSaveStatusText(pendingSaveCount, failedSaveCount);

  const sendExamEvent = useCallback(
    (eventType: ExamEventType, metadata?: Record<string, unknown>) => {
      const payload = JSON.stringify({
        attempt_id: attempt.id,
        event_type: eventType,
        metadata: {
          path: window.location.pathname,
          at: new Date().toISOString(),
          ...metadata,
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
    },
    [attempt.id],
  );

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    saveStatusRef.current = saveStatus;
  }, [saveStatus]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const storedCount = getStoredViolationCount(attempt.id);
      violationCountRef.current = storedCount;
      setViolationCount(storedCount);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [attempt.id]);

  const timeWarningTriggeredRef = useRef<{ tenMin: boolean; fiveMin: boolean }>({
    tenMin: false,
    fiveMin: false,
  });

  useEffect(() => {
    if (!schedule?.end_at) {
      return;
    }

    const serverTimeOffsetMs = Date.now() - new Date(serverNow).getTime();
    const timer = window.setInterval(() => {
      const rem = getRemainingSeconds(schedule.end_at, Date.now() - serverTimeOffsetMs);
      setRemainingSeconds(rem);

      // Peringatan Waktu Kritis 10 Menit & 5 Menit
      if (rem <= 600 && rem > 300 && !timeWarningTriggeredRef.current.tenMin) {
        timeWarningTriggeredRef.current.tenMin = true;
        toast.warning("⏱️ Peringatan: Sisa Waktu 10 Menit!", {
          description: "Waktu ujian tersisa 10 menit lagi. Segera periksa kelengkapan jawabanmu.",
          duration: 6000,
        });
      } else if (rem <= 300 && rem > 0 && !timeWarningTriggeredRef.current.fiveMin) {
        timeWarningTriggeredRef.current.fiveMin = true;
        toast.error("🚨 Peringatan Kritis: Sisa Waktu 5 Menit!", {
          description: "Waktu ujian hampir berakhir! Pastikan seluruh nomor soal sudah terjawab.",
          duration: 8000,
        });
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [schedule?.end_at, serverNow]);

  useEffect(() => {
    if (isReadOnly) {
      return;
    }

    const sendHeartbeat = async () => {
      const response = await fetch("/api/exam-heartbeat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attempt_id: attempt.id,
          session_id: examSessionId,
        }),
        keepalive: true,
      }).catch(() => null);

      if (response?.status === 409) {
        setSessionConflict(true);
        setSaveMessage("Pengerjaan sedang aktif di perangkat atau tab lain.");
        return;
      }

      if (response?.ok) {
        setSessionConflict(false);
      }
    };

    void sendHeartbeat();
    const timer = window.setInterval(sendHeartbeat, 30000);

    return () => window.clearInterval(timer);
  }, [attempt.id, examSessionId, isReadOnly]);

  useEffect(() => {
    if (
      isReadOnly ||
      !schedule?.end_at ||
      remainingSeconds > 0 ||
      timeExpiredSubmitRef.current
    ) {
      return;
    }

    timeExpiredSubmitRef.current = true;
    autoSubmittingRef.current = true;
    setSubmitLocked(true);
    setWarning({
      count: violationCountRef.current,
      title: "Waktu ujian habis",
      message:
        "Batas waktu ujian telah berakhir. Lembar jawaban akan dikumpulkan otomatis.",
    });
    window.setTimeout(() => submitFormRef.current?.requestSubmit(), 800);
  }, [isReadOnly, remainingSeconds, schedule?.end_at]);

  useEffect(() => {
    if (isReadOnly) {
      return;
    }

    const registerViolation = (
      eventType: ExamEventType,
      title: string,
      message: string,
      metadata?: Record<string, unknown>,
    ) => {
      const now = Date.now();

      if (now - lastViolationAtRef.current < 700) {
        return;
      }

      lastViolationAtRef.current = now;
      sendExamEvent(eventType, metadata);

      if (!seriousEventTypes.includes(eventType)) {
        return;
      }

      const nextCount = violationCountRef.current + 1;
      violationCountRef.current = nextCount;
      window.localStorage.setItem(
        getViolationStorageKey(attempt.id),
        String(nextCount),
      );
      setViolationCount(nextCount);

      if (nextCount >= maxAntiCheatViolations) {
        setWarning({
          count: nextCount,
          title: "Ujian dikumpulkan otomatis",
          message:
            `Sistem mendeteksi ${maxAntiCheatViolations} pelanggaran. Jawaban dikumpulkan otomatis.`,
        });
        autoSubmittingRef.current = true;
        setSubmitLocked(true);
        window.setTimeout(() => submitFormRef.current?.requestSubmit(), 900);
        return;
      }

      setWarning({
        count: nextCount,
        title: nextCount === 1 ? "Peringatan Ujian" : "Peringatan Keras",
        message,
      });
    };

    const onBlur = () =>
      registerViolation(
        "tab_blur",
        "Peringatan Ujian",
        "Jendela ujian kehilangan fokus. Tetap berada di halaman ujian sampai selesai.",
      );
    const onFocus = () => sendExamEvent("tab_focus");
    const onVisibilityChange = () => {
      if (document.hidden) {
        registerViolation(
          "visibility_hidden",
          "Peringatan Ujian",
          "Perpindahan tab atau minimize browser terdeteksi.",
        );
        return;
      }

      sendExamEvent("visibility_visible");
    };
    const onFullscreenChange = () => {
      if (!document.fullscreenElement) {
        registerViolation(
          "fullscreen_exit",
          "Keluar layar penuh terdeteksi",
          "Lanjutkan ujian dengan tertib di halaman ini.",
        );
      }
    };
    const onCopy = (event: ClipboardEvent) => {
      event.preventDefault();
      registerViolation(
        "copy_attempt",
        "Aksi diblokir",
        "Copy tidak diizinkan selama ujian berlangsung.",
      );
    };
    const onPaste = (event: ClipboardEvent) => {
      event.preventDefault();
      registerViolation(
        "paste_attempt",
        "Aksi diblokir",
        "Paste tidak diizinkan selama ujian berlangsung.",
      );
    };
    const onContextMenu = (event: MouseEvent) => {
      event.preventDefault();
      registerViolation(
        "copy_attempt",
        "Klik kanan diblokir",
        "Klik kanan tidak diizinkan selama ujian berlangsung.",
        { blocked_action: "context_menu" },
      );
    };
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const blockedShortcut =
        (event.ctrlKey || event.metaKey) &&
        ["a", "c", "p", "s", "u", "v", "x"].includes(key);
      const blockedPrintScreen = key === "printscreen";

      if (!blockedShortcut && !blockedPrintScreen) {
        return;
      }

      event.preventDefault();
      registerViolation(
        key === "v" ? "paste_attempt" : "copy_attempt",
        "Shortcut diblokir",
        "Shortcut browser umum tidak diizinkan selama ujian berlangsung.",
        { blocked_action: event.key },
      );
    };
    const onBeforePrint = () =>
      registerViolation(
        "copy_attempt",
        "Print diblokir",
        "Print tidak diizinkan selama ujian berlangsung.",
        { blocked_action: "print" },
      );
    const onBeforeUnload = () => {
      sendExamEvent("before_unload");
      sendExamEvent("disconnected");
    };

    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    window.addEventListener("copy", onCopy);
    window.addEventListener("paste", onPaste);
    window.addEventListener("contextmenu", onContextMenu);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("beforeprint", onBeforePrint);
    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("visibilitychange", onVisibilityChange);
    document.addEventListener("fullscreenchange", onFullscreenChange);

    return () => {
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("copy", onCopy);
      window.removeEventListener("paste", onPaste);
      window.removeEventListener("contextmenu", onContextMenu);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("beforeprint", onBeforePrint);
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
    };
  }, [attempt.id, isReadOnly, sendExamEvent]);

  // Screen Wake Lock API to prevent phone screen from going to sleep while student is taking exam
  useEffect(() => {
    let wakeLockSentinel: unknown = null;

    async function requestScreenWakeLock() {
      try {
        if (typeof navigator !== "undefined" && "wakeLock" in navigator && !isReadOnly) {
          wakeLockSentinel = await (navigator as unknown as { wakeLock: { request: (type: string) => Promise<unknown> } }).wakeLock.request("screen");
        }
      } catch {
        // Gracefully ignore if wake lock fails or is unsupported
      }
    }

    void requestScreenWakeLock();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void requestScreenWakeLock();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (wakeLockSentinel && typeof (wakeLockSentinel as { release?: () => Promise<void> }).release === "function") {
        void (wakeLockSentinel as { release: () => Promise<void> }).release().catch(() => {});
      }
    };
  }, [isReadOnly]);

  useEffect(() => {
    const timers = debounceTimers.current;
    const retries = retryTimers.current;

    return () => {
      Object.values(timers).forEach((timer) =>
        window.clearTimeout(timer),
      );
      Object.values(retries).forEach((timer) =>
        window.clearTimeout(timer),
      );
    };
  }, []);

  const saveAnswer = useCallback(
    async (
      questionId: string,
      nextAnswer: AnswerState,
      attemptNumber = 0,
      version = (saveVersions.current[questionId] ?? 0) + 1,
    ) => {
      if (attemptNumber === 0) {
        saveVersions.current[questionId] = version;
      }

      window.clearTimeout(retryTimers.current[questionId]);

      if (!navigator.onLine) {
        setIsOnline(false);
        setSaveStatus((current) => ({ ...current, [questionId]: "error" }));
        setSaveMessage("Browser offline. Jawaban tersimpan di memori lokal.");
        return false;
      }

      setSaveStatus((current) => ({ ...current, [questionId]: "saving" }));

      const response = await fetch("/api/exam-answers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attempt_id: attempt.id,
          question_id: questionId,
          session_id: examSessionId,
          selected_option_id: nextAnswer.selected_option_id ?? null,
          essay_answer: nextAnswer.essay_answer ?? "",
        }),
      }).catch(() => null);

      if (version < (saveVersions.current[questionId] ?? version)) {
        return false;
      }

      if (response?.status === 409) {
        setSessionConflict(true);
        setSaveStatus((current) => ({ ...current, [questionId]: "error" }));
        setSaveMessage("Pengerjaan aktif di perangkat lain.");
        return false;
      }

      if (!response?.ok) {
        if (attemptNumber < 2) {
          setSaveMessage(`Menyimpan ulang jawaban (${attemptNumber + 2}/3)...`);
          retryTimers.current[questionId] = window.setTimeout(() => {
            void saveAnswer(questionId, nextAnswer, attemptNumber + 1, version);
          }, 2000 * (attemptNumber + 1));
          return false;
        }

        setSaveStatus((current) => ({ ...current, [questionId]: "error" }));
        setSaveMessage("Gagal menyimpan jawaban. Periksa koneksi.");
        return false;
      }

      setSaveStatus((current) => ({ ...current, [questionId]: "saved" }));
      setLastSavedAt(new Date().toLocaleTimeString("id-ID"));
      dirtyAnswerIdsRef.current.delete(questionId);
      clearAnswerDraft(attempt.id, questionId);
      return true;
    },
    [attempt.id, examSessionId],
  );

  const flushPendingAnswersBeforeSubmit = useCallback(async () => {
    const dirtyIds = Array.from(dirtyAnswerIdsRef.current);
    if (dirtyIds.length === 0) {
      return true;
    }

    const results = await Promise.all(
      dirtyIds.map((questionId) => {
        const answer = answersRef.current[questionId];
        if (!answer) return Promise.resolve(true);
        return saveAnswer(questionId, answer);
      }),
    );

    return results.every(Boolean);
  }, [saveAnswer]);

  useEffect(() => {
    const onOnline = () => {
      setIsOnline(true);
      setSaveMessage("Koneksi kembali normal. Menyinkronkan jawaban...");
      sendExamEvent("online");
      toast.success("✅ Koneksi Internet Pulih", {
        description: "Menyinkronkan seluruh jawaban yang tersimpan di perangkat ke server.",
        duration: 4000,
      });
      void flushPendingAnswersBeforeSubmit();
    };
    const onOffline = () => {
      setIsOnline(false);
      setSaveMessage("Browser offline. Jawaban disimpan lokal di HP.");
      sendExamEvent("offline");
    };

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [flushPendingAnswersBeforeSubmit, sendExamEvent]);

  const scheduleSave = useCallback(
    (questionId: string, nextAnswer: AnswerState) => {
      if (isReadOnly) {
        return;
      }

      dirtyAnswerIdsRef.current.add(questionId);
      persistAnswerDraft(attempt.id, questionId, nextAnswer);
      window.clearTimeout(debounceTimers.current[questionId]);
      window.clearTimeout(retryTimers.current[questionId]);
      setSaveStatus((current) => ({ ...current, [questionId]: "saving" }));

      debounceTimers.current[questionId] = window.setTimeout(() => {
        void saveAnswer(questionId, nextAnswer);
      }, 700);
    },
    [attempt.id, isReadOnly, saveAnswer],
  );

  const handleOptionChange = (questionId: string, optionId: string) => {
    if (isReadOnly) return;
    const nextAnswer: AnswerState = {
      ...answers[questionId],
      selected_option_id: optionId,
    };
    setAnswers((current) => ({ ...current, [questionId]: nextAnswer }));
    scheduleSave(questionId, nextAnswer);
  };

  const handleClearAnswer = (questionId: string) => {
    if (isReadOnly) return;
    const nextAnswer: AnswerState = {
      selected_option_id: null,
      essay_answer: "",
    };
    setAnswers((current) => ({ ...current, [questionId]: nextAnswer }));
    scheduleSave(questionId, nextAnswer);
  };

  const handleEssayChange = (questionId: string, value: string) => {
    if (isReadOnly) return;
    const nextAnswer: AnswerState = {
      ...answers[questionId],
      essay_answer: value,
    };
    setAnswers((current) => ({ ...current, [questionId]: nextAnswer }));
    scheduleSave(questionId, nextAnswer);
  };

  const retryFailedAnswer = (questionId: string) => {
    const answer = answers[questionId];
    if (answer) {
      void saveAnswer(questionId, answer);
    }
  };

  const retrySyncAllFailed = () => {
    const failedIds = Object.entries(saveStatus)
      .filter(([, st]) => st === "error")
      .map(([id]) => id);

    failedIds.forEach((id) => {
      const ans = answers[id];
      if (ans) void saveAnswer(id, ans);
    });
  };

  useEffect(() => {
    if (restoredDraftRef.current || isReadOnly) {
      return;
    }

    restoredDraftRef.current = true;
    const timer = window.setTimeout(() => {
      const drafts = readAnswerDrafts(attempt.id);
      const validQuestionIds = new Set(questions.map(({ question }) => question.id));
      const draftEntries = Object.entries(drafts).filter(([id]) =>
        validQuestionIds.has(id),
      );

      if (draftEntries.length === 0) {
        return;
      }

      setAnswers((current) => ({
        ...current,
        ...Object.fromEntries(
          draftEntries.map(([questionId, answer]) => [
            questionId,
            { ...current[questionId], ...answer },
          ]),
        ),
      }));

      if (navigator.onLine) {
        draftEntries.forEach(([questionId, answer]) => {
          void saveAnswer(questionId, answer);
        });
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [attempt.id, isReadOnly, questions, saveAnswer]);

  const closeWarningAndRefocus = () => {
    setWarning(null);
  };

  if (!currentQuestion) {
    return (
      <div className="mx-auto max-w-md my-12 rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600 shadow-sm">
        Belum ada soal pada paket ujian ini.
      </div>
    );
  }

  const isCurrentFlagged = flaggedQuestions.has(currentQuestion.id);
  const currentAnswer = answers[currentQuestion.id];
  const hasCurrentAnswer = isAnswered(currentAnswer);

  const fontSizeClasses = {
    sm: "text-[14px] md:text-sm leading-relaxed",
    base: "text-[16px] md:text-base leading-[1.7]",
    lg: "text-[18px] md:text-lg leading-[1.7]",
    xl: "text-[20px] md:text-xl leading-[1.7]",
  };

  return (
    <div
      ref={examRoomRef}
      className="min-h-screen bg-[#F8FAFC] pb-24 select-none md:pb-8"
    >
      {/* 7.7 STATUS UJIAN (SELALU TERLIHAT) Header Bar */}
      <ExamHeaderBar
        examTitle={schedule?.title ?? "Ruang Ujian"}
        subjectName={examPackage?.subjects?.name ?? examPackage?.title ?? "Mata Pelajaran"}
        totalQuestions={questions.length}
        answeredCount={answeredCount}
        currentQuestionNumber={activeIndex + 1}
        remainingSeconds={remainingSeconds}
        isOnline={isOnline}
        saveSummary={saveSummary}
        saveStatusText={saveStatusText}
        onOpenMenu={() => setIsOptionsMenuOpen(true)}
        onOpenPalette={() => setIsPaletteModalOpen(true)}
      />

      {/* Main Workspace Container */}
      <main className="mx-auto max-w-7xl px-3 py-3 sm:px-5 sm:py-5 pb-36 sm:pb-12 space-y-4">
        {/* Offline Interactive Banner */}
        {!isOnline && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-500/10 p-3.5 text-xs text-amber-950 shadow-2xs backdrop-blur-xs animate-in fade-in">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white font-bold animate-pulse">
                <WifiOff className="size-4" />
              </span>
              <div>
                <p className="font-bold text-amber-950">Koneksi Internet Terputus (Mode Offline Aktif)</p>
                <p className="text-[11px] text-amber-800 font-medium mt-0.5">
                  Jawabanmu tetap tersimpan aman di HP. Sistem otomatis mengirimkan ke server saat online.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                if (navigator.onLine) {
                  setIsOnline(true);
                  void flushPendingAnswersBeforeSubmit();
                  toast.success("✅ Koneksi Pulih", { description: "Menyinkronkan jawaban..." });
                } else {
                  toast.info("Belum ada koneksi internet. Jawaban tetap tersimpan aman di HP.");
                }
              }}
              className="shrink-0 inline-flex h-8 items-center justify-center rounded-xl bg-amber-600 px-3 text-xs font-bold text-white shadow-2xs hover:bg-amber-700 active:scale-95 transition"
            >
              Coba Sinkronkan
            </button>
          </div>
        )}

        {/* Security & Lock Alerts if any */}
        {isLocked && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs sm:text-sm font-medium text-red-800 shadow-2xs">
            🔒 Pengerjaan dikunci oleh pengawas. {attempt.lock_reason ?? "Tunggu instruksi sebelum melanjutkan."}
          </div>
        )}

        {sessionConflict && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs sm:text-sm font-medium text-red-800 shadow-2xs">
            ⚠️ Sesi ujian aktif di tab atau perangkat lain. Tutup sesi lain sebelum melanjutkan.
          </div>
        )}

        {/* 2-Column Responsive Workspace Grid */}
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
          {/* LEFT: 7.2 SOAL AKTIF (MENJAWAB) & 7.6 NAVIGASI SOAL */}
          <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 md:p-7 flex flex-col justify-between">
            <div>
              {/* Question Header & Meta Bar */}
              <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="flex size-8 items-center justify-center rounded-xl bg-blue-600 text-sm font-black text-white shadow-2xs">
                      {activeIndex + 1}
                    </span>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Soal {activeIndex + 1} dari {questions.length}
                      </p>
                      <h1 className="text-sm sm:text-base font-bold text-slate-900">
                        {examPackage?.subjects?.name ?? "Mata Pelajaran"}
                      </h1>
                    </div>
                  </div>
                </div>

                {/* Right controls: Badges, Ragu-ragu & Font Scaler */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                    {currentQuestion.type === "essay" ? "Esai" : "Pilihan Ganda"}
                  </span>
                  <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                    {Number(currentQuestion.point ?? 0)} Poin
                  </span>

                  {/* Font Size Scaler */}
                  <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-0.5 text-xs font-bold text-slate-700 shadow-2xs">
                    <button
                      type="button"
                      onClick={() =>
                        handleFontSizeChange(
                          fontSize === "xl" ? "lg" : fontSize === "lg" ? "base" : "sm",
                        )
                      }
                      title="Perkecil Ukuran Teks"
                      className="flex size-7 items-center justify-center rounded-lg hover:bg-white active:scale-90 transition-all disabled:opacity-30"
                      disabled={fontSize === "sm"}
                    >
                      <span className="text-[11px]">A-</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFontSizeChange("base")}
                      title="Ukuran Normal"
                      className={cn(
                        "flex h-7 px-1.5 items-center justify-center rounded-lg text-[11px] transition-all",
                        fontSize === "base" && "bg-white text-blue-600 shadow-2xs font-extrabold",
                      )}
                    >
                      A
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleFontSizeChange(
                          fontSize === "sm" ? "base" : fontSize === "base" ? "lg" : "xl",
                        )
                      }
                      title="Perbesar Ukuran Teks"
                      className="flex size-7 items-center justify-center rounded-lg hover:bg-white active:scale-90 transition-all disabled:opacity-30"
                      disabled={fontSize === "xl"}
                    >
                      <span className="text-[12px]">A+</span>
                    </button>
                  </div>

                  {/* Ragu-Ragu Button */}
                  <button
                    type="button"
                    onClick={() => toggleFlagQuestion(currentQuestion.id)}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all active:scale-95",
                      isCurrentFlagged
                        ? "border-amber-400 bg-amber-100 text-amber-900 shadow-2xs ring-1 ring-amber-400"
                        : "border-slate-200 bg-slate-50 text-slate-600 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-800",
                    )}
                  >
                    <Bookmark className={cn("size-3.5", isCurrentFlagged && "fill-amber-500 text-amber-600")} />
                    <span>{isCurrentFlagged ? "Ragu-Ragu" : "Tandai Ragu"}</span>
                  </button>

                  {/* Clear answer button (Hapus Jawaban) */}
                  {hasCurrentAnswer && !isReadOnly && (
                    <button
                      type="button"
                      onClick={() => handleClearAnswer(currentQuestion.id)}
                      className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 active:scale-95 transition-all"
                      title="Hapus Jawaban Pilihan Ini"
                    >
                      <Trash2 className="size-3.5" />
                      <span className="hidden sm:inline">Hapus</span>
                    </button>
                  )}

                  {saveStatus[currentQuestion.id] === "error" && (
                    <button
                      type="button"
                      onClick={() => retryFailedAnswer(currentQuestion.id)}
                      className="rounded-lg border border-red-300 bg-red-50 px-2 py-1 text-xs font-bold text-red-700 hover:bg-red-100 active:scale-95"
                    >
                      Coba Simpan Lagi
                    </button>
                  )}
                </div>
              </div>

              {/* Question Body */}
              <div className={cn("space-y-4 py-5", fontSizeClasses[fontSize])}>
                <QuestionStimulus stimulus={firstRelation(currentQuestion.question_stimuli)} />
                <QuestionContent content={currentQuestion.content} />
                <QuestionAttachments attachments={currentQuestion.question_attachments} />
              </div>

              {/* 7.2 Options List (A, B, C, D, E) or Essay Input */}
              <div className="mt-2 space-y-3">
                {currentQuestion.type === "multiple_choice" ? (
                  (currentQuestion.question_options ?? [])
                    .slice()
                    .sort((a, b) => a.order_number - b.order_number)
                    .map((option) => {
                      const checked =
                        answers[currentQuestion.id]?.selected_option_id === option.id;

                      return (
                        <label
                          key={option.id}
                          className={cn(
                            "flex cursor-pointer items-start gap-3.5 rounded-2xl border p-3.5 sm:p-4.5 font-medium transition-all duration-150 select-none active:scale-[0.99] min-h-[56px]",
                            checked
                              ? "border-[#2563EB] bg-[#EFF6FF] text-slate-950 shadow-xs ring-2 ring-blue-500/30"
                              : "border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50/70",
                            isReadOnly && "cursor-not-allowed opacity-70",
                          )}
                        >
                          {/* Option Letter Badge (A, B, C, D, E) */}
                          <div
                            className={cn(
                              "flex size-8 shrink-0 items-center justify-center rounded-xl font-black text-sm transition-colors",
                              checked
                                ? "bg-[#2563EB] text-white shadow-xs"
                                : "bg-slate-100 text-slate-700",
                            )}
                          >
                            {option.option_label}
                          </div>

                          <input
                            type="radio"
                            name={`question-${currentQuestion.id}`}
                            value={option.id}
                            checked={checked}
                            disabled={isReadOnly}
                            onChange={() =>
                              handleOptionChange(currentQuestion.id, option.id)
                            }
                            className="sr-only"
                          />

                          <div
                            className={cn(
                              "flex-1 pt-0.5 break-words font-medium text-slate-900",
                              fontSizeClasses[fontSize],
                            )}
                          >
                            <QuestionMathRenderer content={option.option_text} />
                          </div>
                        </label>
                      );
                    })
                ) : (
                  <textarea
                    value={answers[currentQuestion.id]?.essay_answer ?? ""}
                    disabled={isReadOnly}
                    onChange={(event) =>
                      handleEssayChange(currentQuestion.id, event.target.value)
                    }
                    placeholder="Tulis jawaban esai kamu di sini dengan jelas..."
                    className={cn(
                      "min-h-48 w-full rounded-2xl border border-slate-200 bg-white p-4 leading-relaxed outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-70",
                      fontSizeClasses[fontSize],
                    )}
                  />
                )}
              </div>
            </div>

            {/* 7.6 DAFTAR SOAL (TENGAH LAYAR) In-Page Navigation Bar */}
            <div className="mt-8 border-t border-slate-100 pt-5 flex items-center justify-between gap-3">
              {/* Prev Button */}
              <button
                type="button"
                disabled={activeIndex === 0}
                onClick={() => setActiveIndex((index) => Math.max(0, index - 1))}
                className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 text-xs sm:text-sm font-bold text-slate-800 shadow-2xs hover:bg-slate-50 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="size-4" />
                <span>Sebelumnya</span>
              </button>

              {/* Center Status / Palette Trigger */}
              <button
                type="button"
                onClick={() => setIsPaletteModalOpen(true)}
                className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50/80 px-4 text-xs sm:text-sm font-extrabold text-blue-700 shadow-2xs hover:bg-blue-100 active:scale-95 transition-all"
              >
                <LayoutGrid className="size-4" />
                <span>SOAL {activeIndex + 1} / {questions.length}</span>
              </button>

              {/* Next / Selesai Button */}
              {activeIndex === questions.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setIsSubmitConfirmOpen(true)}
                  disabled={!canSubmitManually}
                  className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 text-xs sm:text-sm font-extrabold text-white shadow-sm hover:from-emerald-700 hover:to-teal-700 active:scale-95 transition-all disabled:opacity-50"
                >
                  <CheckCircle2 className="size-4" />
                  <span>Selesai</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    setActiveIndex((index) =>
                      Math.min(questions.length - 1, index + 1),
                    )
                  }
                  className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-blue-600 px-5 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-blue-700 active:scale-95 transition-all"
                >
                  <span>Selanjutnya</span>
                  <ChevronRight className="size-4" />
                </button>
              )}
            </div>
          </section>

          {/* RIGHT: DESKTOP QUESTION PALETTE SIDEBAR (7.6) */}
          <aside className="space-y-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm lg:sticky lg:top-24 lg:self-start hidden lg:block">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-950">Daftar Soal</h2>
                <p className="text-xs text-slate-500">Pilih nomor untuk berpindah.</p>
              </div>
              <span className="rounded-lg bg-blue-50 px-2 py-1 text-xs font-black text-blue-700">
                {answeredCount}/{questions.length}
              </span>
            </div>

            {/* Grid Numbers */}
            <div className="grid grid-cols-5 gap-2 max-h-[340px] overflow-y-auto pr-1">
              {questions.map(({ question }, index) => {
                const active = index === activeIndex;
                const answered = isAnswered(answers[question.id]);
                const flagged = flaggedQuestions.has(question.id);

                return (
                  <button
                    key={`sidebar-palette-${question.id}`}
                    type="button"
                    onClick={() => setActiveIndex(index)}
                    className={cn(
                      "relative flex aspect-square items-center justify-center rounded-xl border text-xs font-bold transition-all duration-150 active:scale-90",
                      active &&
                        "border-blue-600 bg-blue-600 text-white shadow-xs ring-2 ring-blue-300",
                      !active &&
                        flagged &&
                        "border-amber-400 bg-amber-400 text-amber-950 font-black shadow-2xs",
                      !active &&
                        !flagged &&
                        answered &&
                        "border-emerald-500 bg-emerald-500 text-white font-bold shadow-2xs",
                      !active &&
                        !flagged &&
                        !answered &&
                        "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                    )}
                    aria-label={`Buka soal ${index + 1}`}
                  >
                    <span>{index + 1}</span>
                    {flagged && !active && (
                      <span className="absolute -top-1 -right-1 flex size-3.5 items-center justify-center rounded-full bg-amber-900 text-[8px] text-white">
                        ?
                      </span>
                    )}
                    {answered && !flagged && !active && (
                      <span className="absolute -top-1 -right-1 flex size-3.5 items-center justify-center rounded-full bg-emerald-700 text-[8px] text-white">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* 4-Color Status Legend (7.6) */}
            <div className="grid gap-2 border-t border-slate-100 pt-3 text-xs text-slate-600">
              <div className="flex items-center gap-2 font-medium">
                <span className="size-3.5 rounded-full bg-blue-600" />
                <span>Sedang Dibuka ({activeIndex + 1})</span>
              </div>
              <div className="flex items-center gap-2 font-medium">
                <span className="size-3.5 rounded-full bg-emerald-500" />
                <span>Sudah Dijawab ({answeredCount})</span>
              </div>
              <div className="flex items-center gap-2 font-medium">
                <span className="size-3.5 rounded-full bg-amber-400" />
                <span>Ragu-Ragu ({flaggedCount})</span>
              </div>
              <div className="flex items-center gap-2 font-medium">
                <span className="size-3.5 rounded-full border border-slate-300 bg-white" />
                <span>Belum Dijawab ({unansweredCount})</span>
              </div>
            </div>

            {/* Submit Action Form */}
            <form
              ref={submitFormRef}
              action={submitAttemptAction}
              onSubmit={(event) => {
                if (dirtyAnswerIdsRef.current.size > 0) {
                  event.preventDefault();
                  if (submitFlushInProgressRef.current) return;
                  submitFlushInProgressRef.current = true;
                  const wasAutoSubmitting = autoSubmittingRef.current;
                  const wasConfirmed = submitConfirmedRef.current;

                  void flushPendingAnswersBeforeSubmit().then((ok) => {
                    submitFlushInProgressRef.current = false;
                    if (!ok) {
                      autoSubmittingRef.current = false;
                      submitConfirmedRef.current = false;
                      setSubmitLocked(false);
                      return;
                    }
                    autoSubmittingRef.current = wasAutoSubmitting;
                    submitConfirmedRef.current = wasConfirmed;
                    submitFormRef.current?.requestSubmit();
                  });
                  return;
                }

                if (submitLocked && !autoSubmittingRef.current) {
                  event.preventDefault();
                  return;
                }

                if (
                  !autoSubmittingRef.current &&
                  (pendingSaveCount > 0 || failedSaveCount > 0)
                ) {
                  event.preventDefault();
                  sendExamEvent("failed_submit", {
                    reason: pendingSaveCount > 0 ? "pending_save" : "failed_save",
                    pending_save_count: pendingSaveCount,
                    failed_save_count: failedSaveCount,
                  });
                  setSaveMessage(
                    pendingSaveCount > 0
                      ? "Tunggu proses simpan selesai sebelum submit."
                      : "Ada jawaban gagal tersimpan. Coba simpan lagi.",
                  );
                  return;
                }

                if (!autoSubmittingRef.current && !submitConfirmedRef.current) {
                  event.preventDefault();
                  setIsSubmitConfirmOpen(true);
                  return;
                }

                submitConfirmedRef.current = false;
                setSubmitLocked(true);
              }}
            >
              <input type="hidden" name="attempt_id" value={attempt.id} />
              <input type="hidden" name="session_id" value={examSessionId} />
              <button
                type="button"
                onClick={() => setIsSubmitConfirmOpen(true)}
                disabled={!canSubmitManually}
                className="mt-2 flex w-full h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 font-bold text-sm text-white shadow-sm hover:from-emerald-700 hover:to-teal-700 active:scale-98 transition-all disabled:opacity-50"
              >
                <Send className="size-4" />
                <span>
                  {submitLocked
                    ? "Mengumpulkan..."
                    : pendingSaveCount > 0
                    ? "Menunggu Simpan..."
                    : failedSaveCount > 0
                    ? "Simpan Ulang Dulu"
                    : "Kumpulkan Ujian"}
                </span>
              </button>
            </form>
          </aside>
        </div>

        {/* 7.8, 7.9, 7.10 Informasi Cepat & Tips Sukses */}
        <ExamQuickInfoSection
          remainingSeconds={remainingSeconds}
          isOnline={isOnline}
          onOpenSubmitConfirm={() => setIsSubmitConfirmOpen(true)}
        />
      </main>

      {/* MOBILE FLOATING BOTTOM BAR */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white px-3 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] shadow-[0_-8px_25px_rgba(15,23,42,0.12)] select-none md:hidden flex flex-col gap-2.5">
        
        {/* Row 1: Save Status Indicator (Small) */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5 text-[11px] font-medium">
            {saveSummary === "saving" ? (
              <>
                <RefreshCw className="size-3 animate-spin text-blue-500" />
                <span className="text-blue-600">Menyimpan...</span>
              </>
            ) : saveSummary === "error" ? (
              <>
                <AlertTriangle className="size-3 text-red-500" />
                <span className="text-red-600 font-bold">Gagal Simpan</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="size-3 text-emerald-500" />
                <span className="text-emerald-600">Tersimpan</span>
              </>
            )}
          </div>
          {!isOnline && (
            <span className="flex items-center gap-1 text-[11px] font-bold text-red-500 animate-pulse">
              <WifiOff className="size-3" /> Offline
            </span>
          )}
        </div>

        {/* Row 2: Navigation & Actions (Big touch targets) */}
        <div className="flex items-center justify-between gap-1.5">
          {/* Prev button */}
          <button
            type="button"
            disabled={activeIndex === 0}
            onClick={() => setActiveIndex((index) => Math.max(0, index - 1))}
            className="inline-flex h-[48px] w-12 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-800 shadow-sm transition-all active:scale-95 disabled:opacity-30 disabled:scale-100"
            aria-label="Soal sebelumnya"
          >
            <ChevronLeft className="size-6" />
          </button>

          {/* Ragu-Ragu Quick Toggle Button */}
          <button
            type="button"
            onClick={() => toggleFlagQuestion(currentQuestion.id)}
            className={cn(
              "inline-flex h-[48px] px-3 shrink-0 items-center justify-center gap-1 rounded-2xl border text-xs font-bold transition-all active:scale-95",
              isCurrentFlagged
                ? "border-amber-400 bg-amber-100 text-amber-900 shadow-xs ring-1 ring-amber-400"
                : "border-slate-200 bg-slate-50 text-slate-600",
            )}
            title="Tandai Ragu-Ragu"
          >
            <Bookmark className={cn("size-4", isCurrentFlagged && "fill-amber-500 text-amber-600")} />
            <span className="hidden xs:inline text-[11px]">{isCurrentFlagged ? "Ragu" : "Ragu?"}</span>
          </button>

          {/* Question drawer trigger */}
          <button
            type="button"
            onClick={() => setIsPaletteModalOpen(true)}
            className="flex flex-1 items-center justify-center gap-1.5 h-[48px] rounded-2xl border-2 border-blue-500/20 bg-blue-50 px-2 text-[13px] font-black text-blue-700 shadow-sm transition-all active:scale-95"
          >
            <LayoutGrid className="size-4 shrink-0" />
            <span>{activeIndex + 1} / {questions.length}</span>
          </button>

          {/* Next / Selesai button */}
          {activeIndex === questions.length - 1 ? (
            <button
              type="button"
              onClick={() => setIsSubmitConfirmOpen(true)}
              disabled={!canSubmitManually}
              className="inline-flex h-[48px] px-3.5 items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-[13px] font-extrabold text-white shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:scale-100"
            >
              <CheckCircle2 className="size-4.5" />
              <span>Selesai</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() =>
                setActiveIndex((index) => Math.min(questions.length - 1, index + 1))
              }
              className="inline-flex h-[48px] w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md transition-all active:scale-95"
              aria-label="Soal berikutnya"
            >
              <ChevronRight className="size-6" />
            </button>
          )}
        </div>
      </div>

      {/* 7.4 MENU OPSI DIALOG */}
      <ExamOptionsMenuDialog
        isOpen={isOptionsMenuOpen}
        onClose={() => setIsOptionsMenuOpen(false)}
        isCurrentFlagged={isCurrentFlagged}
        hasAnswer={hasCurrentAnswer}
        isReadOnly={isReadOnly}
        onToggleFlag={() => toggleFlagQuestion(currentQuestion.id)}
        onClearAnswer={() => handleClearAnswer(currentQuestion.id)}
        onOpenInfo={() => setIsInfoDialogOpen(true)}
        onOpenConnection={() => setIsConnectionDialogOpen(true)}
        onOpenSubmit={() => setIsSubmitConfirmOpen(true)}
      />

      {/* 7.3 DAFTAR SOAL MODAL */}
      <ExamQuestionPaletteModal
        isOpen={isPaletteModalOpen}
        onClose={() => setIsPaletteModalOpen(false)}
        questions={questions}
        activeIndex={activeIndex}
        onSelectIndex={(index) => setActiveIndex(index)}
        isAnswered={(id) => isAnswered(answers[id])}
        isFlagged={(id) => flaggedQuestions.has(id)}
      />

      {/* 7.5 INFORMASI SOAL DETAIL DIALOG */}
      <ExamInfoDetailDialog
        isOpen={isInfoDialogOpen}
        onClose={() => setIsInfoDialogOpen(false)}
        subjectName={examPackage?.subjects?.name ?? "Mata Pelajaran"}
        examType={schedule?.title ?? "Sumatif Tengah Semester"}
        totalQuestions={questions.length}
        durationMinutes={examPackage?.duration_minutes ?? 120}
        startAt={schedule?.start_at ? formatJakartaDateTime(schedule.start_at) : null}
        endAt={schedule?.end_at ? formatJakartaDateTime(schedule.end_at) : null}
      />

      {/* PERIKSA KONEKSI DIALOG */}
      <ExamConnectionDialog
        isOpen={isConnectionDialogOpen}
        onClose={() => setIsConnectionDialogOpen(false)}
        isOnline={isOnline}
        pendingSaveCount={pendingSaveCount}
        failedSaveCount={failedSaveCount}
        lastSavedAt={lastSavedAt}
        onRetrySyncAll={retrySyncAllFailed}
      />

      {/* SUBMIT CONFIRMATION MODAL */}
      <SubmitSummaryDialog
        isOpen={isSubmitConfirmOpen}
        totalQuestions={questions.length}
        answeredCount={answeredCount}
        flaggedCount={flaggedCount}
        unansweredCount={unansweredCount}
        isLoading={submitLocked}
        onCancel={() => setIsSubmitConfirmOpen(false)}
        onJumpToUnanswered={() => {
          const idx = questions.findIndex(({ question }) => !isAnswered(answers[question.id]));
          if (idx !== -1) {
            setActiveIndex(idx);
            setIsSubmitConfirmOpen(false);
            toast.info(`Melompat ke Soal ${idx + 1} (Belum Dijawab)`);
          } else {
            setIsSubmitConfirmOpen(false);
          }
        }}
        onJumpToFlagged={() => {
          const idx = questions.findIndex(({ question }) => flaggedQuestions.has(question.id));
          if (idx !== -1) {
            setActiveIndex(idx);
            setIsSubmitConfirmOpen(false);
            toast.info(`Melompat ke Soal ${idx + 1} (Ragu-Ragu)`);
          } else {
            setIsSubmitConfirmOpen(false);
          }
        }}
        onConfirm={() => {
          submitConfirmedRef.current = true;
          setIsSubmitConfirmOpen(false);
          submitFormRef.current?.requestSubmit();
        }}
      />

      {/* ANTI-CHEAT WARNING MODAL */}
      {warning && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/65 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2.5 text-red-600">
              <AlertTriangle className="size-6 shrink-0" />
              <p className="text-xs font-bold uppercase tracking-wider">
                Peringatan Ujian ({warning.count}/{maxAntiCheatViolations})
              </p>
            </div>
            <h3 className="mt-3 text-lg font-bold text-slate-900">{warning.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              {warning.message}
            </p>
            <button
              type="button"
              disabled={warning.count >= maxAntiCheatViolations}
              onClick={closeWarningAndRefocus}
              className="mt-6 w-full h-11 rounded-xl bg-blue-600 font-bold text-sm text-white shadow-sm hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50"
            >
              {warning.count >= maxAntiCheatViolations
                ? "Mengumpulkan Ujian..."
                : "Saya Mengerti & Lanjutkan Ujian"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SubmitSummaryDialog({
  isOpen,
  totalQuestions,
  answeredCount,
  flaggedCount,
  unansweredCount,
  isLoading,
  onCancel,
  onJumpToUnanswered,
  onJumpToFlagged,
  onConfirm,
}: {
  isOpen: boolean;
  totalQuestions: number;
  answeredCount: number;
  flaggedCount: number;
  unansweredCount: number;
  isLoading: boolean;
  onCancel: () => void;
  onJumpToUnanswered: () => void;
  onJumpToFlagged: () => void;
  onConfirm: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (isOpen) {
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [isOpen]);

  const hasIncomplete = unansweredCount > 0 || flaggedCount > 0;

  return (
    <dialog
      ref={dialogRef}
      className="w-[calc(100vw-2rem)] max-w-lg rounded-3xl border border-slate-200 bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-black/60 backdrop:backdrop-blur-xs animate-in fade-in zoom-in-95 duration-150"
      onCancel={onCancel}
    >
      <div className="p-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
          <div className="flex items-center gap-2">
            <Send className="size-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-950">
              Kumpulkan Lembar Ujian?
            </h2>
          </div>
        </div>

        {/* Summary Stat Cards - Clickable to Jump */}
        <div className="mt-5 grid grid-cols-3 gap-2.5">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-3 text-center">
            <span className="block text-2xl font-black text-emerald-700">
              {answeredCount}
            </span>
            <span className="block text-xs font-bold text-emerald-800 mt-0.5">
              Sudah Dijawab
            </span>
          </div>

          <button
            type="button"
            onClick={flaggedCount > 0 ? onJumpToFlagged : undefined}
            disabled={flaggedCount === 0}
            className={cn(
              "rounded-2xl border p-3 text-center transition-all",
              flaggedCount > 0
                ? "border-amber-300 bg-amber-50 hover:bg-amber-100/80 hover:border-amber-400 cursor-pointer active:scale-95 shadow-2xs"
                : "border-slate-200 bg-slate-50 opacity-60 cursor-default",
            )}
            title={flaggedCount > 0 ? "Ketuk untuk lompat ke soal ragu-ragu" : undefined}
          >
            <span className="block text-2xl font-black text-amber-700">
              {flaggedCount}
            </span>
            <span className="block text-xs font-bold text-amber-800 mt-0.5">
              Ragu-Ragu
            </span>
            {flaggedCount > 0 && (
              <span className="block text-[9.5px] font-bold text-amber-600 underline mt-0.5">
                Periksa →
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={unansweredCount > 0 ? onJumpToUnanswered : undefined}
            disabled={unansweredCount === 0}
            className={cn(
              "rounded-2xl border p-3 text-center transition-all",
              unansweredCount > 0
                ? "border-rose-300 bg-rose-50 hover:bg-rose-100/80 hover:border-rose-400 cursor-pointer active:scale-95 shadow-2xs"
                : "border-slate-200 bg-slate-50 opacity-60 cursor-default",
            )}
            title={unansweredCount > 0 ? "Ketuk untuk lompat ke soal belum dijawab" : undefined}
          >
            <span className="block text-2xl font-black text-rose-700">
              {unansweredCount}
            </span>
            <span className="block text-xs font-bold text-rose-800 mt-0.5">
              Belum Dijawab
            </span>
            {unansweredCount > 0 && (
              <span className="block text-[9.5px] font-bold text-rose-600 underline mt-0.5">
                Periksa →
              </span>
            )}
          </button>
        </div>

        {/* Incomplete / Warning Notice */}
        {hasIncomplete ? (
          <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900">
            <AlertTriangle className="size-4 shrink-0 text-amber-600 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Periksa Kembali Jawabanmu!</p>
              <p className="leading-relaxed text-amber-800">
                Masih ada <strong>{unansweredCount} soal belum dijawab</strong> dan{" "}
                <strong>{flaggedCount} soal bertanda ragu-ragu</strong>. Ketuk kotak di atas untuk langsung menuju nomor tersebut.
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-900">
            <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
            <span>Semua soal ({totalQuestions}) sudah kamu jawab dengan lengkap! Siap dikumpulkan.</span>
          </div>
        )}

        <p className="mt-3 text-xs text-slate-500 leading-relaxed">
          Setelah dikumpulkan, jawaban akan dikunci dan dinilai oleh sistem.
        </p>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 px-5 text-sm font-bold text-slate-700 hover:bg-slate-50 active:scale-95 transition-all"
          >
            Periksa Lagi
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 text-sm font-bold text-white shadow-sm hover:from-emerald-700 hover:to-teal-700 active:scale-95 transition-all disabled:opacity-50"
          >
            <Send className="size-4" />
            <span>{isLoading ? "Mengumpulkan..." : "Ya, Kumpulkan Ujian"}</span>
          </button>
        </div>
      </div>
    </dialog>
  );
}

function QuestionStimulus({
  stimulus,
}: {
  stimulus?: {
    title?: string | null;
    content?: string | null;
    media_url?: string | null;
    media_type?: string | null;
  } | null;
}) {
  if (!stimulus) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-dashed border-blue-200 bg-blue-50/40 p-4">
      {stimulus.title && (
        <div className="text-sm font-bold text-blue-950">{stimulus.title}</div>
      )}
      <QuestionMathRenderer
        content={stimulus.content}
        className="mt-2 text-sm leading-relaxed text-slate-700"
      />
      <QuestionMediaPreview
        mediaType={stimulus.media_type}
        url={stimulus.media_url}
        title={stimulus.title}
        className="mt-3"
      />
    </div>
  );
}

function QuestionAttachments({
  attachments,
}: {
  attachments?: Array<{
    id: string;
    media_type: string;
    url: string;
    file_name?: string | null;
    caption?: string | null;
    order_number: number;
  }> | null;
}) {
  const sortedAttachments = [...(attachments ?? [])].sort(
    (a, b) => a.order_number - b.order_number,
  );

  if (sortedAttachments.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-3">
      {sortedAttachments.map((attachment) => (
        <QuestionMediaPreview
          key={attachment.id}
          mediaType={attachment.media_type}
          url={attachment.url}
          title={attachment.file_name}
          caption={attachment.caption}
        />
      ))}
    </div>
  );
}

function firstRelation<T>(value: T | T[] | null | undefined) {
  return Array.isArray(value) ? (value[0] ?? null) : (value ?? null);
}

function QuestionContent({ content }: { content: string }) {
  const lines = content.split(/\r?\n/).filter((line) => line.trim().length > 0);

  return (
    <div className="space-y-3 leading-relaxed text-slate-900 font-medium">
      {lines.map((line, index) => {
        const trimmed = line.trim();

        if (isImageUrl(trimmed)) {
          return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={`${trimmed}-${index}`}
              src={trimmed}
              alt={`Media soal ${index + 1}`}
              className="max-h-80 w-full rounded-2xl border border-slate-200 object-contain shadow-2xs"
            />
          );
        }

        if (isVideoUrl(trimmed)) {
          return (
            <video
              key={`${trimmed}-${index}`}
              src={trimmed}
              controls
              className="max-h-80 w-full rounded-2xl border border-slate-200 shadow-2xs"
            />
          );
        }

        return (
          <QuestionMathRenderer
            key={`${trimmed}-${index}`}
            content={line}
          />
        );
      })}
    </div>
  );
}

function isAnswered(answer?: AnswerState) {
  return Boolean(
    answer?.selected_option_id || answer?.essay_answer?.trim(),
  );
}

function isImageUrl(value: string) {
  return /^https?:\/\/\S+\.(png|jpe?g|gif|webp|svg)(\?\S*)?$/i.test(value);
}

function isVideoUrl(value: string) {
  return /^https?:\/\/\S+\.(mp4|webm|ogg)(\?\S*)?$/i.test(value);
}

function getRemainingSeconds(value?: string | null, nowMs = Date.now()) {
  if (!value) {
    return 0;
  }

  return Math.max(0, Math.floor((new Date(value).getTime() - nowMs) / 1000));
}

function getSaveSummary(pendingSaveCount: number, failedSaveCount: number) {
  if (failedSaveCount > 0) {
    return "error";
  }

  if (pendingSaveCount > 0) {
    return "saving";
  }

  return "saved";
}

function getSaveStatusText(pendingSaveCount: number, failedSaveCount: number) {
  if (failedSaveCount > 0) {
    return `${failedSaveCount} gagal simpan`;
  }

  if (pendingSaveCount > 0) {
    return `${pendingSaveCount} menyimpan...`;
  }

  return "Tersimpan otomatis";
}

function getViolationStorageKey(attemptId: string) {
  return `exam-violations:${attemptId}`;
}

function getExamSessionStorageKey(attemptId: string) {
  return `exam-session:${attemptId}`;
}

function getFlaggedQuestionsStorageKey(attemptId: string) {
  return `exam-flagged-questions:${attemptId}`;
}

function getFontSizeStorageKey() {
  return `exam-font-size-preference`;
}

function readFlaggedQuestions(attemptId: string): Set<string> {
  if (typeof window === "undefined") {
    return new Set();
  }

  try {
    const raw = window.localStorage.getItem(getFlaggedQuestionsStorageKey(attemptId));
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? new Set(arr) : new Set();
  } catch {
    return new Set();
  }
}

function persistFlaggedQuestions(attemptId: string, flaggedSet: Set<string>) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      getFlaggedQuestionsStorageKey(attemptId),
      JSON.stringify(Array.from(flaggedSet)),
    );
  } catch {}
}

function readFontSizePreference(): FontSizeOption {
  if (typeof window === "undefined") {
    return "base";
  }

  try {
    const stored = window.localStorage.getItem(getFontSizeStorageKey());
    if (stored === "sm" || stored === "base" || stored === "lg" || stored === "xl") {
      return stored;
    }
    return "base";
  } catch {
    return "base";
  }
}

function persistFontSizePreference(size: FontSizeOption) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(getFontSizeStorageKey(), size);
  } catch {}
}

function getOrCreateExamSessionId(attemptId: string) {
  if (typeof window === "undefined") {
    return "server-render-placeholder";
  }

  const key = getExamSessionStorageKey(attemptId);
  const storedSessionId = window.localStorage.getItem(key);

  if (storedSessionId) {
    return storedSessionId;
  }

  const sessionId =
    window.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  window.localStorage.setItem(key, sessionId);

  return sessionId;
}

function getAnswerDraftStorageKey(attemptId: string) {
  return `exam-answer-drafts:${attemptId}`;
}

function readAnswerDrafts(attemptId: string): Record<string, AnswerState> {
  if (typeof window === "undefined") {
    return {};
  }

  const storedDrafts = window.localStorage.getItem(
    getAnswerDraftStorageKey(attemptId),
  );

  if (!storedDrafts) {
    return {};
  }

  try {
    const parsed = JSON.parse(storedDrafts) as Record<string, AnswerState>;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }
    return parsed;
  } catch {
    return {};
  }
}

function persistAnswerDraft(
  attemptId: string,
  questionId: string,
  answer: AnswerState,
) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const drafts = readAnswerDrafts(attemptId);

    window.localStorage.setItem(
      getAnswerDraftStorageKey(attemptId),
      JSON.stringify({
        ...drafts,
        [questionId]: {
          selected_option_id: answer.selected_option_id ?? null,
          essay_answer: answer.essay_answer ?? null,
        },
      }),
    );
  } catch {}
}

function clearAnswerDraft(attemptId: string, questionId: string) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const drafts = readAnswerDrafts(attemptId);
    delete drafts[questionId];

    if (Object.keys(drafts).length === 0) {
      window.localStorage.removeItem(getAnswerDraftStorageKey(attemptId));
      return;
    }

    window.localStorage.setItem(
      getAnswerDraftStorageKey(attemptId),
      JSON.stringify(drafts),
    );
  } catch {}
}

function getStoredViolationCount(attemptId: string) {
  if (typeof window === "undefined") {
    return 0;
  }

  const storedCount = Number(
    window.localStorage.getItem(getViolationStorageKey(attemptId)) ?? "0",
  );

  return Number.isFinite(storedCount) && storedCount > 0 ? storedCount : 0;
}
