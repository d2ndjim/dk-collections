import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Set pathname header for use in layouts
  response.headers.set("x-pathname", request.nextUrl.pathname);

  // Protect admin routes (except login and auth callback)
  if (request.nextUrl.pathname.startsWith("/admin")) {
    if (
      !session &&
      !request.nextUrl.pathname.startsWith("/admin/login") &&
      !request.nextUrl.pathname.startsWith("/admin/auth")
    ) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    // Redirect to admin dashboard if already logged in and trying to access login
    if (session && request.nextUrl.pathname.startsWith("/admin/login")) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
