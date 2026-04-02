import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Check if user profile exists, create one if not (first OAuth sign-in)
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const admin = createAdminClient()
        const { data: profile } = await admin
          .from('users')
          .select('id')
          .eq('id', user.id)
          .single()

        if (!profile) {
          // First sign-in via OAuth — create user profile
          await admin.from('users').insert({
            id: user.id,
            email: user.email!,
            full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email!.split('@')[0],
            role: 'super_admin',
            organization_id: null,
          })
        }
      }

      return NextResponse.redirect(`${origin}/dashboard`)
    }
  }

  // Return to login on error
  return NextResponse.redirect(`${origin}/login`)
}
