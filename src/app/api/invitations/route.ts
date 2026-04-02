import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/auth/get-user'
import { createInvitation } from '@/lib/invitations'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email/send'
import InviteEmail from '@/lib/email/templates/invite'
import type { UserRole } from '@/lib/types/database'

const VALID_ROLES: UserRole[] = ['org_admin', 'facility_manager', 'technician', 'auditor']

export async function POST(request: NextRequest) {
  try {
    const session = await getUser()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { profile } = session

    if (profile.role !== 'super_admin' && profile.role !== 'org_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { email, organizationId, role } = body as {
      email: string
      organizationId: string
      role: UserRole
    }

    if (!email || !organizationId || !role) {
      return NextResponse.json(
        { error: 'Missing required fields: email, organizationId, role' },
        { status: 400 }
      )
    }

    if (!VALID_ROLES.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Cannot invite as super_admin.' },
        { status: 400 }
      )
    }

    // Org admins can only invite to their own organization
    if (profile.role === 'org_admin' && profile.organization_id !== organizationId) {
      return NextResponse.json(
        { error: 'You can only invite users to your own organization' },
        { status: 403 }
      )
    }

    const invitation = await createInvitation({ email, organizationId, role })

    // Fetch org name for the email
    const admin = createAdminClient()
    const { data: org } = await admin
      .from('organizations')
      .select('name')
      .eq('id', organizationId)
      .single()

    const organizationName = org?.name ?? 'your organization'

    await sendEmail({
      to: email,
      subject: `You've been invited to join ${organizationName} on FE Tracker`,
      react: InviteEmail({ organizationName, role, token: invitation.token }),
    })

    return NextResponse.json({ invitation }, { status: 201 })
  } catch (error) {
    console.error('Failed to create invitation:', error)
    return NextResponse.json(
      { error: 'Failed to create invitation' },
      { status: 500 }
    )
  }
}
