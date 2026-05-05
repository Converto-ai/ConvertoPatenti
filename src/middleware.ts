import { auth } from "@/src/lib/auth/config";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Public routes
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/setup") ||
    pathname.startsWith("/piano-scaduto") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/setup") ||
    pathname.startsWith("/api/telegram") ||
    pathname.startsWith("/api/health")
  ) {
    return NextResponse.next();
  }

  // Protected routes require session
  if (!req.auth) {
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  // Check plan expiry (skip for API routes to avoid breaking webhooks/calls)
  if (!pathname.startsWith("/api/")) {
    const scadenza = req.auth.user?.pianoScadenza;
    if (scadenza && new Date(scadenza) < new Date()) {
      const scadutoUrl = new URL("/piano-scaduto", req.url);
      return NextResponse.redirect(scadutoUrl);
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|svg|ico)$).*)",
  ],
};
