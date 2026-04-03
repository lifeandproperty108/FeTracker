import type { ReactNode } from 'react'
import { Header } from './header'
import { Sidebar } from './sidebar'
import { MobileNav } from './mobile-nav'
import { OrgSwitcher } from './org-switcher'
import type { UserRole } from '@/lib/types/database'

interface AppShellProps {
  children: ReactNode
  role: UserRole
  orgName: string
  userName: string
  selectedOrgId?: string | null
  organizations?: { id: string; name: string }[]
  userId?: string
}

export function AppShell({
  children,
  role,
  orgName,
  userName,
  selectedOrgId,
  organizations,
}: AppShellProps) {
  const hasSelectedOrg = role === 'super_admin' && !!selectedOrgId

  const orgSwitcherContent =
    role === 'super_admin' && organizations ? (
      <OrgSwitcher
        organizations={organizations}
        selectedOrgId={selectedOrgId ?? null}
        selectedOrgName={
          selectedOrgId
            ? organizations.find((o) => o.id === selectedOrgId)?.name ?? null
            : null
        }
      />
    ) : null

  return (
    <div className="min-h-screen bg-background">
      <Header userName={userName} orgName={orgName} role={role} hasSelectedOrg={hasSelectedOrg} topContent={orgSwitcherContent} />
      <Sidebar role={role} hasSelectedOrg={hasSelectedOrg} topContent={orgSwitcherContent} />
      <main className="lg:pl-60 pb-20 lg:pb-0">
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">{children}</div>
      </main>
      <MobileNav role={role} hasSelectedOrg={hasSelectedOrg} />
    </div>
  )
}
