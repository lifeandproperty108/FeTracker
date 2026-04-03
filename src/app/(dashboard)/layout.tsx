import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth/require-role'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSelectedOrgId } from '@/lib/org-switcher'
import { AppShell } from '@/components/layout/app-shell'
import { AuthProvider } from '@/components/providers/auth-provider'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { authUser, profile } = await requireRole([
    'super_admin',
    'org_admin',
    'facility_manager',
    'technician',
    'auditor',
  ])

  let orgName = 'My Organization'
  let selectedOrgId: string | null = null
  let organizations: { id: string; name: string }[] | undefined

  if (profile.role === 'super_admin') {
    selectedOrgId = await getSelectedOrgId()

    // Super admin must select an org before accessing dashboard routes
    if (!selectedOrgId) {
      redirect('/super-admin')
    }

    const adminClient = createAdminClient()

    // Fetch org name using admin client (RLS blocks super_admin)
    const { data: org } = await adminClient
      .from('organizations')
      .select('name')
      .eq('id', selectedOrgId)
      .single()
    if (org) orgName = org.name

    // Fetch all organizations for the switcher
    const { data: orgs } = await adminClient
      .from('organizations')
      .select('id, name')
      .order('name')
    organizations = orgs ?? []
  } else {
    // Regular roles: fetch org name via RLS
    if (profile.organization_id) {
      const supabase = await createClient()
      const { data: org } = await supabase
        .from('organizations')
        .select('name')
        .eq('id', profile.organization_id)
        .single()
      if (org) orgName = org.name
    }
  }

  return (
    <AuthProvider>
      <AppShell
        role={profile.role}
        orgName={orgName}
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
