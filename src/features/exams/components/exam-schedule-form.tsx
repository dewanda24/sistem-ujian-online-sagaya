"use client";

import { useMemo, useRef, useState } from "react";
import { Save, Send } from "lucide-react";

import { saveExamScheduleAction } from "@/features/exams/actions";
import { cn } from "@/lib/utils";

type SelectOption = {
  value: string;
  label: string;
};

type ExamPackageOption = SelectOption & {
  subjectCode?: string;
  subjectName?: string;
  totalQuestions?: number;
  durationMinutes?: number;
  status?: string;
};

type EditableSchedule = {
  id?: string | null;
  title?: string | null;
  exam_package_id?: string | null;
  academic_year_id?: string | null;
  semester_id?: string | null;
  start_at?: string | null;
  end_at?: string | null;
  status?: string | null;
  token_required?: boolean | null;
  access_token?: string | null;
  is_active?: boolean | null;
};

type ExamScheduleFormProps = {
  editable?: EditableSchedule | null;
  schoolId: string;
  packages: ExamPackageOption[];
  academicYears: SelectOption[];
  semesters: SelectOption[];
  classes: SelectOption[];
  selectedClassIds: string[];
  defaultPackageId?: string;
  defaultStartAt?: string;
  defaultEndAt?: string;
};

const steps = ["Paket", "Waktu", "Peserta", "Token", "Review"] as const;

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function addMinutes(time: string, minutes: number) {
  if (!time) return "";
  const [hour, minute] = time.split(":").map(Number);
  const date = new Date(2000, 0, 1, hour, minute);
  date.setMinutes(date.getMinutes() + minutes);
  return `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes(),
  ).padStart(2, "0")}`;
}

function normalizeTime(value: string) {
  const digits = value.replace(/[^\d:]/g, "");

  if (/^\d{2}:\d{2}$/.test(digits)) {
    return digits;
  }

  const compact = digits.replace(/:/g, "").slice(0, 4);

  if (compact.length <= 2) {
    return compact;
  }

  return `${compact.slice(0, 2)}:${compact.slice(2)}`;
}

function isValidTime(value: string) {
  const match = value.match(/^(\d{2}):(\d{2})$/);

  if (!match) {
    return false;
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);

  return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59;
}

function splitDatetime(value?: string) {
  if (!value) {
    return { date: todayDate(), time: "" };
  }

  const [date, time = ""] = value.split("T");
  return { date, time: time.slice(0, 5) };
}

function randomToken() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () =>
    alphabet[Math.floor(Math.random() * alphabet.length)],
  ).join("");
}

export function ExamScheduleForm({
  editable,
  schoolId,
  packages,
  academicYears,
  semesters,
  classes,
  selectedClassIds,
  defaultPackageId,
  defaultStartAt,
  defaultEndAt,
}: ExamScheduleFormProps) {
  const start = splitDatetime(defaultStartAt);
  const end = splitDatetime(defaultEndAt);
  const [step, setStep] = useState(0);
  const [packageId, setPackageId] = useState(
    editable?.exam_package_id ?? defaultPackageId ?? packages[0]?.value ?? "",
  );
  const selectedPackage = packages.find((item) => item.value === packageId);
  const [title, setTitle] = useState(
    editable?.title ?? selectedPackage?.label ?? "",
  );
  const [academicYearId, setAcademicYearId] = useState(
    editable?.academic_year_id ?? academicYears[0]?.value ?? "",
  );
  const [semesterId, setSemesterId] = useState(editable?.semester_id ?? "");
  const [date, setDate] = useState(start.date);
  const [startTime, setStartTime] = useState(start.time || "08:00");
  const [endTime, setEndTime] = useState(
    end.time || addMinutes("08:00", selectedPackage?.durationMinutes ?? 60),
  );
  const [selectedClasses, setSelectedClasses] = useState<string[]>(selectedClassIds);
  const [classQuery, setClassQuery] = useState("");
  const [token, setToken] = useState(editable?.access_token ?? "");
  const [tokenRequired, setTokenRequired] = useState(Boolean(editable?.token_required));
  const [isActive, setIsActive] = useState(editable?.is_active ?? true);
  const [status, setStatus] = useState(
    editable?.status === "active" || editable?.status === "scheduled"
      ? editable.status
      : "draft",
  );
  const [errors, setErrors] = useState<string[]>([]);
  const statusInputRef = useRef<HTMLInputElement>(null);
  const confirmWarningsInputRef = useRef<HTMLInputElement>(null);
  const filteredClasses = useMemo(() => {
    const normalizedQuery = classQuery.trim().toLowerCase();

    return classes.filter((item) =>
      normalizedQuery ? item.label.toLowerCase().includes(normalizedQuery) : true,
    );
  }, [classQuery, classes]);
  const selectedClassSet = useMemo(() => new Set(selectedClasses), [selectedClasses]);
  const allFilteredSelected =
    filteredClasses.length > 0 &&
    filteredClasses.every((item) => selectedClassSet.has(item.value));
  const startAt = `${date}T${startTime}`;
  const endAt = `${date}T${endTime}`;

  function toggleClass(id: string) {
    setSelectedClasses((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  function toggleFilteredClasses() {
    setSelectedClasses((current) => {
      const next = new Set(current);

      if (allFilteredSelected) {
        filteredClasses.forEach((item) => next.delete(item.value));
      } else {
        filteredClasses.forEach((item) => next.add(item.value));
      }

      return Array.from(next);
    });
  }

  function handlePackageChange(nextPackageId: string) {
    const nextPackage = packages.find((item) => item.value === nextPackageId);
    setPackageId(nextPackageId);
    if (!editable?.title) setTitle(nextPackage?.label ?? "");
    if (startTime && nextPackage?.durationMinutes) {
      setEndTime(addMinutes(startTime, nextPackage.durationMinutes));
    }
  }

  function validate() {
    const nextErrors: string[] = [];

    if (!packageId) nextErrors.push("Paket ujian wajib dipilih.");
    if (!title.trim()) nextErrors.push("Nama jadwal wajib diisi.");
    if (!academicYearId) nextErrors.push("Tahun ajaran wajib dipilih.");
    if (!date || !startTime || !endTime) nextErrors.push("Tanggal dan waktu wajib diisi.");
    if (startTime && !isValidTime(startTime)) nextErrors.push("Jam mulai wajib format 24 jam, contoh 08:00 atau 13:30.");
    if (endTime && !isValidTime(endTime)) nextErrors.push("Jam selesai wajib format 24 jam, contoh 09:00 atau 15:45.");
    if (selectedClasses.length === 0) nextErrors.push("Pilih minimal satu kelas target.");

    setErrors(nextErrors);
    return nextErrors.length === 0;
  }

  return (
    <form
      action={saveExamScheduleAction}
      className="mx-auto grid w-full max-w-5xl gap-5"
      onSubmit={(event) => {
        if (!validate()) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" defaultValue={editable?.id ?? ""} />
      <input type="hidden" name="school_id" value={schoolId} />
      <input type="hidden" name="start_at" value={startAt} />
      <input type="hidden" name="end_at" value={endAt} />
      <input ref={statusInputRef} type="hidden" name="status" value={status} />
      <input
        ref={confirmWarningsInputRef}
        type="hidden"
        name="confirm_warnings"
        value="false"
      />
      {selectedClasses.map((classId) => (
        <input key={classId} type="hidden" name="class_ids" value={classId} />
      ))}

      {errors.length > 0 ? (
        <div className="rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 p-3 text-sm text-[#EF4444]">
          <div className="font-medium">Periksa lagi sebelum menyimpan:</div>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="rounded-xl border border-[#E2E8F0] bg-white p-3 shadow-sm">
        <div className="grid gap-2 sm:grid-cols-5">
          {steps.map((label, index) => (
            <button
              key={label}
              type="button"
              onClick={() => setStep(index)}
              className={cn(
                "rounded-xl border px-3 py-2 text-left text-sm transition",
                step === index
                  ? "border-[#2563EB] bg-[#2563EB] text-white"
                  : "border-[#E2E8F0] bg-white text-[#64748B] hover:bg-[#F8FAFC]",
              )}
            >
              <span className="block text-xs opacity-80">Step {index + 1}</span>
              <span className="font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>

      <section className={step === 0 ? "rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm" : "hidden"}>
        <h2 className="text-base font-semibold text-[#0F172A]">Pilih Paket</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <select
            name="exam_package_id"
            value={packageId}
            onChange={(event) => handlePackageChange(event.target.value)}
            className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm"
          >
            {packages.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <input
            name="title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Nama jadwal"
            className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm"
          />
          <select
            name="academic_year_id"
            value={academicYearId}
            onChange={(event) => setAcademicYearId(event.target.value)}
            className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm"
          >
            {academicYears.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <select
            name="semester_id"
            value={semesterId}
            onChange={(event) => setSemesterId(event.target.value)}
            className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm"
          >
            <option value="">Tanpa semester</option>
            {semesters.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
        {selectedPackage ? (
          <div className="mt-4 grid gap-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 md:grid-cols-4">
            <Summary label="Mapel" value={`${selectedPackage.subjectCode ?? "-"} ${selectedPackage.subjectName ?? ""}`} />
            <Summary label="Soal" value={`${selectedPackage.totalQuestions ?? 0} soal`} />
            <Summary label="Durasi" value={`${selectedPackage.durationMinutes ?? 0} menit`} />
            <Summary label="Status" value={selectedPackage.status ?? "-"} />
          </div>
        ) : null}
      </section>

      <section className={step === 1 ? "rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm" : "hidden"}>
        <h2 className="text-base font-semibold text-[#0F172A]">Tanggal & Waktu</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm"
          />
          <input
            type="text"
            inputMode="numeric"
            pattern="([01][0-9]|2[0-3]):[0-5][0-9]"
            placeholder="08:00"
            value={startTime}
            onChange={(event) => {
              const nextTime = normalizeTime(event.target.value);

              setStartTime(nextTime);
              if (selectedPackage?.durationMinutes && isValidTime(nextTime)) {
                setEndTime(addMinutes(nextTime, selectedPackage.durationMinutes));
              }
            }}
            className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm"
          />
          <input
            type="text"
            inputMode="numeric"
            pattern="([01][0-9]|2[0-3]):[0-5][0-9]"
            placeholder="09:00"
            value={endTime}
            onChange={(event) => setEndTime(normalizeTime(event.target.value))}
            className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm"
          />
        </div>
      </section>

      <section className={step === 2 ? "rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm" : "hidden"}>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-base font-semibold text-[#0F172A]">Target Peserta</h2>
            <p className="mt-1 text-sm text-[#64748B]">
              {selectedClasses.length} kelas dipilih - peserta akan disinkronkan saat jadwal disimpan.
            </p>
          </div>
          <button
            type="button"
            onClick={toggleFilteredClasses}
            className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm hover:bg-[#F8FAFC]"
          >
            {allFilteredSelected ? "Batalkan hasil filter" : "Select all kelas"}
          </button>
        </div>
        <input
          value={classQuery}
          onChange={(event) => setClassQuery(event.target.value)}
          placeholder="Cari kelas"
          className="mt-4 w-full rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm"
        />
        <div className="mt-4 grid max-h-72 gap-2 overflow-auto rounded-xl border border-[#E2E8F0] p-3 sm:grid-cols-2 xl:grid-cols-4">
          {filteredClasses.map((item) => (
            <label
              key={item.value}
              className="flex min-h-10 items-center gap-2 rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm hover:bg-[#F8FAFC]"
            >
              <input
                type="checkbox"
                checked={selectedClassSet.has(item.value)}
                onChange={() => toggleClass(item.value)}
              />
              <span className="line-clamp-1">{item.label}</span>
            </label>
          ))}
        </div>
      </section>

      <section className={step === 3 ? "rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm" : "hidden"}>
        <h2 className="text-base font-semibold text-[#0F172A]">Token & Pengaturan</h2>
        <div className="mt-4 grid gap-4">
          <label className="grid gap-1.5 text-sm">
            <span className="font-medium text-[#0F172A]">Token Ujian</span>
            <div className="flex flex-wrap gap-2">
              <input
                value={token}
                onChange={(event) => setToken(event.target.value)}
                placeholder="ABC123"
                className="h-9 min-w-40 rounded-xl border border-[#E2E8F0] px-3 text-sm"
              />
              <button
                type="button"
                onClick={() => setToken(randomToken())}
                className="rounded-xl border border-[#E2E8F0] px-3 text-sm hover:bg-[#F8FAFC]"
              >
                Generate
              </button>
              <button
                type="button"
                onClick={() => token && navigator.clipboard.writeText(token)}
                className="rounded-xl border border-[#E2E8F0] px-3 text-sm hover:bg-[#F8FAFC]"
              >
                Copy
              </button>
            </div>
            {!token ? (
              <span className="text-xs text-[#F59E0B]">Token belum dibuat.</span>
            ) : null}
          </label>
          <div className="grid gap-3 md:grid-cols-2">
            <Toggle label="Token wajib" name="token_required" checked={tokenRequired} onChange={setTokenRequired} />
            <Toggle label="Aktif" name="is_active" checked={isActive} onChange={setIsActive} />
            <StaticToggle label="Acak soal" />
            <StaticToggle label="Acak opsi" />
            <StaticToggle label="Izinkan terlambat masuk" />
            <label className="grid gap-1.5 rounded-xl border border-[#E2E8F0] p-3 text-sm">
              <span className="font-medium text-[#0F172A]">Batas terlambat</span>
              <input
                type="number"
                min="0"
                defaultValue={0}
                className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm"
              />
            </label>
          </div>
        </div>
      </section>

      <section className={step === 4 ? "rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm" : "hidden"}>
        <h2 className="text-base font-semibold text-[#0F172A]">Review & Simpan</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <Summary label="Paket" value={selectedPackage?.label ?? "-"} />
          <Summary label="Mapel" value={selectedPackage?.subjectCode ?? "-"} />
          <Summary label="Tanggal" value={date} />
          <Summary label="Waktu" value={`${startTime} - ${endTime}`} />
          <Summary label="Target kelas" value={`${selectedClasses.length} kelas`} />
          <Summary label="Token" value={token || "Belum dibuat"} />
        </div>
      </section>

      <div className="flex flex-col gap-3 rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setStep((value) => Math.max(0, value - 1))}
            disabled={step === 0}
            className="rounded-xl border border-[#E2E8F0] px-4 py-2 text-sm disabled:opacity-50"
          >
            Sebelumnya
          </button>
          <button
            type="button"
            onClick={() => setStep((value) => Math.min(steps.length - 1, value + 1))}
            disabled={step === steps.length - 1}
            className="rounded-xl border border-[#E2E8F0] px-4 py-2 text-sm disabled:opacity-50"
          >
            Berikutnya
          </button>
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            onClick={() => {
              setStatus("draft");
              if (statusInputRef.current) statusInputRef.current.value = "draft";
              if (confirmWarningsInputRef.current) {
                confirmWarningsInputRef.current.value = "false";
              }
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-[#E2E8F0] px-4 py-2 text-sm font-medium hover:bg-[#F8FAFC]"
          >
            <Save className="size-4" />
            Simpan Draft
          </button>
          <button
            type="submit"
            onClick={(event) => {
              const confirmed = window.confirm(
                "Tetap publish? Jika hanya warning readiness, jadwal tetap dipublish. Jika ada critical, sistem akan menolak publish.",
              );

              if (!confirmed) {
                event.preventDefault();
                return;
              }

              setStatus("scheduled");
              if (statusInputRef.current) statusInputRef.current.value = "scheduled";
              if (confirmWarningsInputRef.current) {
                confirmWarningsInputRef.current.value = "true";
              }
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-4 py-2 text-sm font-medium text-white hover:bg-[#1D4ED8]"
          >
            <Send className="size-4" />
            Jadwalkan Ujian
          </button>
        </div>
      </div>
    </form>
  );
}

function Toggle({
  label,
  checked,
  onChange,
  name,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  name: string;
}) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-xl border border-[#E2E8F0] p-3 text-sm">
      <span className="font-medium text-[#0F172A]">{label}</span>
      <input
        name={name}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  );
}

function StaticToggle({ label }: { label: string }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-xl border border-[#E2E8F0] p-3 text-sm text-[#64748B]">
      <span>{label}</span>
      <input type="checkbox" disabled />
    </label>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3">
      <div className="text-xs text-[#64748B]">{label}</div>
      <div className="mt-1 line-clamp-1 font-semibold text-[#0F172A]">{value}</div>
    </div>
  );
}
