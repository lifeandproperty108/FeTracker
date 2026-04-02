import type { ReactNode } from 'react'
import { Header } from './header'
import { Sidebar } from './sidebar'
import { MobileNav } from './mobile-nav'
import type { UserRole } from '@/lib/types/database'

interface AppShellProps {
  children: ReactNode
  role: UserRole
  orgName: string
  userName: string
}

export function AppShell({ children, role, orgName, userName }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <Header userName={userName} orgName={orgName} role={role} />
      <Sidebar role={role} />
      <main className="lg:pl-60 pb-20 lg:pb-0">
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
      <MobileNav role={role} />
    </div>
  )
}
