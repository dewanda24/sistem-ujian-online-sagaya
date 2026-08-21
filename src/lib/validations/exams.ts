import { z } from "zod";

const optionalUuidField = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().uuid().optional(),
);

const uuidField = z.string().uuid("ID tidak valid.");

const stringList = z.preprocess((value) => {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  if (typeof value === "string" && value) {
    return [value];
  }

  return [];
}, z.array(uuidField));

export const examPackageSchema = z.object({
  id: optionalUuidField,
  school_id: uuidField,
  subject_id: uuidField,
  title: z.string().min(3, "Judul paket minimal 3 karakter."),
  description: z.string().optional(),
  duration_minutes: z.coerce
    .number()
    .int()
    .positive("Durasi harus lebih dari 0 menit."),
  status: z.enum(["draft", "published"]),
  shuffle_questions: z.boolean().default(false),
  shuffle_options: z.boolean().default(false),
  show_result: z.boolean().default(false),
  is_active: z.boolean().default(true),
  question_ids: stringList.pipe(
    z.array(uuidField).min(1, "Pilih minimal satu soal."),
  ),
});

export const examPackageStatusSchema = z.object({
  id: uuidField,
  status: z.enum(["draft", "published", "archived"]),
});

export const examPackageActiveSchema = z.object({
  id: uuidField,
  is_active: z.boolean(),
});

export const examScheduleSchema = z
  .object({
    id: optionalUuidField,
    school_id: uuidField,
    exam_package_id: uuidField,
    academic_year_id: uuidField,
    semester_id: optionalUuidField,
    title: z.string().min(3, "Judul jadwal minimal 3 karakter."),
    start_at: z.string().datetime("Waktu mulai tidak valid."),
    end_at: z.string().datetime("Waktu selesai tidak valid."),
    status: z.enum(["draft", "scheduled", "active"]),
    token_required: z.boolean().default(false),
    access_token: z.string().optional().nullable(),
    is_active: z.boolean().default(true),
    class_ids: stringList.pipe(
      z.array(uuidField).min(1, "Pilih minimal satu kelas."),
    ),
    proctor_ids: stringList.optional(),
  })
  .refine((value) => new Date(value.end_at) > new Date(value.start_at), {
    message: "Waktu selesai harus setelah waktu mulai.",
    path: ["end_at"],
  });

export const examScheduleStatusSchema = z.object({
  id: uuidField,
  status: z.enum(["draft", "scheduled", "active", "finished", "cancelled", "archived"]),
});

export const examScheduleActiveSchema = z.object({
  id: uuidField,
  is_active: z.boolean(),
});

export const examTokenSchema = z.object({
  id: uuidField,
});

export type ExamPackageInput = z.infer<typeof examPackageSchema>;
export type ExamScheduleInput = z.infer<typeof examScheduleSchema>;
