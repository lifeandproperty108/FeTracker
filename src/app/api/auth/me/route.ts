import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { User } from '@/lib/types/database'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ user: null })
  }

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  return NextResponse.json({ user: (profile as User) ?? null })
}
