"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, X, Check, Eye, EyeOff } from "lucide-react";
import { resetAdminUserPasswordAction } from "@/features/admin/actions";

type Props = {
  user: {
    id: string;
    username: string;
    email: string;
    full_name?: string | null;
  };
  redirectPath: string;
  onClose?: () => void;
};

export function UserPasswordResetModal({ user, redirectPath, onClose }: Props) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValid = password.length >= 6;

  function handleClose() {
    if (onClose) {
      onClose();
    } else {
      router.push(redirectPath);
    }
  }

  function generateRandomPassword() {
    const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%";
    let result = "";
    for (let i = 0; i < 10; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(result);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-xl space-y-5 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-2 border-b">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <KeyRound className="size-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Reset Password Pengguna</h3>
              <p className="text-xs text-muted-foreground">{user.username} ({user.email})</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        <form
          action={resetAdminUserPasswordAction}
          onSubmit={() => setIsSubmitting(true)}
          className="space-y-4"
        >
          <input type="hidden" name="redirect_path" value={redirectPath} />
          <input type="hidden" name="id" value={user.id} />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-foreground">
                Password Baru <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={generateRandomPassword}
                className="text-xs text-primary hover:underline font-medium"
              >
                Acak Password
              </button>
            </div>

            <div className="relative">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter..."
                className="w-full rounded-lg border bg-background px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                required
                minLength={6}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Password akan langsung berlaku untuk sesi login berikutnya.
            </p>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg border px-4 py-2 text-xs font-medium hover:bg-muted transition-colors"
              disabled={isSubmitting}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={!isValid || isSubmitting}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <Check className="size-3.5" />
              {isSubmitting ? "Menyimpan..." : "Simpan Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
