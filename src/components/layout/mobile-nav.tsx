'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Building2,
  MapPin,
  BarChart3,
  ClipboardList,
  Receipt,
  QrCode,
  Clock,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { UserRole } from '@/lib/types/database'

interface MobileNavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

function getMobileNavItems(role: UserRole, hasSelectedOrg?: boolean): MobileNavItem[] {
  switch (role) {
    case 'super_admin':
      if (hasSelectedOrg) {
        return [
          { label: 'Admin Panel', href: '/super-admin', icon: LayoutDashboard },
          { label: 'Dashboard', href: '/dashboard', icon: BarChart3 },
          { label: 'Locations', href: '/dashboard/locations', icon: MapPin },
          { label: 'Reports', href: '/dashboard/reports', icon: BarChart3 },
        ]
      }
      return [
        { label: 'Dashboard', href: '/super-admin', icon: LayoutDashboard },
        { label: 'Orgs', href: '/super-admin/organizations', icon: Building2 },
      ]
    case 'org_admin':
      return [
        { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { label: 'Locations', href: '/dashboard/locations', icon: MapPin },
        { label: 'Reports', href: '/dashboard/reports', icon: BarChart3 },
        { label: 'Settings', href: '/dashboard/settings', icon: Settings },
      ]
    case 'facility_manager':
      return [
        { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { label: 'Locations', href: '/dashboard/locations', icon: MapPin },
        { label: 'Reports', href: '/dashboard/reports', icon: BarChart3 },
      ]
    case 'technician':
      return [
        { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { label: 'Inspect', href: '/inspect', icon: ClipboardList },
      ]
    case 'auditor':
      return [
        { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { label: 'Reports', href: '/dashboard/reports', icon: BarChart3 },
      ]
    default:
      return []
  }
}

export function MobileNav({ role, hasSelectedOrg }: { role: UserRole; hasSelectedOrg?: boolean }) {
  const pathname = usePathname()
  const navItems = getMobileNavItems(role, hasSelectedOrg)

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 border-t border-gray-200 dark:border-gray-800 bg-background">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' &&
              item.href !== '/super-admin' &&
              pathname.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              data-tour={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg text-xs transition-all duration-200 min-w-0 relative',
                isActive
                  ? 'text-red-600 font-medium'
                  : 'text-muted-foreground'
              )}
            >
              <item.icon
                className={cn(
                  'h-5 w-5 transition-colors duration-200',
                  isActive && 'text-red-600'
                )}
              />
              <span className="truncate">{item.label}</span>
              {isActive && (
                <span className="absolute bottom-1.5 h-1 w-1 rounded-full bg-red-600" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

// Inspect-specific mobile nav
export function InspectMobileNav() {
  const pathname = usePathname()

  const items: MobileNavItem[] = [
    { label: 'Scan', href: '/inspect', icon: QrCode },
    { label: 'Locations', href: '/inspect/locations', icon: MapPin },
    { label: 'History', href: '/inspect/history', icon: Clock },
  ]

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 border-t border-gray-200 dark:border-gray-800 bg-background safe-area-pb">
      <div className="flex items-center justify-around h-[68px] px-2">
        {items.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/inspect' && pathname.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-1 px-4 py-2 rounded-xl text-xs transition-all duration-200 min-w-[64px] min-h-[48px] justify-center relative',
                isActive
                  ? 'text-red-600 font-semibold'
                  : 'text-muted-foreground'
              )}
            >
              <item.icon
                className={cn(
                  'h-6 w-6 transition-colors duration-200',
                  isActive && 'text-red-600'
                )}
              />
              <span className="truncate">{item.label}</span>
              {isActive && (
                <span className="absolute bottom-0.5 h-1 w-4 rounded-full bg-red-600" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
