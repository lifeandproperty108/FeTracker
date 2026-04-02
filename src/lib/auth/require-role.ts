import { redirect } from 'next/navigation'
import { getUser } from './get-user'
import type { UserRole } from '@/lib/types/database'

export async function requireRole(allowedRoles: UserRole[]) {
  const result = await getUser()
  if (!result) redirect('/login')

  if (!allowedRoles.includes(result.profile.role)) {
    // Redirect to appropriate page based on their actual role
    if (result.profile.role === 'super_admin') redirect('/super-admin')
    redirect('/dashboard')
  }

  return result
}
