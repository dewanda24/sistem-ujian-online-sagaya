import { z } from "zod";

const uuidField = z.string().uuid("ID tidak valid.");

export const startExamSchema = z.object({
  schedule_id: uuidField,
  access_token: z.string().optional(),
});

export const saveAnswerSchema = z.object({
  attempt_id: uuidField,
  question_id: uuidField,
  selected_option_id: z.preprocess(
    (value) => (value === "" ? undefined : value),
    uuidField.optional(),
  ),
  essay_answer: z.string().optional(),
});

export const submitAttemptSchema = z.object({
  attempt_id: uuidField,
});
