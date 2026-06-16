import { z } from "zod";

const uuidField = z.string().uuid("ID tidak valid");
const optionalUuidField = z
  .string()
  .uuid("ID tidak valid")
  .or(z.literal(""))
  .optional()
  .transform((value) => (value ? value : null));
const mediaUrlField = (message: string) =>
  z
    .string()
    .refine(
      (value) => {
        if (value === "") return true;

        try {
          if (value.startsWith("/")) {
            const url = new URL(value, "http://localhost");

            return url.pathname === "/api/question-bank/media";
          }

          const url = new URL(value);

          return ["http:", "https:"].includes(url.protocol);
        } catch {
          return false;
        }
      },
      { message },
    );

export const questionCategorySchema = z.object({
  id: optionalUuidField,
  school_id: uuidField,
  subject_id: uuidField,
  name: z.string().min(2, "Nama kategori wajib diisi"),
  description: z.string().optional().default(""),
  is_active: z.boolean().default(true),
});

const questionOptionSchema = z.object({
  id: optionalUuidField,
  option_label: z.string().min(1),
  option_text: z.string().min(1, "Teks opsi wajib diisi"),
  is_correct: z.boolean().default(false),
  order_number: z.coerce.number().int().min(1),
});

export const questionSchema = z
  .object({
    id: optionalUuidField,
    school_id: uuidField,
    subject_id: uuidField,
    category_id: optionalUuidField,
    stimulus_id: optionalUuidField,
    type: z.enum(["multiple_choice", "essay"]),
    difficulty: z.enum(["easy", "medium", "hard"]),
    content: z.string().min(3, "Konten soal wajib diisi"),
    explanation: z.string().optional().default(""),
    point: z.coerce
      .number()
      .int("Poin harus berupa bilangan bulat seperti 1, 2, atau 3")
      .positive("Poin harus lebih dari 0"),
    status: z.enum(["draft", "published"]).default("draft"),
    is_active: z.boolean().default(true),
    options: z.array(questionOptionSchema).default([]),
  })
  .superRefine((value, context) => {
    if (value.type === "essay") {
      return;
    }

    const filledOptions = value.options.filter((option) =>
      option.option_text.trim(),
    );

    if (filledOptions.length < 2) {
      context.addIssue({
        code: "custom",
        message: "Soal pilihan ganda wajib memiliki minimal 2 opsi.",
        path: ["options"],
      });
    }

    const correctCount = filledOptions.filter((option) => option.is_correct).length;

    if (correctCount !== 1) {
      context.addIssue({
        code: "custom",
        message: "Soal pilihan ganda wajib memiliki tepat satu jawaban benar.",
        path: ["options"],
      });
    }
  });

export const questionStatusSchema = z.object({
  id: uuidField,
  status: z.enum(["draft", "published", "archived"]),
});

export const questionActiveSchema = z.object({
  id: uuidField,
  is_active: z.boolean(),
});

export const questionStimulusSchema = z.object({
  id: optionalUuidField,
  school_id: uuidField,
  subject_id: optionalUuidField,
  title: z.string().min(2, "Judul stimulus wajib diisi"),
  content: z.string().optional().default(""),
  media_url: mediaUrlField("URL media stimulus tidak valid").optional(),
  media_type: z
    .enum(["image", "audio", "video", "file", "link"])
    .or(z.literal(""))
    .optional(),
  is_active: z.boolean().default(true),
});

export const questionAttachmentSchema = z.object({
  media_type: z.enum(["image", "audio", "video", "file", "link"]),
  url: mediaUrlField("URL media soal tidak valid").refine(Boolean, {
    message: "URL media soal tidak valid",
  }),
  file_name: z.string().optional().default(""),
  caption: z.string().optional().default(""),
  order_number: z.coerce.number().int().min(1).default(1),
});

export type QuestionCategoryInput = z.infer<typeof questionCategorySchema>;
export type QuestionInput = z.infer<typeof questionSchema>;
