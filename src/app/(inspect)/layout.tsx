import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { requireRole } from '@/lib/auth/require-role'
import { AuthProvider } from '@/components/providers/auth-provider'
import { InspectMobileNav } from '@/components/layout/mobile-nav'

export default async function InspectLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireRole(['technician', 'org_admin', 'super_admin'])

  return (
    <AuthProvider>
      <div className="min-h-screen bg-background flex flex-col">
        {/* Simple top bar */}
        <header className="sticky top-0 z-40 h-14 border-b border-border bg-background">
          <div className="flex h-full items-center gap-3 px-4">
            <Link
              href="/dashboard"
              className="flex items-center justify-center size-8 rounded-lg hover:bg-muted transition-colors"
            >
              <ArrowLeft className="size-5 text-muted-foreground" />
              <span className="sr-only">Back to Dashboard</span>
            </Link>
            <span className="text-red-600 font-bold text-lg select-none">
              FE Tracker
            </span>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 pb-20">
          <div className="p-4 sm:p-6">{children}</div>
        </main>

        {/* Bottom nav */}
        <InspectMobileNav />
      </div>
    </AuthProvider>
  )
}
