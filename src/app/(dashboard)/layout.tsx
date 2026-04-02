import { requireRole } from '@/lib/auth/require-role'
import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/layout/app-shell'
import { AuthProvider } from '@/components/providers/auth-provider'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { authUser, profile } = await requireRole([
    'org_admin',
    'facility_manager',
    'technician',
    'auditor',
  ])

  // Fetch org name
  let orgName = 'My Organization'
  if (profile.organization_id) {
    const supabase = await createClient()
    const { data: org } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', profile.organization_id)
      .single()
    if (org) orgName = org.name
  }

  return (
    <AuthProvider>
      <AppShell
        role={profile.role}
        orgName={orgName}
        userName={profile.full_name}
      >
        {children}
      </AppShell>
    </AuthProvider>
  )
}
