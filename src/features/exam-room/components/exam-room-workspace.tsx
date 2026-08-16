"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Bookmark,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Info,
  LayoutGrid,
  Maximize2,
  Save,
  Send,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";

import { StatusPill } from "@/components/dashboard/status-pill";
import { submitAttemptAction } from "@/features/exam-room/actions";
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
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(() =>
    readFlaggedQuestions(attempt.id),
  );
  const [fontSize, setFontSize] = useState<FontSizeOption>(() =>
    readFontSizePreference(),
  );
  const [saveStatus, setSaveStatus] = useState<
    Record<string, SaveState>
  >({});
  const [saveMessage, setSaveMessage] = useState("");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine,
  );
  const [examSessionId] = useState(() => getOrCreateExamSessionId(attempt.id));
  const [sessionConflict, setSessionConflict] = useState(false);
  const [submitLocked, setSubmitLocked] = useState(false);
  const [isSubmitConfirmOpen, setIsSubmitConfirmOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isMobilePaletteOpen, setIsMobilePaletteOpen] = useState(false);
  const [warning, setWarning] = useState<{
    count: number;
    title: string;
    message: string;
  } | null>(null);
  const [violationCount, setViolationCount] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(() =>
    getRemainingSeconds(attempt.exam_schedules?.end_at, new Date(serverNow).getTime()),
  );
  const debounceTimers = useRef<Record<string, number>>({});
  const retryTimers = useRef<Record<string, number>>({});
  const saveVersions = useRef<Record<string, number>>({});
  const dirtyAnswerIdsRef = useRef<Set<string>>(new Set());
  const saveAnswerRef = useRef<
    | ((
        questionId: string,
        nextAnswer: AnswerState,
        attemptNumber?: number,
        version?: number,
      ) => Promise<boolean>)
    | null
  >(null);
  const answersRef = useRef<Record<string, AnswerState>>({});
  const saveStatusRef = useRef<Record<string, SaveState>>({});
  const submitFormRef = useRef<HTMLFormElement>(null);
  const submitConfirmedRef = useRef(false);
  const submitFlushInProgressRef = useRef(false);
  const examRoomRef = useRef<HTMLDivElement>(null);
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
  const connectionText = isOnline ? "Online" : "Offline";

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

  useEffect(() => {
    const onOnline = () => {
      setIsOnline(true);
      setSaveMessage("Koneksi kembali. Jawaban tertunda akan disimpan ulang.");
      sendExamEvent("online");
    };
    const onOffline = () => {
      setIsOnline(false);
      setSaveMessage("Browser offline. Jawaban akan perlu disimpan ulang.");
      sendExamEvent("offline");
    };

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [sendExamEvent]);

  useEffect(() => {
    if (!schedule?.end_at) {
      return;
    }

    const serverTimeOffsetMs = Date.now() - new Date(serverNow).getTime();
    const timer = window.setInterval(() => {
      setRemainingSeconds(
        getRemainingSeconds(schedule.end_at, Date.now() - serverTimeOffsetMs),
      );
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
        "Batas waktu ujian telah berakhir. Jawaban akan dikumpulkan otomatis.",
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
            `Sistem mendeteksi ${maxAntiCheatViolations} pelanggaran. Jawaban akan dikumpulkan otomatis.`,
        });
        autoSubmittingRef.current = true;
        setSubmitLocked(true);
        window.setTimeout(() => submitFormRef.current?.requestSubmit(), 900);
        return;
      }

      setWarning({
        count: nextCount,
        title: nextCount === 1 ? "Peringatan ujian" : "Peringatan keras",
        message,
      });
    };

    const onBlur = () =>
      registerViolation(
        "tab_blur",
        "Peringatan ujian",
        "Jendela ujian kehilangan fokus. Tetap berada di halaman ujian sampai selesai.",
      );
    const onFocus = () => sendExamEvent("tab_focus");
    const onVisibilityChange = () => {
      if (document.hidden) {
        registerViolation(
          "visibility_hidden",
          "Peringatan ujian",
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
          "Aktifkan kembali layar penuh dan lanjutkan ujian dengan tertib.",
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
        setSaveMessage("Browser offline. Jawaban belum tersimpan.");
        return false;
      }

      setSaveStatus((current) => ({ ...current, [questionId]: "saving" }));
      setSaveMessage(
        attemptNumber > 0
          ? `Mencoba simpan ulang jawaban (${attemptNumber + 1}/3)...`
          : "Menyimpan jawaban...",
      );

      const response = await fetch("/api/exam-answers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attempt_id: attempt.id,
          question_id: questionId,
          session_id: examSessionId,
          selected_option_id: nextAnswer.selected_option_id ?? "",
          essay_answer: nextAnswer.essay_answer ?? "",
        }),
      }).catch(() => null);

      if (saveVersions.current[questionId] !== version) {
        return false;
      }

      if (!response?.ok) {
        const body = response ? await response.json().catch(() => null) : null;

        if (attemptNumber < 2 && navigator.onLine) {
          setSaveMessage(body?.message ?? "Gagal menyimpan. Mencoba ulang...");
          retryTimers.current[questionId] = window.setTimeout(() => {
            void saveAnswerRef.current?.(
              questionId,
              nextAnswer,
              attemptNumber + 1,
              version,
            );
          }, 1200 * (attemptNumber + 1));
          return false;
        }

        setSaveStatus((current) => ({ ...current, [questionId]: "error" }));
        setSaveMessage(body?.message ?? "Jawaban gagal disimpan.");
        return false;
      }

      setSaveStatus((current) => ({ ...current, [questionId]: "saved" }));
      setLastSavedAt(new Date().toISOString());
      dirtyAnswerIdsRef.current.delete(questionId);
      clearAnswerDraft(attempt.id, questionId);
      setSaveMessage("Jawaban tersimpan.");
      return true;
    },
    [attempt.id, examSessionId],
  );

  useEffect(() => {
    saveAnswerRef.current = saveAnswer;
  }, [saveAnswer]);

  const updateAnswer = (questionId: string, nextAnswer: AnswerState) => {
    dirtyAnswerIdsRef.current.add(questionId);
    persistAnswerDraft(attempt.id, questionId, nextAnswer);
    setAnswers((current) => ({
      ...current,
      [questionId]: {
        ...current[questionId],
        ...nextAnswer,
      },
    }));
  };

  const handleOptionChange = (questionId: string, optionId: string) => {
    const nextAnswer = {
      selected_option_id: optionId,
      essay_answer: "",
    };

    updateAnswer(questionId, nextAnswer);
    void saveAnswer(questionId, nextAnswer);
  };

  const handleEssayChange = (questionId: string, value: string) => {
    const nextAnswer = {
      selected_option_id: null,
      essay_answer: value,
    };

    updateAnswer(questionId, nextAnswer);
    window.clearTimeout(debounceTimers.current[questionId]);
    debounceTimers.current[questionId] = window.setTimeout(() => {
      void saveAnswer(questionId, nextAnswer);
    }, 700);
  };

  const requestFullscreen = () => {
    void (examRoomRef.current ?? document.documentElement).requestFullscreen?.();
  };

  const retryFailedAnswer = (questionId: string) => {
    const answer = answers[questionId];

    if (!answer) {
      setSaveMessage("Belum ada jawaban untuk disimpan ulang.");
      return;
    }

    void saveAnswer(questionId, answer);
  };

  const flushPendingAnswersBeforeSubmit = async () => {
    const questionIds = Array.from(dirtyAnswerIdsRef.current);

    if (questionIds.length === 0) {
      return true;
    }

    questionIds.forEach((questionId) => {
      window.clearTimeout(debounceTimers.current[questionId]);
    });

    setSaveMessage(
      `Menyimpan ${questionIds.length} jawaban terakhir sebelum submit...`,
    );

    const results = await Promise.all(
      questionIds.map((questionId) => {
        const answer = answersRef.current[questionId];

        return answer ? saveAnswer(questionId, answer) : Promise.resolve(true);
      }),
    );

    const ok = results.every(Boolean);

    if (!ok) {
      setSaveMessage("Jawaban terakhir belum berhasil tersimpan. Coba lagi sebelum submit.");
    }

    return ok;
  };

  useEffect(() => {
    if (restoredDraftRef.current || isReadOnly) {
      return;
    }

    restoredDraftRef.current = true;
    const draftAnswers = readAnswerDrafts(attempt.id);
    const questionIds = new Set(questions.map(({ question }) => question.id));
    const draftEntries = Object.entries(draftAnswers).filter(([questionId]) =>
      questionIds.has(questionId),
    );

    if (draftEntries.length === 0) {
      return;
    }

    const timer = window.setTimeout(() => {
      setAnswers((current) => ({
        ...current,
        ...Object.fromEntries(
          draftEntries.map(([questionId, answer]) => [
            questionId,
            {
              ...current[questionId],
              ...answer,
            },
          ]),
        ),
      }));
      setSaveStatus((current) => ({
        ...current,
        ...Object.fromEntries(
          draftEntries.map(([questionId]) => [questionId, "error" as SaveState]),
        ),
      }));
      setSaveMessage(
        `Cadangan offline dipulihkan. Menyimpan ulang ${draftEntries.length} jawaban...`,
      );

      if (navigator.onLine) {
        draftEntries.forEach(([questionId, answer]) => {
          void saveAnswer(questionId, answer);
        });
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [attempt.id, isReadOnly, questions, saveAnswer]);

  useEffect(() => {
    if (!isOnline || isReadOnly) {
      return;
    }

    const failedQuestionIds = Object.entries(saveStatusRef.current)
      .filter(([, status]) => status === "error")
      .map(([questionId]) => questionId);

    if (failedQuestionIds.length === 0) {
      return;
    }

    setSaveMessage(
      `Koneksi kembali. Menyimpan ulang ${failedQuestionIds.length} jawaban tertunda...`,
    );

    failedQuestionIds.forEach((questionId) => {
      const answer = answersRef.current[questionId];

      if (answer) {
        void saveAnswer(questionId, answer);
      }
    });
  }, [isOnline, isReadOnly, saveAnswer]);

  const closeWarningAndRefocus = () => {
    setWarning(null);

    if (!document.fullscreenElement) {
      requestFullscreen();
    }
  };

  if (!currentQuestion) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600 shadow-sm">
        Belum ada soal pada paket ujian ini.
      </div>
    );
  }

  const isCurrentFlagged = flaggedQuestions.has(currentQuestion.id);

  const fontSizeClasses = {
    sm: "text-xs md:text-sm leading-relaxed",
    base: "text-sm md:text-base leading-relaxed",
    lg: "text-base md:text-lg leading-relaxed",
    xl: "text-lg md:text-xl leading-relaxed",
  };

  const timerTone =
    remainingSeconds <= 300
      ? "danger"
      : remainingSeconds <= 600
        ? "warning"
        : "normal";

  return (
    <div
      ref={examRoomRef}
      className="space-y-3 bg-[#F8FAFC] pb-24 select-none [:fullscreen]:min-h-screen [:fullscreen]:overflow-y-auto [:fullscreen]:bg-[#F8FAFC] [:fullscreen]:p-4 md:space-y-4 md:pb-6"
    >
      {/* Top Distraction-Free Exam Header */}
      <header className="sticky top-0 z-30 rounded-2xl border border-slate-200/80 bg-white/95 px-3 py-2.5 shadow-sm backdrop-blur-md md:px-5 md:py-3.5">
        <div className="flex items-center justify-between gap-2">
          {/* Timer & Subject Info */}
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            {/* Color-Coded Adaptive Timer */}
            <div
              className={cn(
                "inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-bold transition-all shadow-xs sm:px-3.5 sm:py-2 sm:text-sm",
                timerTone === "danger" &&
                  "bg-red-600 text-white animate-pulse shadow-red-200 ring-2 ring-red-300",
                timerTone === "warning" &&
                  "bg-amber-500 text-white shadow-amber-100 ring-1 ring-amber-300",
                timerTone === "normal" &&
                  "bg-slate-900 text-white",
              )}
              title="Sisa Waktu Ujian"
            >
              <Clock3 className="size-3.5 shrink-0 sm:size-4" aria-hidden="true" />
              <span className="tabular-nums tracking-wide">
                {formatRemainingTime(remainingSeconds)}
              </span>
            </div>

            {/* Quick Status Chips */}
            <div className="hidden items-center gap-1.5 sm:flex">
              {/* Online/Offline Status */}
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-semibold",
                  isOnline
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-red-200 bg-red-50 text-red-700 animate-bounce",
                )}
              >
                {isOnline ? (
                  <Wifi className="size-3" />
                ) : (
                  <WifiOff className="size-3" />
                )}
                <span>{connectionText}</span>
              </span>

              {/* Auto Save Status */}
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-medium",
                  saveSummary === "error"
                    ? "border-red-200 bg-red-50 text-red-700"
                    : saveSummary === "saving"
                      ? "border-amber-200 bg-amber-50 text-amber-700"
                      : "border-slate-200 bg-slate-50 text-slate-600",
                )}
              >
                {saveSummary === "error" ? (
                  <X className="size-3 text-red-600" />
                ) : saveSummary === "saving" ? (
                  <Save className="size-3 text-amber-600 animate-spin" />
                ) : (
                  <CheckCircle2 className="size-3 text-emerald-600" />
                )}
                <span className="hidden md:inline">{saveStatusText}</span>
              </span>
            </div>
          </div>

          {/* Right Controls: Font Scaler, Info & Fullscreen */}
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            {/* Font Size Scaler (A- / A / A+) */}
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
                title="Ukuran Teks Normal"
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

            {/* Exam Info Detail Trigger */}
            <button
              type="button"
              onClick={() => setIsDetailOpen(true)}
              className="inline-flex size-8 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition-all active:scale-90 hover:bg-slate-50 hover:text-slate-900"
              aria-label="Buka detail ujian"
              title="Detail Ujian"
            >
              <Info className="size-4" aria-hidden="true" />
            </button>

            {/* Fullscreen Toggle */}
            {!isReadOnly && (
              <button
                type="button"
                onClick={requestFullscreen}
                className="inline-flex size-8 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition-all active:scale-90 hover:bg-slate-50 hover:text-slate-900"
                aria-label="Masuk layar penuh"
                title="Layar Penuh"
              >
                <Maximize2 className="size-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Detail Dialog */}
      <ExamDetailDialog
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        items={[
          {
            label: "Status",
            value: <StatusPill value={attempt.status} />,
          },
          {
            label: "Sisa Waktu",
            value: (
              <span
                className={cn(
                  "font-bold",
                  remainingSeconds <= 300 && "text-red-600",
                )}
              >
                {formatRemainingTime(remainingSeconds)}
              </span>
            ),
          },
          {
            label: "Koneksi",
            value: connectionText,
          },
          {
            label: "Penyimpanan",
            value: saveStatusText,
          },
          ...(lastSavedAt
            ? [
                {
                  label: "Terakhir Tersimpan",
                  value: formatDateTime(lastSavedAt),
                },
              ]
            : []),
          {
            label: "Waktu Mulai",
            value: formatDateTime(attempt.started_at),
          },
          {
            label: "Batas Waktu",
            value: formatDateTime(schedule?.end_at),
          },
          {
            label: "Pelanggaran Anti-Cheat",
            value: `${violationCount}/${maxAntiCheatViolations}`,
          },
          {
            label: "Progres Terjawab",
            value: `${answeredCount} dari ${questions.length} soal`,
          },
          {
            label: "Ditandai Ragu-Ragu",
            value: `${flaggedCount} soal`,
          },
        ]}
      />

      {isLocked ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800 shadow-xs">
          🔒 Pengerjaan dikunci oleh pengawas.{" "}
          {attempt.lock_reason ?? "Tunggu instruksi sebelum melanjutkan."}
        </div>
      ) : null}

      {sessionConflict ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800 shadow-xs">
          ⚠️ Pengerjaan sedang aktif di perangkat atau tab lain. Tutup sesi lain atau tunggu sekitar 2 menit sebelum melanjutkan di perangkat ini.
        </div>
      ) : null}

      {/* Main Workspace Layout */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        {/* Question Panel */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs md:p-6">
          {/* Question Header */}
          <div className="mb-4 flex flex-col gap-3 border-b border-slate-100 pb-3.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-xl bg-blue-600 text-sm font-extrabold text-white shadow-2xs">
                {activeIndex + 1}
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Soal {activeIndex + 1} dari {questions.length}
                </p>
                <h2 className="text-sm font-bold text-slate-900">
                  {examPackage?.subjects?.name ?? "Mata Pelajaran"}
                </h2>
              </div>
            </div>

            {/* Badges & Ragu-Ragu Toggle (Desktop / Tablet view) */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="rounded-lg bg-slate-100 px-2 py-1 font-semibold text-slate-700">
                {currentQuestion.type === "essay" ? "Esai" : "Pilihan Ganda"}
              </span>
              <span className="rounded-lg bg-slate-100 px-2 py-1 font-semibold text-slate-700">
                {Number(currentQuestion.point ?? 0)} Poin
              </span>

              {/* Ragu-Ragu button in header */}
              <button
                type="button"
                onClick={() => toggleFlagQuestion(currentQuestion.id)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-bold transition-all active:scale-95",
                  isCurrentFlagged
                    ? "border-amber-400 bg-amber-100 text-amber-900 shadow-2xs ring-1 ring-amber-400"
                    : "border-slate-200 bg-slate-50 text-slate-600 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-800",
                )}
              >
                <Bookmark className={cn("size-3.5", isCurrentFlagged && "fill-amber-500 text-amber-600")} />
                <span>{isCurrentFlagged ? "Ragu-Ragu" : "Tandai Ragu"}</span>
              </button>

              {saveStatus[currentQuestion.id] === "error" ? (
                <button
                  type="button"
                  onClick={() => retryFailedAnswer(currentQuestion.id)}
                  className="rounded-lg border border-red-300 bg-red-50 px-2 py-1 text-xs font-bold text-red-700 hover:bg-red-100 active:scale-95"
                >
                  Coba Simpan Lagi
                </button>
              ) : null}
            </div>
          </div>

          {/* Question Body */}
          <div className={cn("space-y-4", fontSizeClasses[fontSize])}>
            <QuestionStimulus stimulus={firstRelation(currentQuestion.question_stimuli)} />
            <QuestionContent content={currentQuestion.content} />
            <QuestionAttachments attachments={currentQuestion.question_attachments} />
          </div>

          {/* Options / Essay Input */}
          <div className="mt-5 space-y-3 md:mt-7">
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
                        "flex cursor-pointer items-start gap-3.5 rounded-2xl border p-3.5 sm:p-4.5 font-medium transition-all duration-150 select-none active:scale-[0.99] min-h-[54px]",
                        checked
                          ? "border-blue-600 bg-blue-50/90 text-slate-950 shadow-xs ring-2 ring-blue-500/30"
                          : "border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50/70",
                        isReadOnly && "cursor-not-allowed opacity-70",
                      )}
                    >
                      {/* Option Letter Badge (A, B, C, D, E) */}
                      <div
                        className={cn(
                          "flex size-8 shrink-0 items-center justify-center rounded-xl font-extrabold text-sm transition-colors",
                          checked
                            ? "bg-blue-600 text-white shadow-xs"
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
                          "flex-1 pt-0.5 break-words font-medium",
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

          {/* Desktop Navigation Footer */}
          <div className="mt-7 hidden border-t border-slate-100 pt-4 md:flex md:items-center md:justify-between">
            <p className="text-xs text-slate-500">
              {saveMessage === "Jawaban tersimpan."
                ? "Semua jawaban otomatis tersimpan."
                : saveMessage}
            </p>
            <div className="flex gap-2.5">
              <button
                type="button"
                disabled={activeIndex === 0}
                onClick={() => setActiveIndex((index) => Math.max(0, index - 1))}
                className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-800 shadow-2xs transition hover:bg-slate-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="size-4" />
                <span>Sebelumnya</span>
              </button>

              <button
                type="button"
                onClick={() => toggleFlagQuestion(currentQuestion.id)}
                className={cn(
                  "inline-flex h-11 items-center gap-1.5 rounded-xl border px-4 text-sm font-bold transition active:scale-95",
                  isCurrentFlagged
                    ? "border-amber-400 bg-amber-100 text-amber-900 ring-1 ring-amber-400"
                    : "border-slate-200 bg-white text-slate-700 hover:border-amber-300 hover:bg-amber-50",
                )}
              >
                <Bookmark className={cn("size-4", isCurrentFlagged && "fill-amber-500 text-amber-600")} />
                <span>{isCurrentFlagged ? "Ragu-Ragu" : "Ragu-Ragu"}</span>
              </button>

              {activeIndex === questions.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setIsSubmitConfirmOpen(true)}
                  disabled={!canSubmitManually}
                  className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 text-sm font-bold text-white shadow-sm transition hover:from-emerald-700 hover:to-teal-700 active:scale-95 disabled:opacity-50"
                >
                  <CheckCircle2 className="size-4" />
                  <span>Selesai Ujian</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    setActiveIndex((index) =>
                      Math.min(questions.length - 1, index + 1),
                    )
                  }
                  className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-blue-600 px-6 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 active:scale-95"
                >
                  <span>Berikutnya</span>
                  <ChevronRight className="size-4" />
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Desktop Sidebar: Question Palette */}
        <aside className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs lg:sticky lg:top-20 lg:self-start">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-950">Daftar Soal</h3>
              <p className="text-xs text-slate-500">
                Pilih nomor untuk berpindah soal.
              </p>
            </div>
            <span className="rounded-lg bg-blue-50 px-2 py-1 text-xs font-extrabold text-blue-700">
              {answeredCount}/{questions.length}
            </span>
          </div>

          {/* Grid Numbers */}
          <div className="grid grid-cols-5 gap-2 sm:grid-cols-6 lg:grid-cols-5">
            {questions.map(({ question }, index) => {
              const active = index === activeIndex;
              const answered = isAnswered(answers[question.id]);
              const flagged = flaggedQuestions.has(question.id);

              return (
                <button
                  key={question.id}
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
                    <span className="absolute -top-1 -right-1 flex size-3.5 items-center justify-center rounded-full bg-amber-800 text-[9px] text-white">
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

          {/* Status Legend */}
          <div className="grid gap-2 border-t border-slate-100 pt-3 text-xs text-slate-600">
            <div className="flex items-center gap-2 font-medium">
              <span className="size-3.5 rounded-md bg-blue-600" />
              <span>Sedang Dibuka ({activeIndex + 1})</span>
            </div>
            <div className="flex items-center gap-2 font-medium">
              <span className="size-3.5 rounded-md bg-emerald-500" />
              <span>Sudah Dijawab ({answeredCount})</span>
            </div>
            <div className="flex items-center gap-2 font-medium">
              <span className="size-3.5 rounded-md bg-amber-400" />
              <span>Ragu-Ragu ({flaggedCount})</span>
            </div>
            <div className="flex items-center gap-2 font-medium">
              <span className="size-3.5 rounded-md border border-slate-300 bg-white" />
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

                if (submitFlushInProgressRef.current) {
                  return;
                }

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
                    : "Ada jawaban gagal tersimpan. Coba simpan lagi sebelum dikumpulkan.",
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
              className="mt-2 flex w-full h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 font-bold text-sm text-white shadow-sm transition-all hover:from-emerald-700 hover:to-teal-700 active:scale-98 disabled:cursor-not-allowed disabled:opacity-50"
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

      {/* Ergonomic Mobile Floating Bottom Bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-3 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] shadow-[0_-8px_25px_rgba(15,23,42,0.12)] backdrop-blur-md select-none md:hidden">
        <div className="mx-auto flex max-w-md items-center justify-between gap-1.5">
          {/* Prev button */}
          <button
            type="button"
            disabled={activeIndex === 0}
            onClick={() => setActiveIndex((index) => Math.max(0, index - 1))}
            className="inline-flex h-11 w-14 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 shadow-2xs transition-all active:scale-90 disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="Soal sebelumnya"
          >
            <ChevronLeft className="size-5" />
          </button>

          {/* Ragu-Ragu toggle button */}
          <button
            type="button"
            onClick={() => toggleFlagQuestion(currentQuestion.id)}
            className={cn(
              "inline-flex h-11 items-center justify-center gap-1 rounded-xl border px-3 text-xs font-bold transition-all active:scale-90",
              isCurrentFlagged
                ? "border-amber-400 bg-amber-400 text-amber-950 font-black shadow-xs ring-1 ring-amber-400"
                : "border-slate-200 bg-slate-50 text-slate-700 hover:border-amber-300",
            )}
            aria-label="Tandai Ragu-ragu"
          >
            <Bookmark className={cn("size-4", isCurrentFlagged && "fill-amber-950 text-amber-950")} />
            <span>{isCurrentFlagged ? "Ragu" : "Ragu"}</span>
          </button>

          {/* Question drawer trigger */}
          <button
            type="button"
            onClick={() => setIsMobilePaletteOpen(true)}
            className="flex flex-1 items-center justify-center gap-1.5 h-11 rounded-xl border border-blue-200 bg-blue-50/90 px-2 text-xs font-extrabold text-blue-700 shadow-2xs transition-all active:scale-95"
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
              className="inline-flex h-11 px-3 items-center justify-center gap-1 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-xs font-extrabold text-white shadow-xs transition-all active:scale-90 disabled:opacity-50"
            >
              <CheckCircle2 className="size-4" />
              <span>Selesai</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() =>
                setActiveIndex((index) => Math.min(questions.length - 1, index + 1))
              }
              className="inline-flex h-11 w-14 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-xs font-bold text-white shadow-xs transition-all active:scale-90"
              aria-label="Soal berikutnya"
            >
              <ChevronRight className="size-5" />
            </button>
          )}
        </div>
      </div>

      {/* Mobile Question Palette Bottom Sheet Drawer */}
      {isMobilePaletteOpen ? (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 md:hidden">
          <button
            type="button"
            aria-label="Tutup daftar nomor soal"
            className="absolute inset-0"
            onClick={() => setIsMobilePaletteOpen(false)}
          />
          <div className="relative z-10 max-h-[85vh] flex flex-col w-full rounded-t-3xl border-t border-slate-200 bg-white p-4 pb-6 shadow-2xl animate-in slide-in-from-bottom duration-200">
            {/* Drawer Handle */}
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-slate-300" />

            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-950">Kisi-Kisi Nomor Soal</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Terjawab: <strong className="text-emerald-600">{answeredCount}</strong> | Ragu: <strong className="text-amber-600">{flaggedCount}</strong> | Belum: <strong className="text-slate-600">{unansweredCount}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsMobilePaletteOpen(false)}
                className="flex size-8 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 active:scale-90"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Status Legend */}
            <div className="flex flex-wrap items-center gap-3 py-2.5 text-[11px] text-slate-600 border-b border-slate-100">
              <span className="flex items-center gap-1.5 font-semibold">
                <span className="size-3 rounded-md bg-blue-600" /> Aktif
              </span>
              <span className="flex items-center gap-1.5 font-semibold">
                <span className="size-3 rounded-md bg-emerald-500" /> Terjawab
              </span>
              <span className="flex items-center gap-1.5 font-semibold">
                <span className="size-3 rounded-md bg-amber-400" /> Ragu-Ragu
              </span>
              <span className="flex items-center gap-1.5 font-semibold">
                <span className="size-3 rounded-md border border-slate-300 bg-white" /> Belum
              </span>
            </div>

            {/* Grid numbers */}
            <div className="flex-1 overflow-y-auto py-4">
              <div className="grid grid-cols-5 gap-2.5">
                {questions.map(({ question }, index) => {
                  const active = index === activeIndex;
                  const answered = isAnswered(answers[question.id]);
                  const flagged = flaggedQuestions.has(question.id);

                  return (
                    <button
                      key={`palette-${question.id}`}
                      type="button"
                      onClick={() => {
                        setActiveIndex(index);
                        setIsMobilePaletteOpen(false);
                      }}
                      className={cn(
                        "relative flex h-12 items-center justify-center rounded-2xl border text-sm font-bold transition-all duration-150 select-none active:scale-90",
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
                    >
                      <span>{index + 1}</span>
                      {flagged && !active && (
                        <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-amber-800 text-[10px] text-white">
                          ?
                        </span>
                      )}
                      {answered && !flagged && !active && (
                        <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-emerald-700 text-[9px] text-white">
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Submit button from drawer */}
            <div className="border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => {
                  setIsMobilePaletteOpen(false);
                  if (canSubmitManually) {
                    setIsSubmitConfirmOpen(true);
                  }
                }}
                disabled={!canSubmitManually}
                className="flex w-full h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 font-bold text-sm text-white shadow-sm transition-all active:scale-98 disabled:opacity-50"
              >
                <Send className="size-4" />
                <span>Kumpulkan Ujian Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Smart Submit Confirmation Modal */}
      <SubmitSummaryDialog
        isOpen={isSubmitConfirmOpen}
        totalQuestions={questions.length}
        answeredCount={answeredCount}
        flaggedCount={flaggedCount}
        unansweredCount={unansweredCount}
        isLoading={submitLocked}
        onCancel={() => setIsSubmitConfirmOpen(false)}
        onConfirm={() => {
          submitConfirmedRef.current = true;
          setIsSubmitConfirmOpen(false);
          submitFormRef.current?.requestSubmit();
        }}
      />

      {/* Anti Cheat Warning Modal */}
      {warning ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/65 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
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
              className="mt-6 w-full h-11 rounded-xl bg-blue-600 font-bold text-sm text-white shadow-sm transition hover:bg-blue-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {warning.count >= maxAntiCheatViolations
                ? "Mengumpulkan Ujian..."
                : "Saya Mengerti & Lanjutkan Ujian"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

type DetailItem = {
  label: string;
  value: React.ReactNode;
};

function SubmitSummaryDialog({
  isOpen,
  totalQuestions,
  answeredCount,
  flaggedCount,
  unansweredCount,
  isLoading,
  onCancel,
  onConfirm,
}: {
  isOpen: boolean;
  totalQuestions: number;
  answeredCount: number;
  flaggedCount: number;
  unansweredCount: number;
  isLoading: boolean;
  onCancel: () => void;
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
      className="w-[calc(100vw-2rem)] max-w-lg rounded-3xl border border-slate-200 bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-black/60"
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
          <button
            type="button"
            onClick={onCancel}
            className="flex size-8 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100 active:scale-90"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Summary Stat Cards */}
        <div className="mt-5 grid grid-cols-3 gap-2.5">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-3 text-center">
            <span className="block text-2xl font-black text-emerald-700">
              {answeredCount}
            </span>
            <span className="block text-xs font-bold text-emerald-800 mt-0.5">
              Sudah Dijawab
            </span>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-3 text-center">
            <span className="block text-2xl font-black text-amber-700">
              {flaggedCount}
            </span>
            <span className="block text-xs font-bold text-amber-800 mt-0.5">
              Ragu-Ragu
            </span>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-center">
            <span className="block text-2xl font-black text-slate-700">
              {unansweredCount}
            </span>
            <span className="block text-xs font-bold text-slate-800 mt-0.5">
              Belum Dijawab
            </span>
          </div>
        </div>

        {/* Incomplete / Warning Notice */}
        {hasIncomplete ? (
          <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900">
            <AlertTriangle className="size-4 shrink-0 text-amber-600 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Periksa Kembali Jawabanmu!</p>
              <p className="leading-relaxed text-amber-800">
                Masih ada <strong>{unansweredCount} soal belum dijawab</strong> dan{" "}
                <strong>{flaggedCount} soal bertanda ragu-ragu</strong>. Jawaban yang sudah dipilih tetap akan dinilai.
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
          Setelah ujian dikumpulkan, lembar jawaban akan dikunci dan kamu tidak bisa mengubah jawaban lagi.
        </p>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 px-5 text-sm font-bold text-slate-700 hover:bg-slate-50 active:scale-95"
          >
            Periksa Lagi
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 text-sm font-bold text-white shadow-sm transition hover:from-emerald-700 hover:to-teal-700 active:scale-95 disabled:opacity-50"
          >
            <Send className="size-4" />
            <span>{isLoading ? "Mengumpulkan..." : "Ya, Kumpulkan Ujian"}</span>
          </button>
        </div>
      </div>
    </dialog>
  );
}

function ExamDetailDialog({
  isOpen,
  items,
  onClose,
}: {
  isOpen: boolean;
  items: DetailItem[];
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (isOpen) {
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [isOpen]);

  return (
    <dialog
      ref={dialogRef}
      className="w-[calc(100vw-2rem)] max-w-md rounded-3xl border border-slate-200 bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-black/60"
      onCancel={onClose}
    >
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <h2 className="text-base font-bold text-slate-950">Detail Ujian</h2>
        <button
          type="button"
          onClick={onClose}
          className="flex size-8 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100 active:scale-90"
          aria-label="Tutup detail ujian"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>
      <dl className="grid gap-3.5 px-5 py-4 text-sm">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between gap-4 border-b border-slate-50 pb-2.5 last:border-0 last:pb-0"
          >
            <dt className="text-slate-500 text-xs font-medium">{item.label}</dt>
            <dd className="text-right font-bold text-slate-900">{item.value}</dd>
          </div>
        ))}
      </dl>
      <div className="border-t border-slate-100 px-5 py-3.5">
        <button
          type="button"
          onClick={onClose}
          className="w-full h-11 rounded-xl bg-slate-900 text-sm font-bold text-white transition hover:bg-slate-800 active:scale-95"
        >
          Tutup
        </button>
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
      {stimulus.title ? (
        <div className="text-sm font-bold text-blue-950">{stimulus.title}</div>
      ) : null}
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

function formatDateTime(value?: string | null) {
  if (!value) {
    return "-";
  }

  return formatJakartaDateTime(value);
}

function getRemainingSeconds(value?: string | null, nowMs = Date.now()) {
  if (!value) {
    return 0;
  }

  return Math.max(0, Math.floor((new Date(value).getTime() - nowMs) / 1000));
}

function formatRemainingTime(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const paddedMinutes = String(minutes).padStart(2, "0");
  const paddedSeconds = String(seconds).padStart(2, "0");

  if (hours > 0) {
    return `${hours}:${paddedMinutes}:${paddedSeconds}`;
  }

  return `${paddedMinutes}:${paddedSeconds}`;
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
