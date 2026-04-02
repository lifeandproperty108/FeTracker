import { requireRole } from '@/lib/auth/require-role'
import { AppShell } from '@/components/layout/app-shell'
import { AuthProvider } from '@/components/providers/auth-provider'

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { profile } = await requireRole(['super_admin'])

  return (
    <AuthProvider>
      <AppShell
        role={profile.role}
        orgName="FE Tracker Admin"
        userName={profile.full_name}
      >
        {children}
      </AppShell>
    </AuthProvider>
  )
}
