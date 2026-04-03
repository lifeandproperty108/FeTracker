'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LogOut, Menu, Settings } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Sidebar } from './sidebar'
import { createClient } from '@/lib/supabase/client'
import type { UserRole } from '@/lib/types/database'

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function formatRole(role: UserRole): string {
  return role
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

interface HeaderProps {
  userName: string
  orgName: string
  role: UserRole
  showMobileSidebar?: boolean
  hasSelectedOrg?: boolean
  topContent?: React.ReactNode
}

export function Header({ userName, orgName, role, showMobileSidebar = true, hasSelectedOrg, topContent }: HeaderProps) {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="sticky top-0 z-40 h-14 border-b border-gray-200 dark:border-gray-800 bg-background">
      <div className="flex h-full items-center justify-between px-4">
        {/* Left side */}
        <div className="flex items-center gap-3">
          {showMobileSidebar && (
            <Sheet>
              <SheetTrigger
                className="lg:hidden"
                render={<Button variant="ghost" size="icon" />}
              >
                <Menu className="size-5" />
                <span className="sr-only">Open menu</span>
              </SheetTrigger>
              <SheetContent side="left" className="w-60 p-0">
                <SheetHeader className="border-b border-gray-200 dark:border-gray-800 px-4 py-3">
                  <SheetTitle>
                    <span className="font-heading text-red-600 font-bold text-lg">FE Tracker</span>
                  </SheetTitle>
                </SheetHeader>
                <Sidebar role={role} variant="inline" hasSelectedOrg={hasSelectedOrg} topContent={topContent} />
              </SheetContent>
            </Sheet>
          )}
          <Link href={role === 'super_admin' ? '/super-admin' : '/dashboard'} className="font-heading text-red-600 font-bold text-lg select-none hover:opacity-80 transition-opacity">
            FE Tracker
          </Link>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <span className="hidden sm:block text-sm text-muted-foreground truncate max-w-[160px]">
            {orgName}
          </span>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 outline-none" />
              }
            >
              <Avatar size="sm" className="ring-2 ring-gray-200 dark:ring-gray-700">
                <AvatarFallback>{getInitials(userName)}</AvatarFallback>
              </Avatar>
              <Badge variant="outline" className="hidden sm:inline-flex text-[10px] px-1.5 py-0">
                {formatRole(role)}
              </Badge>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="bottom" sideOffset={8} className="w-56">
              <DropdownMenuLabel className="py-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">{userName}</span>
                  <span className="text-xs text-muted-foreground">{orgName}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/dashboard/account')} className="py-2">
                <Settings className="size-4" />
                Account Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSignOut} className="py-2">
                <LogOut className="size-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
