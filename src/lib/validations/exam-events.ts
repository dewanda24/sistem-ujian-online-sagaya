import { z } from "zod";

export const examEventSchema = z.object({
  attempt_id: z.string().uuid("Pengerjaan ujian tidak valid."),
  event_type: z.enum([
    "tab_blur",
    "tab_focus",
    "visibility_hidden",
    "visibility_visible",
    "copy_attempt",
    "paste_attempt",
    "fullscreen_exit",
    "before_unload",
  ]),
  metadata: z.record(z.string(), z.unknown()).optional(),
});
