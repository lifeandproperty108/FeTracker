'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Building2,
  Users,
  FileText,
  Settings,
  QrCode,
  ClipboardList,
  Receipt,
  MapPin,
  BarChart3,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { UserRole } from '@/lib/types/database'

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
}

function getNavItems(role: UserRole): NavItem[] {
  switch (role) {
    case 'super_admin':
      return [
        { label: 'Dashboard', href: '/super-admin', icon: LayoutDashboard },
        { label: 'Organizations', href: '/super-admin/organizations', icon: Building2 },
        { label: 'Invoices', href: '/super-admin/invoices', icon: Receipt },
        { label: 'Quotes', href: '/super-admin/quotes', icon: FileText },
      ]
    case 'org_admin':
      return [
        { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { label: 'Locations', href: '/dashboard/locations', icon: MapPin },
        { label: 'Team', href: '/dashboard/team', icon: Users },
        { label: 'Reports', href: '/dashboard/reports', icon: BarChart3 },
        { label: 'Quotes', href: '/dashboard/quotes', icon: FileText },
        { label: 'Invoices', href: '/dashboard/invoices', icon: Receipt },
        { label: 'Settings', href: '/dashboard/settings', icon: Settings },
      ]
    case 'facility_manager':
      return [
        { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { label: 'My Locations', href: '/dashboard/locations', icon: MapPin },
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
        { label: 'Reports', href: '/dashboard/reports', icon: BarChart3, badge: 'Read Only' },
      ]
    default:
      return []
  }
}

export { getNavItems }
export type { NavItem }

export function Sidebar({
  role,
  variant = 'desktop',
}: {
  role: UserRole
  variant?: 'desktop' | 'inline'
}) {
  const pathname = usePathname()
  const navItems = getNavItems(role)

  if (variant === 'inline') {
    return (
      <nav className="flex flex-1 flex-col gap-1 p-4 overflow-y-auto">
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
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-red-600 text-white'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <item.icon className="size-4 shrink-0" />
              <span>{item.label}</span>
              {item.badge && (
                <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0">
                  {item.badge}
                </Badge>
              )}
            </Link>
          )
        })}
      </nav>
    )
  }

  return (
    <aside className="hidden lg:flex lg:w-60 lg:flex-col lg:fixed lg:inset-y-0 lg:top-14 lg:border-r lg:border-border bg-background z-30">
      <nav className="flex flex-1 flex-col gap-1 p-4 overflow-y-auto">
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
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-red-600 text-white'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <item.icon className="size-4 shrink-0" />
              <span>{item.label}</span>
              {item.badge && (
                <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0">
                  {item.badge}
                </Badge>
              )}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
