import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/auth/get-user'

export async function POST(request: NextRequest) {
  const userData = await getUser()
  if (!userData || userData.profile.role !== 'super_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { orgId } = await request.json()

  const response = NextResponse.json({ success: true })

  if (orgId) {
    response.cookies.set('selected_org_id', orgId, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    })
  } else {
    response.cookies.delete('selected_org_id')
  }

  return response
}
