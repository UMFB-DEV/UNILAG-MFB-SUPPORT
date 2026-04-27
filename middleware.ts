import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  // Auth is handled client-side with JWT stored in localStorage.
  // Middleware cannot access localStorage, so we keep this as a no-op.
  return NextResponse.next();
}

export const config = {
  matcher: ["/helpdesk/:path*", "/dashboard/:path*"],
};

