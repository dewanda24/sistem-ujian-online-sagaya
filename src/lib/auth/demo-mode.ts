import type { CurrentUser } from "@/types/auth";

const demoEmailEnvKeys = [
  "DEMO_ADMIN_EMAIL",
  "DEMO_TEACHER_EMAIL",
  "DEMO_STUDENT_EMAIL",
  "DEMO_PROCTOR_EMAIL",
  "DEMO_PRINCIPAL_EMAIL",
] as const;

export const DEMO_MUTATION_BLOCKED_MESSAGE =
  "Aksi ini dibatasi di mode demo agar data contoh tetap aman.";

export function isDemoEmail(email?: string | null) {
  if (!email) {
    return false;
  }

  const normalizedEmail = normalizeEmail(email);

  return demoEmailEnvKeys.some((key) => {
    const demoEmail = process.env[key];

    return demoEmail ? normalizeEmail(demoEmail) === normalizedEmail : false;
  });
}

export function isDemoUser(user?: Pick<CurrentUser, "email"> | null) {
  return isDemoEmail(user?.email);
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}
