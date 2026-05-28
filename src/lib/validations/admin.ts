import { z } from "zod";

const optionalUuidField = z
  .string()
  .uuid("ID tidak valid")
  .or(z.literal(""))
  .optional()
  .transform((value) => (value ? value : null));

export const adminUserSchema = z
  .object({
    id: optionalUuidField,
    auth_user_id: optionalUuidField,
    email: z.string().email("Email tidak valid"),
    username: z.string().min(3, "Username minimal 3 karakter"),
    password: z.string().optional().default(""),
    full_name: z.string().min(2, "Nama lengkap wajib diisi"),
    role_id: z.string().uuid("Role wajib dipilih"),
    status: z.enum(["active", "inactive"]).default("active"),
  })
  .superRefine((value, context) => {
    if (!value.id && value.password.length < 6) {
      context.addIssue({
        code: "custom",
        message: "Password minimal 6 karakter untuk user baru",
        path: ["password"],
      });
    }

    if (value.id && value.password && value.password.length < 6) {
      context.addIssue({
        code: "custom",
        message: "Password minimal 6 karakter",
        path: ["password"],
      });
    }
  });

export type AdminUserInput = z.infer<typeof adminUserSchema>;
