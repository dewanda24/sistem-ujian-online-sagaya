import { z } from "zod";

const uuidField = z.string().uuid("ID tidak valid.");

export const gradeEssayAnswerSchema = z.object({
  attempt_id: uuidField,
  answer_id: uuidField,
  awarded_score: z.coerce
    .number()
    .min(0, "Skor tidak boleh negatif."),
  max_score: z.coerce
    .number()
    .min(0, "Skor maksimum tidak valid."),
}).refine((value) => value.awarded_score <= value.max_score, {
  message: "Skor essay tidak boleh melebihi poin soal.",
  path: ["awarded_score"],
});

export const finalizeAttemptSchema = z.object({
  attempt_id: uuidField,
});
