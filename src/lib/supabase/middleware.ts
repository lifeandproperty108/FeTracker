import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // If there's an auth code, exchange it for a session in the middleware
  // This is required for PKCE flow — the code verifier is stored in cookies
  // and must be exchanged server-side where cookies are accessible
  const code = request.nextUrl.searchParams.get('code')
  if (code && request.nextUrl.pathname === '/auth/callback') {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Successfully exchanged — redirect to the callback page without the code
      // The page will detect the session and redirect to the right place
      const url = request.nextUrl.clone()
      url.searchParams.delete('code')
      return NextResponse.redirect(url)
    }
  }

  const { data: { user } } = await supabase.auth.getUser()

  const publicPaths = ['/', '/login', '/accept-invite', '/auth/callback']
  const isPublic = publicPaths.some(p => request.nextUrl.pathname === p || request.nextUrl.pathname.startsWith(p + '/'))

  if (!user && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
