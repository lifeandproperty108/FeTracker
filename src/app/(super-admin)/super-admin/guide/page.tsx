import { requireRole } from '@/lib/auth/require-role'
import { GuidePage } from '@/components/tutorial/guide-page'

export default async function SuperAdminGuidePage() {
  const { profile } = await requireRole(['super_admin'])
  return <GuidePage role={profile.role} userId={profile.id} />
}
