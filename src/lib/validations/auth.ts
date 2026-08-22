import { z } from "zod";

export const loginSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1, "Username atau email wajib diisi."),
  password: z.string().min(1, "Kata sandi wajib diisi."),
});

export type LoginInput = z.infer<typeof loginSchema>;
