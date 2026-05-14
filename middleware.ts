import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isAuthPage = request.nextUrl.pathname === "/"
  const isDashboardPage = request.nextUrl.pathname.startsWith("/dashboard")
  const isAdminPage = request.nextUrl.pathname.startsWith("/admin")

  if (isAdminPage) {
    if (!user) {
      return NextResponse.redirect(new URL("/", request.url)) // Redirect to login
    }
    // Check if user is admin using the Supabase client associated with the user's session
    const { data: isAdmin, error: rpcError } = await supabase.rpc("is_current_user_admin")

    if (rpcError || !isAdmin) {
      console.error("Admin check error or not admin:", rpcError)
      // Redirect to dashboard or an unauthorized page
      return NextResponse.redirect(new URL("/dashboard?error=unauthorized_admin_access", request.url))
    }
  } else if (isDashboardPage && !user) {
    return NextResponse.redirect(new URL("/", request.url))
  } else if (isAuthPage && user) {
    // If user is on login page but already logged in, check if admin to redirect appropriately
    const { data: isAdmin, error: rpcErrorOnLoginCheck } = await supabase.rpc("is_current_user_admin")
    if (!rpcErrorOnLoginCheck && isAdmin) {
      return NextResponse.redirect(new URL("/admin", request.url))
    }
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
