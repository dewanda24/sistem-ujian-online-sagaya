"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

const LOGOUT_EVENT_KEY = "sagaya-auth-event";

function loginUrl(reason = "session-expired") {
  return `/login?error=${reason}`;
}

export function notifyClientLogout() {
  try {
    window.localStorage.setItem(
      LOGOUT_EVENT_KEY,
      JSON.stringify({ type: "signed-out", at: Date.now() }),
    );
  } catch {}
}

export function SessionGuard() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname.startsWith("/dashboard")) {
      return;
    }

    const supabase = createClient();
    let mounted = true;

    const redirectToLogin = (reason?: string) => {
      if (!mounted) return;
      router.replace(loginUrl(reason));
      router.refresh();
    };

    const verifySession = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error || !session) {
        redirectToLogin("session-error");
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        redirectToLogin("signed-out");
      }
    });

    const handleStorage = (event: StorageEvent) => {
      if (event.key === LOGOUT_EVENT_KEY && event.newValue) {
        redirectToLogin("signed-out");
      }
    };

    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        void verifySession();
      }
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("pageshow", handlePageShow);
    void verifySession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [pathname, router]);

  return null;
}
