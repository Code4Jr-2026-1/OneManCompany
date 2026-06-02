import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { pathname } = req.nextUrl
  const role = req.auth?.user?.role

  if (!req.auth && pathname !== "/login" && pathname !== "/register") {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  if (role === "COACH" && pathname.startsWith("/student")) {
    return NextResponse.redirect(new URL("/coach", req.url))
  }
  if (role === "STUDENT" && pathname.startsWith("/coach")) {
    return NextResponse.redirect(new URL("/student", req.url))
  }
  if (role === "PARENT" && (pathname.startsWith("/coach") || pathname.startsWith("/student"))) {
    return NextResponse.redirect(new URL("/parent", req.url))
  }
})

export const config = {
  matcher: ["/coach/:path*", "/student/:path*", "/parent/:path*"],
}
