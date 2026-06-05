import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { updateSession } from "@/lib/supabase/middleware";
import { getDashboardPath } from "@/lib/auth/role-redirect";
import { canAccessRoute } from "@/lib/auth/role-access";

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (isServerActionRequest(request)) {
    return NextResponse.next();
  }

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

  if (!user && isProtectedRoute) {
    return redirectWithSessionCookies(request, response, "/login");
  }

  if (!user) {
    return response;
  }

  const { data: appUser } = await supabase
    .from("users")
    .select(
      `
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

  if (!role) {
    return response;
  }

  if (isAuthPage) {
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

  return response;
}

function isServerActionRequest(request: NextRequest) {
  return request.method === "POST" && request.headers.has("next-action");
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

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
