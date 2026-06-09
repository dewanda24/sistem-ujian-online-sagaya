import { z } from "zod";

const uuidField = z.string().uuid("ID tidak valid");
const optionalUuidField = z
  .string()
  .uuid("ID tidak valid")
  .or(z.literal(""))
  .optional()
  .transform((value) => (value ? value : null));

export const schoolSchema = z.object({
  id: optionalUuidField,
  name: z.string().min(2, "Nama sekolah wajib diisi"),
  npsn: z.string().optional().default(""),
  education_level: z.string().optional().default(""),
  address: z.string().optional().default(""),
  city: z.string().optional().default(""),
  province: z.string().optional().default(""),
  phone: z.string().optional().default(""),
  email: z.string().email("Email tidak valid").or(z.literal("")).default(""),
  is_active: z.boolean().default(true),
});

export const academicYearSchema = z.object({
  id: optionalUuidField,
  school_id: uuidField,
  name: z.string().min(4, "Tahun ajaran wajib diisi"),
  starts_at: z.string().optional().default(""),
  ends_at: z.string().optional().default(""),
  is_active: z.boolean().default(false),
});

export const semesterSchema = z.object({
  id: optionalUuidField,
  academic_year_id: uuidField,
  name: z.string().min(2, "Nama semester wajib diisi"),
  code: z.string().min(2, "Kode semester wajib diisi"),
  is_active: z.boolean().default(false),
});

export const classSchema = z.object({
  id: optionalUuidField,
  school_id: uuidField,
  academic_year_id: uuidField,
  name: z.string().min(1, "Nama kelas wajib diisi"),
  grade_level: z.coerce.number().int().min(1).max(12),
  homeroom_teacher_id: optionalUuidField,
  is_active: z.boolean().default(true),
});

export const subjectSchema = z.object({
  id: optionalUuidField,
  school_id: uuidField,
  code: z.string().min(1, "Kode mata pelajaran wajib diisi"),
  name: z.string().min(2, "Nama mata pelajaran wajib diisi"),
  is_active: z.boolean().default(true),
});

export const teacherSchema = z.object({
  id: optionalUuidField,
  email: z.string().email("Email tidak valid"),
  username: z.string().min(3, "Username minimal 3 karakter"),
  password: z.string().min(6, "Password minimal 6 karakter").optional(),
  full_name: z.string().min(2, "Nama lengkap wajib diisi"),
  nip: z.string().optional().default(""),
  phone: z.string().optional().default(""),
  status: z.enum(["active", "inactive"]).default("active"),
});

export const studentSchema = z.object({
  id: optionalUuidField,
  email: z.string().email("Email tidak valid"),
  username: z.string().min(3, "Username minimal 3 karakter"),
  password: z.string().min(6, "Password minimal 6 karakter").optional(),
  full_name: z.string().min(2, "Nama lengkap wajib diisi"),
  nis: z.string().optional().default(""),
  nisn: z.string().optional().default(""),
  phone: z.string().optional().default(""),
  status: z.enum(["active", "inactive"]).default("active"),
});

export const teacherAssignmentSchema = z.object({
  teacher_id: uuidField,
  subject_id: uuidField,
  class_id: uuidField,
  academic_year_id: uuidField,
});

export const classMemberSchema = z.object({
  student_id: uuidField,
  class_id: uuidField,
  joined_at: z.string().optional().default(""),
});

export type SchoolInput = z.infer<typeof schoolSchema>;
export type AcademicYearInput = z.infer<typeof academicYearSchema>;
export type SemesterInput = z.infer<typeof semesterSchema>;
export type ClassInput = z.infer<typeof classSchema>;
export type SubjectInput = z.infer<typeof subjectSchema>;
export type TeacherInput = z.infer<typeof teacherSchema>;
export type StudentInput = z.infer<typeof studentSchema>;
