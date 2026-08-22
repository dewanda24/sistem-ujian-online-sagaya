import { z } from "zod";

const uuidField = z.string().uuid("ID tidak valid.");

export const startExamSchema = z.object({
  schedule_id: uuidField,
  access_token: z.string().optional(),
});

export const saveAnswerSchema = z.object({
  attempt_id: uuidField,
  question_id: uuidField,
  session_id: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string().min(12).max(128).optional(),
  ),
  selected_option_id: z.preprocess(
    (value) => (value === "" ? undefined : value),
    uuidField.optional(),
  ),
  essay_answer: z.string().optional(),
});

export const saveBatchAnswersSchema = z.object({
  attempt_id: uuidField,
  session_id: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string().min(12).max(128).optional(),
  ),
  answers: z
    .array(
      z.object({
        question_id: uuidField,
        selected_option_id: z.preprocess(
          (value) => (value === "" ? undefined : value),
          uuidField.optional(),
        ),
        essay_answer: z.string().optional(),
      }),
    )
    .min(1)
    .max(250),
});

export const submitAttemptSchema = z.object({
  attempt_id: uuidField,
  session_id: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string().min(12).max(128).optional(),
  ),
});
