import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { updateSession } from "@/lib/supabase/middleware";
import { getDashboardPath } from "@/lib/auth/role-redirect";
import { canAccessRoute } from "@/lib/auth/role-access";
import {
  DEMO_MUTATION_BLOCKED_MESSAGE,
  isDemoEmail,
} from "@/lib/auth/demo-mode";

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const response = await updateSession(request);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {},
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const protectedPrefixes = [
    "/dashboard",
    "/admin",
    "/teacher",
    "/proctor",
    "/student",
    "/principal",
  ];

  const isProtectedRoute = protectedPrefixes.some((prefix) =>
    pathname.startsWith(prefix),
  );

  const isAuthPage = pathname === "/login";
  const isServerAction = request.headers.has("next-action");

  if (!user && isProtectedRoute) {
    return redirectWithSessionCookies(
      request,
      response,
      "/login?error=session-expired",
    );
  }

  if (!user) {
    return withSessionHeaders(response, isProtectedRoute);
  }

  const { data: appUser } = await supabase
    .from("users")
    .select(
      `
      email,
      roles (
        name
      )
    `,
    )
    .eq("auth_user_id", user.id)
    .single();

  const roleData = Array.isArray(appUser?.roles)
    ? appUser.roles[0]
    : appUser?.roles;

  const role = roleData?.name;
  const isDemoUser = isDemoEmail(appUser?.email);

  if (!role) {
    return withSessionHeaders(response, isProtectedRoute);
  }

  if (
    isDemoUser &&
    !isServerAction &&
    isMutationRequest(request) &&
    !isDemoMutationAllowed(pathname)
  ) {
    return NextResponse.json(
      { ok: false, message: DEMO_MUTATION_BLOCKED_MESSAGE },
      { status: 403 },
    );
  }

  if (isAuthPage && !isServerAction && request.method === "GET") {
    return redirectWithSessionCookies(
      request,
      response,
      getDashboardPath(role),
    );
  }

  if (isProtectedRoute && !canAccessRoute(role, pathname)) {
    return redirectWithSessionCookies(
      request,
      response,
      "/dashboard/forbidden",
    );
  }

  return withSessionHeaders(response, isProtectedRoute);
}

function isMutationRequest(request: NextRequest) {
  return !["GET", "HEAD", "OPTIONS"].includes(request.method);
}

function isDemoMutationAllowed(pathname: string) {
  return (
    pathname === "/login" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/dashboard/student/active-exams") ||
    pathname.startsWith("/dashboard/exam-room") ||
    pathname.startsWith("/api/exam-answers") ||
    pathname.startsWith("/api/exam-heartbeat") ||
    pathname.startsWith("/api/exam-events")
  );
}

function redirectWithSessionCookies(
  request: NextRequest,
  sessionResponse: NextResponse,
  pathname: string,
) {
  const redirectResponse = NextResponse.redirect(new URL(pathname, request.url));

  sessionResponse.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie);
  });

  return redirectResponse;
}

function withSessionHeaders(response: NextResponse, isProtectedRoute: boolean) {
  if (!isProtectedRoute) {
    return response;
  }

  response.headers.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate",
  );
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
