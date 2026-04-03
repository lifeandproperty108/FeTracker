import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getServerSupabasePublicConfig } from './config'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })
  const config = getServerSupabasePublicConfig()

  const supabase = createServerClient(
    config.url,
    config.anonKey,
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

  const code = request.nextUrl.searchParams.get('code')
  if (code && request.nextUrl.pathname === '/auth/callback') {
    await supabase.auth.exchangeCodeForSession(code)
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
