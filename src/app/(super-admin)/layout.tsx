import { requireRole } from '@/lib/auth/require-role'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSelectedOrgId } from '@/lib/org-switcher'
import { AppShell } from '@/components/layout/app-shell'
import { AuthProvider } from '@/components/providers/auth-provider'

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { profile } = await requireRole(['super_admin'])

  const adminClient = createAdminClient()
  const { data: orgs } = await adminClient
    .from('organizations')
    .select('id, name')
    .order('name')
  const organizations = orgs ?? []

  const selectedOrgId = await getSelectedOrgId()

  return (
    <AuthProvider>
      <AppShell
        role={profile.role}
        orgName="FE Tracker Admin"
        userName={profile.full_name}
        selectedOrgId={selectedOrgId}
        organizations={organizations}
        userId={profile.id}
      >
        {children}
      </AppShell>
    </AuthProvider>
  )
}
