import type { CurrentUser } from "@/types/auth";

const demoEmailEnvKeys = [
  "DEMO_ADMIN_EMAIL",
  "DEMO_TEACHER_EMAIL",
  "DEMO_STUDENT_EMAIL",
  "DEMO_PROCTOR_EMAIL",
  "DEMO_PRINCIPAL_EMAIL",
] as const;

export type DemoEmailEnvKey = (typeof demoEmailEnvKeys)[number];

const demoAccountDefaults = {
  DEMO_ADMIN_EMAIL: "demo.admin@sagaya.test",
  DEMO_TEACHER_EMAIL: "demo.guru@sagaya.test",
  DEMO_STUDENT_EMAIL: "demo.siswa@sagaya.test",
  DEMO_PROCTOR_EMAIL: "demo.pengawas@sagaya.test",
  DEMO_PRINCIPAL_EMAIL: "demo.kepsek@sagaya.test",
} as const satisfies Record<DemoEmailEnvKey, string>;

export const DEMO_MUTATION_BLOCKED_MESSAGE =
  "Aksi ini dibatasi di mode demo agar data contoh tetap aman.";

export function isDemoModeEnabled() {
  const value = process.env.DEMO_ENABLED?.trim().toLowerCase();

  return value === "true" || value === "1" || value === "yes" || value === "on";
}

export function getDemoEmailByEnvKey(key: DemoEmailEnvKey) {
  return process.env[key]?.trim() || demoAccountDefaults[key];
}

export function isDemoEmail(email?: string | null) {
  if (!email) {
    return false;
  }

  const normalizedEmail = normalizeEmail(email);

  return demoEmailEnvKeys.some((key) => {
    const demoEmail = getDemoEmailByEnvKey(key);

    return demoEmail ? normalizeEmail(demoEmail) === normalizedEmail : false;
  });
}

export function isDemoUser(user?: Pick<CurrentUser, "email"> | null) {
  return isDemoEmail(user?.email);
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}
