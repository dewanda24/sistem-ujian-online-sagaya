"use client";

import { useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Check,
  Clock,
  Copy,
  GraduationCap,
  Info,
  KeyRound,
  Layers,
  Loader2,
  RefreshCw,
  Save,
  Search,
  Send,
  Sparkles,
  Users,
} from "lucide-react";

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
  teachers?: SelectOption[];
  selectedProctorIds?: string[];
  defaultPackageId?: string;
  defaultStartAt?: string;
  defaultEndAt?: string;
};

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function addMinutes(time: string, minutes: number) {
  if (!time) return "";
  const [hour, minute] = time.split(":").map(Number);
  const date = new Date(2000, 0, 1, hour || 0, minute || 0);
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
  teachers = [],
  selectedProctorIds = [],
  defaultPackageId,
  defaultStartAt,
  defaultEndAt,
}: ExamScheduleFormProps) {
  const start = splitDatetime(defaultStartAt);
  const end = splitDatetime(defaultEndAt);

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

  const [selectedProctors, setSelectedProctors] = useState<string[]>(selectedProctorIds);
  const [proctorQuery, setProctorQuery] = useState("");

  const [token, setToken] = useState(editable?.access_token ?? "");
  const [tokenRequired, setTokenRequired] = useState(Boolean(editable?.token_required));
  const [isActive, setIsActive] = useState(editable?.is_active ?? true);
  const [copied, setCopied] = useState(false);

  const [status, setStatus] = useState(
    editable?.status === "active" || editable?.status === "scheduled"
      ? editable.status
      : "draft",
  );
  const [errors, setErrors] = useState<string[]>([]);
  const statusInputRef = useRef<HTMLInputElement>(null);
  const confirmWarningsInputRef = useRef<HTMLInputElement>(null);

  // Filtered Classes
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

  // Filtered Teachers / Proctors
  const filteredTeachers = useMemo(() => {
    const normalizedQuery = proctorQuery.trim().toLowerCase();
    return teachers.filter((item) =>
      normalizedQuery ? item.label.toLowerCase().includes(normalizedQuery) : true,
    );
  }, [proctorQuery, teachers]);

  const selectedProctorSet = useMemo(
    () => new Set(selectedProctors),
    [selectedProctors],
  );

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

  function toggleProctor(id: string) {
    setSelectedProctors((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  function handlePackageChange(nextPackageId: string) {
    const nextPackage = packages.find((item) => item.value === nextPackageId);
    setPackageId(nextPackageId);
    if (!editable?.title) setTitle(nextPackage?.label ?? "");
    if (startTime && nextPackage?.durationMinutes) {
      setEndTime(addMinutes(startTime, nextPackage.durationMinutes));
    }
  }

  function copyToken() {
    if (!token) return;
    navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function validate() {
    const nextErrors: string[] = [];

    if (!packageId) nextErrors.push("Paket ujian wajib dipilih.");
    if (!title.trim()) nextErrors.push("Nama jadwal wajib diisi.");
    if (!academicYearId) nextErrors.push("Tahun ajaran wajib dipilih.");
    if (!date || !startTime || !endTime) nextErrors.push("Tanggal dan waktu pelaksanaan wajib diisi.");
    if (startTime && !isValidTime(startTime)) nextErrors.push("Jam mulai harus format 24 jam (contoh: 08:00).");
    if (endTime && !isValidTime(endTime)) nextErrors.push("Jam selesai harus format 24 jam (contoh: 09:30).");
    if (selectedClasses.length === 0) nextErrors.push("Pilih minimal satu kelas target peserta ujian.");

    setErrors(nextErrors);
    return nextErrors.length === 0;
  }

  return (
    <form
      action={saveExamScheduleAction}
      className="space-y-6 pb-28 sm:pb-32"
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
      <input type="hidden" name="access_token" value={token} />
      <input
        type="hidden"
        name="token_required"
        value={tokenRequired ? "true" : "false"}
      />
      <input
        type="hidden"
        name="is_active"
        value={isActive ? "true" : "false"}
      />
      <input ref={statusInputRef} type="hidden" name="status" value={status} />
      <input
        ref={confirmWarningsInputRef}
        type="hidden"
        name="confirm_warnings"
        value="true"
      />

      {/* Hidden inputs for selected classes */}
      {selectedClasses.map((classId) => (
        <input key={classId} type="hidden" name="class_ids" value={classId} />
      ))}

      {/* Hidden inputs for selected proctors */}
      {selectedProctors.map((teacherId) => (
        <input key={teacherId} type="hidden" name="proctor_ids" value={teacherId} />
      ))}

      {/* Validation Errors Alert Box */}
      {errors.length > 0 ? (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50/90 p-4 text-xs text-rose-800 shadow-sm animate-in fade-in">
          <AlertCircle className="size-5 shrink-0 text-rose-600 mt-0.5" />
          <div>
            <div className="font-bold text-rose-900">Periksa kembali formulir jadwal:</div>
            <ul className="mt-1 list-disc space-y-1 pl-4 font-medium">
              {errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      {/* MAIN 2-COLUMN UNIFIED LAYOUT */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* LEFT COLUMN: IDENTITAS, WAKTU & KELAS */}
        <div className="space-y-6 lg:col-span-7">
          {/* SECTION 1: PAKET & IDENTITAS JADWAL */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <span className="flex size-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Layers className="size-4" />
              </span>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Paket & Identitas Ujian</h2>
                <p className="text-xs text-slate-500">Pilih paket soal dan tentukan judul jadwal pelaksanaan.</p>
              </div>
            </div>

            <div className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Paket Ujian <span className="text-rose-500">*</span>
                </label>
                <select
                  name="exam_package_id"
                  value={packageId}
                  onChange={(event) => handlePackageChange(event.target.value)}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                >
                  {packages.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label} ({item.totalQuestions ?? 0} soal • {item.durationMinutes ?? 0} mnt)
                    </option>
                  ))}
                </select>
              </div>

              {selectedPackage ? (
                <div className="flex flex-wrap items-center gap-2 rounded-xl bg-slate-50 p-2.5 border border-slate-100 text-[11px]">
                  <span className="font-semibold text-slate-700">
                    Mapel: <strong>{selectedPackage.subjectCode ?? "-"} {selectedPackage.subjectName ?? ""}</strong>
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="font-semibold text-slate-700">
                    Jumlah Soal: <strong>{selectedPackage.totalQuestions ?? 0} butir</strong>
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="font-semibold text-slate-700">
                    Durasi: <strong>{selectedPackage.durationMinutes ?? 0} menit</strong>
                  </span>
                </div>
              ) : null}

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Nama / Judul Jadwal <span className="text-rose-500">*</span>
                </label>
                <input
                  name="title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Contoh: Sesi 1 - PTS Matematika X IPA"
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Tahun Ajaran <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="academic_year_id"
                    value={academicYearId}
                    onChange={(event) => setAcademicYearId(event.target.value)}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none font-medium"
                  >
                    {academicYears.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Semester (Opsional)</label>
                  <select
                    name="semester_id"
                    value={semesterId}
                    onChange={(event) => setSemesterId(event.target.value)}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none font-medium"
                  >
                    <option value="">Tanpa semester khusus</option>
                    {semesters.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: WAKTU PELAKSANAAN */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <span className="flex size-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Calendar className="size-4" />
              </span>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Waktu Pelaksanaan</h2>
                <p className="text-xs text-slate-500">Tentukan tanggal dan jam sesi ujian berlangsung.</p>
              </div>
            </div>

            <div className="grid gap-3.5 sm:grid-cols-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Tanggal Ujian <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="date"
                    value={date}
                    onChange={(event) => setDate(event.target.value)}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Jam Mulai <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Clock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="08:00"
                    value={startTime}
                    onChange={(event) => {
                      const nextTime = normalizeTime(event.target.value);
                      setStartTime(nextTime);
                      if (selectedPackage?.durationMinutes && isValidTime(nextTime)) {
                        setEndTime(addMinutes(nextTime, selectedPackage.durationMinutes));
                      }
                    }}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none font-medium font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Jam Selesai <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Clock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="09:30"
                    value={endTime}
                    onChange={(event) => setEndTime(normalizeTime(event.target.value))}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none font-medium font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: TARGET KELAS PESERTA */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="flex size-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <GraduationCap className="size-4" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-slate-900">Target Kelas Peserta</h2>
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-bold text-blue-800">
                      {selectedClasses.length} Kelas Dipilih
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">Pilih kelas yang berhak mengikuti sesi ujian ini.</p>
                </div>
              </div>

              <button
                type="button"
                onClick={toggleFilteredClasses}
                className="h-8 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition self-start sm:self-auto"
              >
                {allFilteredSelected ? "Batal Pilih Hasil Filter" : "Pilih Semua Kelas"}
              </button>
            </div>

            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                value={classQuery}
                onChange={(event) => setClassQuery(event.target.value)}
                placeholder="Cari nama kelas..."
                className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
              />
            </div>

            <div className="grid max-h-60 gap-2 overflow-y-auto rounded-xl border border-slate-200 p-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {filteredClasses.length === 0 ? (
                <div className="col-span-full py-6 text-center text-xs text-slate-500">
                  Tidak ada kelas yang cocok dengan pencarian.
                </div>
              ) : (
                filteredClasses.map((item) => {
                  const isChecked = selectedClassSet.has(item.value);
                  return (
                    <label
                      key={item.value}
                      className={cn(
                        "flex items-center gap-2 rounded-xl border p-2 text-xs font-medium cursor-pointer transition select-none",
                        isChecked
                          ? "border-blue-300 bg-blue-50/60 text-blue-900 font-bold"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleClass(item.value)}
                        className="size-3.5 rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="truncate">{item.label}</span>
                    </label>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: PENGAWAS, TOKEN & PENGATURAN */}
        <div className="space-y-6 lg:col-span-5">
          {/* SECTION 4: GURU PENGAWAS */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="flex size-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <Users className="size-4" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-slate-900">Guru Pengawas</h2>
                    {selectedProctors.length > 0 ? (
                      <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-bold text-indigo-800">
                        {selectedProctors.length} Pengawas
                      </span>
                    ) : null}
                  </div>
                  <p className="text-xs text-slate-500">Opsional, bisa ditugaskan sekarang atau nanti.</p>
                </div>
              </div>

              {selectedProctors.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setSelectedProctors([])}
                  className="text-xs font-bold text-rose-600 hover:underline"
                >
                  Reset
                </button>
              ) : null}
            </div>

            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                value={proctorQuery}
                onChange={(event) => setProctorQuery(event.target.value)}
                placeholder="Cari nama guru pengawas..."
                className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
              />
            </div>

            <div className="grid max-h-52 gap-2 overflow-y-auto rounded-xl border border-slate-200 p-2.5">
              {filteredTeachers.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500">
                  {teachers.length === 0
                    ? "Belum ada akun guru terdaftar."
                    : "Tidak ada guru yang cocok."}
                </div>
              ) : (
                filteredTeachers.map((teacher) => {
                  const isChecked = selectedProctorSet.has(teacher.value);
                  return (
                    <label
                      key={teacher.value}
                      className={cn(
                        "flex items-center gap-2 rounded-xl border p-2 text-xs font-medium cursor-pointer transition select-none",
                        isChecked
                          ? "border-indigo-300 bg-indigo-50/60 text-indigo-900 font-bold"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleProctor(teacher.value)}
                        className="size-3.5 rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="truncate">{teacher.label}</span>
                    </label>
                  );
                })
              )}
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl">
              <Info className="size-3.5 text-slate-400 shrink-0" />
              <span>
                Pengawas juga dapat dikelola secara terpusat di menu{" "}
                <Link
                  href="/dashboard/exams/proctors"
                  className="text-blue-600 font-semibold hover:underline"
                  target="_blank"
                >
                  Pengawas Ujian
                </Link>.
              </span>
            </div>
          </div>

          {/* SECTION 5: TOKEN AKSES & OPSIONAL */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <span className="flex size-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <KeyRound className="size-4" />
              </span>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Token Masuk & Opsi Ujian</h2>
                <p className="text-xs text-slate-500">Atur kode token masuk siswa dan status keaktifan.</p>
              </div>
            </div>

            {/* Token Generator Box */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2.5">
              <label className="text-xs font-bold text-slate-800 block">Kode Token Masuk</label>
              <div className="flex items-center gap-2">
                <input
                  value={token}
                  onChange={(event) => setToken(event.target.value.toUpperCase())}
                  placeholder="CONTOH: ABC123"
                  maxLength={10}
                  className="h-9 w-32 rounded-xl border border-slate-200 bg-white px-2.5 text-center text-xs font-black tracking-widest text-slate-900 uppercase font-mono focus:border-blue-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setToken(randomToken())}
                  className="inline-flex h-9 items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50"
                  title="Generate Token Acak"
                >
                  <RefreshCw className="size-3" />
                  <span>Acak</span>
                </button>
                <button
                  type="button"
                  onClick={copyToken}
                  disabled={!token}
                  className="inline-flex h-9 items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-40"
                  title="Salin Token"
                >
                  {copied ? (
                    <span className="text-emerald-600 text-[11px] font-bold">Disalin!</span>
                  ) : (
                    <>
                      <Copy className="size-3" />
                      <span>Salin</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-2">
              <label className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 text-xs cursor-pointer hover:bg-slate-50 transition">
                <div>
                  <span className="font-bold text-slate-800 block">Wajib Masukkan Token</span>
                  <span className="text-slate-500 text-[11px]">Siswa wajib mengetik token sebelum mulai ujian</span>
                </div>
                <input
                  type="checkbox"
                  checked={tokenRequired}
                  onChange={(event) => setTokenRequired(event.target.checked)}
                  className="size-4 rounded text-blue-600 focus:ring-blue-500"
                />
              </label>

              <label className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 text-xs cursor-pointer hover:bg-slate-50 transition">
                <div>
                  <span className="font-bold text-slate-800 block">Jadwal Aktif</span>
                  <span className="text-slate-500 text-[11px]">Siswa dapat mengakses ujian pada jam yang ditentukan</span>
                </div>
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(event) => setIsActive(event.target.checked)}
                  className="size-4 rounded text-blue-600 focus:ring-blue-500"
                />
              </label>
            </div>
          </div>

          {/* SECTION 6: PANEL REKAP & SUBMIT LANGSUNG */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Ringkasan Jadwal
            </h3>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="rounded-lg bg-slate-50 p-2 border border-slate-100">
                <span className="text-slate-500 block">Target:</span>
                <strong className="text-slate-900">{selectedClasses.length} Kelas</strong>
              </div>
              <div className="rounded-lg bg-slate-50 p-2 border border-slate-100">
                <span className="text-slate-500 block">Pengawas:</span>
                <strong className="text-slate-900">{selectedProctors.length} Guru</strong>
              </div>
              <div className="rounded-lg bg-slate-50 p-2 border border-slate-100 col-span-2">
                <span className="text-slate-500 block">Jadwal:</span>
                <strong className="text-slate-900">{date} ({startTime} - {endTime} WIB)</strong>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
              <SchedulePublishButton
                onClick={() => {
                  setStatus("scheduled");
                  if (statusInputRef.current) statusInputRef.current.value = "scheduled";
                  if (confirmWarningsInputRef.current) {
                    confirmWarningsInputRef.current.value = "true";
                  }
                }}
              />
              <ScheduleDraftButton
                onClick={() => {
                  setStatus("draft");
                  if (statusInputRef.current) statusInputRef.current.value = "draft";
                  if (confirmWarningsInputRef.current) {
                    confirmWarningsInputRef.current.value = "false";
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* STICKY BOTTOM ACTION FOOTER FOR MOBILE / QUICK SAVE */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/95 p-3 backdrop-blur-md shadow-2xl sm:hidden">
        <div className="flex items-center justify-between gap-2">
          <Link
            href="/dashboard/exams/schedules"
            className="inline-flex h-10 items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 shadow-2xs shrink-0"
          >
            <ArrowLeft className="size-3.5" />
            <span>Batal</span>
          </Link>
          <div className="flex items-center gap-2 flex-1 justify-end">
            <ScheduleDraftButton
              onClick={() => {
                setStatus("draft");
                if (statusInputRef.current) statusInputRef.current.value = "draft";
                if (confirmWarningsInputRef.current) {
                  confirmWarningsInputRef.current.value = "false";
                }
              }}
            />
            <SchedulePublishButton
              onClick={() => {
                setStatus("scheduled");
                if (statusInputRef.current) statusInputRef.current.value = "scheduled";
                if (confirmWarningsInputRef.current) {
                  confirmWarningsInputRef.current.value = "true";
                }
              }}
            />
          </div>
        </div>
      </div>
    </form>
  );
}

function ScheduleDraftButton({ onClick }: { onClick: () => void }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      onClick={onClick}
      className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 sm:px-4 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 transition shrink-0"
    >
      {pending ? (
        <>
          <Loader2 className="size-3.5 animate-spin text-slate-500" />
          <span>Menyimpan...</span>
        </>
      ) : (
        <>
          <Save className="size-3.5 text-slate-600" />
          <span><span className="hidden sm:inline">Simpan </span>Draf</span>
        </>
      )}
    </button>
  );
}

function SchedulePublishButton({ onClick }: { onClick: () => void }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      onClick={onClick}
      className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-3.5 sm:px-4 text-xs font-bold text-white shadow-xs hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 transition shrink-0"
    >
      {pending ? (
        <>
          <Loader2 className="size-3.5 animate-spin text-white" />
          <span>Menjadwalkan...</span>
        </>
      ) : (
        <>
          <Send className="size-3.5" />
          <span>Jadwalkan</span>
        </>
      )}
    </button>
  );
}
