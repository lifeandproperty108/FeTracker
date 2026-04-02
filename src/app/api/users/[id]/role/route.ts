import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/auth/get-user'
import { createAdminClient } from '@/lib/supabase/admin'
import type { UserRole } from '@/lib/types/database'

const ASSIGNABLE_ROLES: UserRole[] = ['org_admin', 'facility_manager', 'technician', 'auditor']

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getUser()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { profile } = session

    if (profile.role !== 'org_admin' && profile.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: targetUserId } = await params
    const body = await request.json()
    const { role } = body as { role: UserRole }

    if (!role || !ASSIGNABLE_ROLES.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Allowed: org_admin, facility_manager, technician, auditor.' },
        { status: 400 }
      )
    }

    // Cannot change own role
    if (targetUserId === profile.id) {
      return NextResponse.json(
        { error: 'You cannot change your own role' },
        { status: 403 }
      )
    }

    const admin = createAdminClient()

    // Verify target user exists and belongs to the same organization
    const { data: targetUser, error: fetchError } = await admin
      .from('users')
      .select('id, organization_id, role')
      .eq('id', targetUserId)
      .single()

    if (fetchError || !targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Org admins can only manage users in their own org
    if (profile.role === 'org_admin' && targetUser.organization_id !== profile.organization_id) {
      return NextResponse.json(
        { error: 'You can only manage users in your own organization' },
        { status: 403 }
      )
    }

    // Cannot change a super_admin's role
    if (targetUser.role === 'super_admin') {
      return NextResponse.json(
        { error: 'Cannot change a super admin role' },
        { status: 403 }
      )
    }

    const { error: updateError } = await admin
      .from('users')
      .update({ role })
      .eq('id', targetUserId)

    if (updateError) {
      console.error('Failed to update role:', updateError)
      return NextResponse.json({ error: 'Failed to update role' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to update user role:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
