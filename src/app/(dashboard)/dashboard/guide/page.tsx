import { getUser } from '@/lib/auth/get-user'
import { redirect } from 'next/navigation'
import { GuidePage } from '@/components/tutorial/guide-page'

export default async function DashboardGuidePage() {
  const userData = await getUser()
  if (!userData) redirect('/login')
  return <GuidePage role={userData.profile.role} userId={userData.profile.id} />
}
