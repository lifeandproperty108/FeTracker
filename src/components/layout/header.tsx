'use client'

import { useRouter } from 'next/navigation'
import { LogOut, Menu } from 'lucide-react'
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
}

export function Header({ userName, orgName, role, showMobileSidebar = true }: HeaderProps) {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="sticky top-0 z-40 h-14 border-b border-border bg-background">
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
                <SheetHeader className="border-b border-border px-4 py-3">
                  <SheetTitle>
                    <span className="text-red-600 font-bold text-lg">FE Tracker</span>
                  </SheetTitle>
                </SheetHeader>
                <Sidebar role={role} variant="inline" />
              </SheetContent>
            </Sheet>
          )}
          <span className="text-red-600 font-bold text-lg select-none">FE Tracker</span>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <span className="hidden sm:block text-sm text-muted-foreground truncate max-w-[160px]">
            {orgName}
          </span>

          <DropdownMenu>
            <DropdownMenuTrigger
              className="flex items-center gap-2 rounded-lg p-1 hover:bg-muted transition-colors outline-none"
            >
              <Avatar size="sm">
                <AvatarFallback>{getInitials(userName)}</AvatarFallback>
              </Avatar>
              <Badge variant="secondary" className="hidden sm:inline-flex text-[10px]">
                {formatRole(role)}
              </Badge>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="bottom" sideOffset={8}>
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{userName}</span>
                  <span className="text-xs text-muted-foreground">{orgName}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
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
