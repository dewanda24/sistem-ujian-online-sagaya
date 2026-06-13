"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ConfirmDialog } from "@/components/common/dialogs/confirm-dialog";
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
  const answeredCount = useMemo(
    () =>
      questions.filter(({ question }) => isAnswered(answers[question.id]))
        .length,
    [answers, questions],
  );
  const saveStates = Object.values(saveStatus);
  const pendingSaveCount = saveStates.filter((status) => status === "saving").length;
  const failedSaveCount = saveStates.filter((status) => status === "error").length;
  const canSubmitManually =
    !isReadOnly && !submitLocked && pendingSaveCount === 0 && failedSaveCount === 0;

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
          "Keluar fullscreen terdeteksi",
          "Aktifkan kembali fullscreen dan lanjutkan ujian dengan tertib.",
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
        `Draft lokal dipulihkan. Menyimpan ulang ${draftEntries.length} jawaban...`,
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
      <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
        Belum ada soal pada paket ujian ini.
      </div>
    );
  }

  return (
    <div
      ref={examRoomRef}
      className="space-y-4 bg-background p-0 [:fullscreen]:h-screen [:fullscreen]:overflow-y-auto [:fullscreen]:p-4"
    >
      <div className="grid gap-3 rounded-lg border bg-card p-4 text-sm md:grid-cols-6">
        <InfoItem label="Status" value={<StatusPill value={attempt.status} />} />
        <InfoItem
          label="Sisa Waktu"
          value={
            <span
              className={cn(
                "font-semibold",
                remainingSeconds <= 300 && "text-destructive",
              )}
            >
              {formatRemainingTime(remainingSeconds)}
            </span>
          }
        />
        <InfoItem
          label="Batas Waktu"
          value={formatDateTime(schedule?.end_at)}
        />
        <InfoItem
          label="Mulai"
          value={formatDateTime(attempt.started_at)}
        />
        <InfoItem
          label="Soal Terjawab"
          value={`${answeredCount}/${questions.length}`}
        />
      <InfoItem
        label="Pelanggaran"
        value={`${violationCount}/${maxAntiCheatViolations}`}
      />
      </div>

      <div
        className={cn(
          "grid gap-3 rounded-lg border p-3 text-sm md:grid-cols-4",
          !isOnline || failedSaveCount > 0
            ? "border-destructive/30 bg-destructive/10 text-destructive"
            : pendingSaveCount > 0
              ? "border-amber-200 bg-amber-50 text-amber-900"
              : "bg-card text-muted-foreground",
        )}
      >
        <InfoItem
          label="Status Koneksi"
          value={isOnline ? "Online" : "Offline"}
        />
        <InfoItem
          label="Status Simpan"
          value={
            failedSaveCount > 0
              ? `${failedSaveCount} gagal`
              : pendingSaveCount > 0
                ? `${pendingSaveCount} menyimpan`
                : "Aman"
          }
        />
        <InfoItem
          label="Terakhir Tersimpan"
          value={lastSavedAt ? formatDateTime(lastSavedAt) : "-"}
        />
        <InfoItem
          label="Jawaban Lokal"
          value={`${answeredCount}/${questions.length}`}
        />
      </div>

      {isLocked ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          Pengerjaan dikunci oleh pengawas.{" "}
          {attempt.lock_reason ?? "Tunggu instruksi sebelum melanjutkan."}
        </div>
      ) : null}

      {sessionConflict ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          Pengerjaan sedang aktif di perangkat atau tab lain. Tutup sesi lain atau
          tunggu sekitar 2 menit sebelum melanjutkan di perangkat ini.
        </div>
      ) : null}

      {!isReadOnly ? (
        <div className="flex flex-col gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 md:flex-row md:items-center md:justify-between">
          <span>
            Mode ujian aktif. Tetap di halaman ini dan gunakan fullscreen bila
            diminta pengawas.
          </span>
          <button
            type="button"
            onClick={requestFullscreen}
            className="rounded-md border border-amber-300 bg-white px-3 py-2 text-xs font-medium hover:bg-amber-100"
          >
            Masuk Fullscreen
          </button>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <section className="rounded-lg border bg-card p-4 shadow-sm md:p-6">
          <div className="mb-5 flex flex-col gap-3 border-b pb-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-medium uppercase text-muted-foreground">
                Soal {activeIndex + 1} dari {questions.length}
              </p>
              <h2 className="mt-1 text-base font-semibold">
                {examPackage?.subjects?.name ?? "Mata pelajaran"}
              </h2>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-md bg-muted px-2 py-1">
                {currentQuestion.type === "essay" ? "Essay" : "Pilihan ganda"}
              </span>
              <span className="rounded-md bg-muted px-2 py-1">
                {Number(currentQuestion.point ?? 0)} poin
              </span>
              <span
                className={cn(
                  "rounded-md px-2 py-1",
                  saveStatus[currentQuestion.id] === "error"
                    ? "bg-destructive/10 text-destructive"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {saveStatus[currentQuestion.id] === "saving"
                  ? "Menyimpan"
                  : saveStatus[currentQuestion.id] === "saved"
                    ? "Tersimpan"
                    : saveStatus[currentQuestion.id] === "error"
                      ? "Gagal simpan"
                      : isAnswered(answers[currentQuestion.id])
                        ? "Sudah dijawab"
                        : "Belum dijawab"}
              </span>
              {saveStatus[currentQuestion.id] === "error" ? (
                <button
                  type="button"
                  onClick={() => retryFailedAnswer(currentQuestion.id)}
                  className="rounded-md border border-destructive/30 px-2 py-1 text-xs text-destructive hover:bg-destructive/10"
                >
                  Retry simpan
                </button>
              ) : null}
            </div>
          </div>

          <QuestionStimulus stimulus={firstRelation(currentQuestion.question_stimuli)} />
          <QuestionContent content={currentQuestion.content} />
          <QuestionAttachments attachments={currentQuestion.question_attachments} />

          <div className="mt-6 space-y-3">
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
                        "flex cursor-pointer gap-3 rounded-lg border p-3 text-sm transition",
                        checked
                          ? "border-primary bg-primary/5"
                          : "hover:border-primary/40 hover:bg-muted/50",
                        isReadOnly && "cursor-not-allowed opacity-70",
                      )}
                    >
                      <input
                        type="radio"
                        name={`question-${currentQuestion.id}`}
                        value={option.id}
                        checked={checked}
                        disabled={isReadOnly}
                        onChange={() =>
                          handleOptionChange(currentQuestion.id, option.id)
                        }
                        className="mt-1"
                      />
                      <span className="grid gap-1">
                        <span className="font-semibold">
                          {option.option_label}
                        </span>
                        <span className="leading-6">
                          <QuestionMathRenderer content={option.option_text} />
                        </span>
                      </span>
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
                placeholder="Tulis jawaban essay di sini..."
                className="min-h-44 w-full rounded-lg border bg-background px-3 py-3 text-sm leading-6 outline-none transition focus:border-primary disabled:cursor-not-allowed disabled:opacity-70"
              />
            )}
          </div>

          <div className="mt-6 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="min-h-5 text-xs text-muted-foreground">
              {saveMessage}
              {failedSaveCount > 0
                ? " Jangan kumpulkan ujian sebelum jawaban gagal berhasil disimpan."
                : ""}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={activeIndex === 0}
                onClick={() => setActiveIndex((index) => Math.max(0, index - 1))}
                className="rounded-md border px-4 py-2 text-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
              >
                Sebelumnya
              </button>
              <button
                type="button"
                disabled={activeIndex === questions.length - 1}
                onClick={() =>
                  setActiveIndex((index) =>
                    Math.min(questions.length - 1, index + 1),
                  )
                }
                className="rounded-md border px-4 py-2 text-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        </section>

        <aside className="space-y-4 rounded-lg border bg-card p-4 shadow-sm lg:sticky lg:top-20 lg:self-start">
          <div>
            <h3 className="text-sm font-semibold">Daftar Soal</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Pilih nomor soal untuk berpindah.
            </p>
          </div>
          <div className="grid grid-cols-5 gap-2 sm:grid-cols-8 lg:grid-cols-5">
            {questions.map(({ question }, index) => {
              const active = index === activeIndex;
              const answered = isAnswered(answers[question.id]);

              return (
                <button
                  key={question.id}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className={cn(
                    "aspect-square rounded-md border text-sm font-medium transition",
                    active && "border-primary bg-primary text-primary-foreground",
                    !active && answered && "border-emerald-300 bg-emerald-50 text-emerald-700",
                    !active && !answered && "hover:bg-muted",
                  )}
                  aria-label={`Buka soal ${index + 1}`}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
          <div className="grid gap-2 text-xs text-muted-foreground">
            <LegendItem className="bg-primary" label="Aktif" />
            <LegendItem className="bg-emerald-500" label="Sudah dijawab" />
            <LegendItem className="border bg-background" label="Belum dijawab" />
          </div>

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
                    : "Ada jawaban gagal tersimpan. Retry dulu sebelum submit.",
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
              type="submit"
              disabled={!canSubmitManually}
              className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitLocked
                ? "Mengumpulkan..."
                : pendingSaveCount > 0
                  ? "Menunggu simpan..."
                  : failedSaveCount > 0
                    ? "Retry jawaban dulu"
                    : "Kumpulkan Ujian"}
            </button>
          </form>
          <ConfirmDialog
            isOpen={isSubmitConfirmOpen}
            title="Kumpulkan Ujian"
            description="Kumpulkan ujian sekarang? Jawaban akan dikunci dan tidak bisa diubah lagi."
            confirmLabel="Kumpulkan"
            isLoading={submitLocked}
            onCancel={() => setIsSubmitConfirmOpen(false)}
            onConfirm={() => {
              submitConfirmedRef.current = true;
              setIsSubmitConfirmOpen(false);
              submitFormRef.current?.requestSubmit();
            }}
          />
        </aside>
      </div>

      {warning ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/55 p-4">
          <div className="w-full max-w-md rounded-lg bg-background p-5 shadow-xl">
            <p className="text-xs font-medium uppercase text-muted-foreground">
              Pelanggaran {warning.count}/{maxAntiCheatViolations}
            </p>
            <h3 className="mt-2 text-lg font-semibold">{warning.title}</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {warning.message}
            </p>
            <button
              type="button"
              disabled={warning.count >= maxAntiCheatViolations}
              onClick={closeWarningAndRefocus}
              className="mt-5 w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {warning.count >= maxAntiCheatViolations
                ? "Mengumpulkan..."
                : "Saya mengerti"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-muted-foreground">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
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
    <div className="mb-5 rounded-lg border border-dashed bg-background p-4">
      <div className="text-sm font-semibold">{stimulus.title}</div>
      <QuestionMathRenderer
        content={stimulus.content}
        className="mt-2 text-sm leading-7 text-muted-foreground"
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
    <div className="mt-4 grid gap-3">
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
    <div className="space-y-3 text-sm leading-7">
      {lines.map((line, index) => {
        const trimmed = line.trim();

        if (isImageUrl(trimmed)) {
          return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={`${trimmed}-${index}`}
              src={trimmed}
              alt={`Media soal ${index + 1}`}
              className="max-h-80 w-full rounded-lg border object-contain"
            />
          );
        }

        if (isVideoUrl(trimmed)) {
          return (
            <video
              key={`${trimmed}-${index}`}
              src={trimmed}
              controls
              className="max-h-80 w-full rounded-lg border"
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

function LegendItem({
  className,
  label,
}: {
  className: string;
  label: string;
}) {
  return (
    <span className="flex items-center gap-2">
      <span className={cn("h-3 w-3 rounded-sm", className)} />
      {label}
    </span>
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

function getViolationStorageKey(attemptId: string) {
  return `exam-violations:${attemptId}`;
}

function getExamSessionStorageKey(attemptId: string) {
  return `exam-session:${attemptId}`;
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
