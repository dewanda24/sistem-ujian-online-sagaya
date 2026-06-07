"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogout() {
    setIsLoading(true);

    const supabase = createClient();

    await supabase.auth.signOut();

    window.location.href = "/login";
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isLoading}
      className="inline-flex size-9 items-center justify-center rounded-xl border border-[#E2E8F0] text-sm hover:bg-[#F8FAFC] disabled:opacity-50 sm:w-auto sm:px-3"
    >
      <LogOut className="size-4 sm:hidden" />
      <span className="hidden sm:inline">{isLoading ? "Logout..." : "Logout"}</span>
      <span className="sr-only">{isLoading ? "Logout..." : "Logout"}</span>
    </button>
  );
}
