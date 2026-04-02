import { createAdminClient } from '@/lib/supabase/admin'
import { randomBytes } from 'crypto'
import type { UserRole } from '@/lib/types/database'

export async function createInvitation({
  email,
  organizationId,
  role,
}: {
  email: string
  organizationId: string
  role: UserRole
}) {
  const admin = createAdminClient()
  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

  const { data, error } = await admin
    .from('pending_invitations')
    .insert({
      email,
      organization_id: organizationId,
      role,
      token,
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single()

  if (error) throw error
  return data
}
