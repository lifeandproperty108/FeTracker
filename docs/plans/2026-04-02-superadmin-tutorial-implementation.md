# Superadmin Full Access & Interactive Tutorial Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Give super_admin access to all org-level features via an organization switcher, and add a three-layer interactive tutorial system (spotlight tour + guide page + sidebar link) for all roles.

**Architecture:** Organization switcher stores selected org in a cookie. Dashboard layout allows super_admin through and scopes queries to selected org using admin client. Tutorial uses custom spotlight overlay built with shadcn Popover + CSS backdrop, plus a dedicated guide page with role-filtered interactive content.

**Tech Stack:** Next.js 16 App Router, React 19, Supabase, shadcn/ui, Tailwind CSS, lucide-react, cookies-next (or Next.js cookies API)

---

## Task 1: Organization Switcher — Server Utility & API Route

**Files:**
- Create: `src/lib/org-switcher.ts`
- Create: `src/app/api/org-switcher/route.ts`

**Step 1: Create the server-side utility to read selected org from cookies**

```ts
// src/lib/org-switcher.ts
import { cookies } from 'next/headers'

export async function getSelectedOrgId(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get('selected_org_id')?.value ?? null
}
```

**Step 2: Create API route to set/clear the selected org cookie**

```ts
// src/app/api/org-switcher/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/auth/get-user'

export async function POST(request: NextRequest) {
  const userData = await getUser()
  if (!userData || userData.profile.role !== 'super_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { orgId } = await request.json()

  const response = NextResponse.json({ success: true })

  if (orgId) {
    response.cookies.set('selected_org_id', orgId, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    })
  } else {
    response.cookies.delete('selected_org_id')
  }

  return response
}
```

**Step 3: Verify the files have no syntax errors**

Run: `npx next lint src/lib/org-switcher.ts src/app/api/org-switcher/route.ts`

**Step 4: Commit**

```bash
git add src/lib/org-switcher.ts src/app/api/org-switcher/route.ts
git commit -m "feat: add org switcher server utility and API route"
```

---

## Task 2: Organization Switcher — Client Component

**Files:**
- Create: `src/components/layout/org-switcher.tsx`

**Step 1: Create the OrgSwitcher client component**

This component renders a combobox (using the existing Command component from cmdk) listing all organizations. When an org is selected, it POSTs to `/api/org-switcher` and reloads the page.

```tsx
// src/components/layout/org-switcher.tsx
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ChevronsUpDown, Building2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command'
import { cn } from '@/lib/utils'

interface Org {
  id: string
  name: string
}

interface OrgSwitcherProps {
  organizations: Org[]
  selectedOrgId: string | null
  selectedOrgName: string | null
}

export function OrgSwitcher({ organizations, selectedOrgId, selectedOrgName }: OrgSwitcherProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  async function selectOrg(orgId: string | null) {
    await fetch('/api/org-switcher', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orgId }),
    })
    setOpen(false)
    startTransition(() => {
      router.refresh()
    })
  }

  return (
    <div className="px-4 py-3 border-b border-border">
      <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5 block">
        Viewing Organization
      </label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between text-sm h-9"
            disabled={isPending}
          >
            <span className="flex items-center gap-2 truncate">
              <Building2 className="size-3.5 shrink-0 text-muted-foreground" />
              {selectedOrgName ?? 'Select organization...'}
            </span>
            <ChevronsUpDown className="size-3.5 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search organizations..." />
            <CommandList>
              <CommandEmpty>No organization found.</CommandEmpty>
              <CommandGroup>
                {organizations.map((org) => (
                  <CommandItem
                    key={org.id}
                    value={org.name}
                    onSelect={() => selectOrg(org.id)}
                  >
                    <Check
                      className={cn(
                        'mr-2 size-4',
                        selectedOrgId === org.id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    {org.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {selectedOrgId && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full mt-1.5 text-xs text-muted-foreground h-7"
          onClick={() => selectOrg(null)}
          disabled={isPending}
        >
          <X className="size-3 mr-1" />
          Clear selection
        </Button>
      )}
    </div>
  )
}
```

**Step 2: Verify no syntax errors**

Run: `npx next lint src/components/layout/org-switcher.tsx`

**Step 3: Commit**

```bash
git add src/components/layout/org-switcher.tsx
git commit -m "feat: add OrgSwitcher client component"
```

---

## Task 3: Update Sidebar & Mobile Nav for Super Admin Org Context

**Files:**
- Modify: `src/components/layout/sidebar.tsx:28-64`
- Modify: `src/components/layout/mobile-nav.tsx:25-58`

**Step 1: Update `getNavItems` in sidebar.tsx**

Change the `super_admin` case to accept an optional `hasSelectedOrg` parameter. When an org is selected, show all org_admin nav items plus a link back to super-admin panel.

In `sidebar.tsx`, change the function signature and super_admin case:

```ts
function getNavItems(role: UserRole, hasSelectedOrg?: boolean): NavItem[] {
  switch (role) {
    case 'super_admin':
      if (hasSelectedOrg) {
        return [
          { label: 'Admin Panel', href: '/super-admin', icon: LayoutDashboard },
          { label: 'Dashboard', href: '/dashboard', icon: BarChart3 },
          { label: 'Locations', href: '/dashboard/locations', icon: MapPin },
          { label: 'Team', href: '/dashboard/team', icon: Users },
          { label: 'Reports', href: '/dashboard/reports', icon: BarChart3 },
          { label: 'Quotes', href: '/dashboard/quotes', icon: FileText },
          { label: 'Invoices', href: '/dashboard/invoices', icon: Receipt },
          { label: 'Inspect', href: '/inspect', icon: ClipboardList },
          { label: 'Settings', href: '/dashboard/settings', icon: Settings },
        ]
      }
      return [
        { label: 'Dashboard', href: '/super-admin', icon: LayoutDashboard },
        { label: 'Organizations', href: '/super-admin/organizations', icon: Building2 },
      ]
    // ... rest unchanged
```

Update the `Sidebar` component to accept `hasSelectedOrg` prop and pass it through:

```tsx
export function Sidebar({
  role,
  variant = 'desktop',
  hasSelectedOrg,
}: {
  role: UserRole
  variant?: 'desktop' | 'inline'
  hasSelectedOrg?: boolean
}) {
  const pathname = usePathname()
  const navItems = getNavItems(role, hasSelectedOrg)
  // ... rest unchanged
```

**Step 2: Update `getMobileNavItems` in mobile-nav.tsx similarly**

Add `hasSelectedOrg` parameter, and when true for super_admin show dashboard + locations + reports + admin panel items.

**Step 3: Update the export of `getNavItems` to include the new signature**

**Step 4: Verify**

Run: `npx next lint src/components/layout/sidebar.tsx src/components/layout/mobile-nav.tsx`

**Step 5: Commit**

```bash
git add src/components/layout/sidebar.tsx src/components/layout/mobile-nav.tsx
git commit -m "feat: expand super_admin nav when org is selected"
```

---

## Task 4: Update Dashboard Layout to Allow Super Admin

**Files:**
- Modify: `src/app/(dashboard)/layout.tsx:11-16`

**Step 1: Allow super_admin in the requireRole call and handle org context**

Replace the current layout with:

```tsx
import { requireRole } from '@/lib/auth/require-role'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { AppShell } from '@/components/layout/app-shell'
import { AuthProvider } from '@/components/providers/auth-provider'
import { getSelectedOrgId } from '@/lib/org-switcher'
import { redirect } from 'next/navigation'

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

  // Determine the effective organization ID
  let effectiveOrgId = profile.organization_id
  let orgName = 'My Organization'

  if (profile.role === 'super_admin') {
    const selectedOrgId = await getSelectedOrgId()
    if (!selectedOrgId) {
      // Super admin needs to select an org to view dashboard
      redirect('/super-admin')
    }
    effectiveOrgId = selectedOrgId

    // Fetch org name using admin client (super_admin has no org_id for RLS)
    const admin = createAdminClient()
    const { data: org } = await admin
      .from('organizations')
      .select('name')
      .eq('id', selectedOrgId)
      .single()
    if (org) orgName = org.name
  } else if (profile.organization_id) {
    const supabase = await createClient()
    const { data: org } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', profile.organization_id)
      .single()
    if (org) orgName = org.name
  }

  return (
    <AuthProvider>
      <AppShell
        role={profile.role}
        orgName={orgName}
        userName={profile.full_name}
        selectedOrgId={effectiveOrgId}
      >
        {children}
      </AppShell>
    </AuthProvider>
  )
}
```

**Step 2: Commit**

```bash
git add src/app/(dashboard)/layout.tsx
git commit -m "feat: allow super_admin into dashboard layout with org context"
```

---

## Task 5: Thread Selected Org Through AppShell, Sidebar, Header

**Files:**
- Modify: `src/components/layout/app-shell.tsx`
- Modify: `src/components/layout/header.tsx`
- Modify: `src/components/layout/sidebar.tsx` (add OrgSwitcher rendering)

**Step 1: Add `selectedOrgId` prop to AppShell and pass to Sidebar/Header**

In `app-shell.tsx`, add `selectedOrgId?: string | null` to the props interface. Pass `hasSelectedOrg={!!selectedOrgId}` to `Sidebar` and `MobileNav`.

**Step 2: Render OrgSwitcher in Sidebar when role is super_admin**

In the `Sidebar` component, when `role === 'super_admin'`, render the `OrgSwitcher` component above the nav items. The org list will need to be fetched — pass it as a prop from the layout, or fetch client-side.

Approach: Add an `organizations` prop to Sidebar (optional, only passed for super_admin). The super-admin layout and dashboard layout fetch the org list and pass it down.

For AppShell:
```tsx
interface AppShellProps {
  children: ReactNode
  role: UserRole
  orgName: string
  userName: string
  selectedOrgId?: string | null
  organizations?: { id: string; name: string }[]
}
```

In Sidebar, render OrgSwitcher at the top when role is super_admin:
```tsx
{role === 'super_admin' && organizations && (
  <OrgSwitcher
    organizations={organizations}
    selectedOrgId={selectedOrgId ?? null}
    selectedOrgName={selectedOrgName ?? null}
  />
)}
```

**Step 3: Update the super-admin layout to also pass organizations and selectedOrgId**

In `src/app/(super-admin)/layout.tsx`, fetch all organizations and pass them through AppShell.

**Step 4: Update the dashboard layout to fetch and pass organizations for super_admin**

**Step 5: Verify**

Run: `npm run build` (check for type errors)

**Step 6: Commit**

```bash
git add src/components/layout/app-shell.tsx src/components/layout/header.tsx src/components/layout/sidebar.tsx src/app/(super-admin)/layout.tsx src/app/(dashboard)/layout.tsx
git commit -m "feat: thread org switcher through layout components"
```

---

## Task 6: Update Dashboard Queries to Support Super Admin Org Context

**Files:**
- Modify: `src/app/(dashboard)/dashboard/page.tsx:31-51`
- Modify: `src/lib/queries/dashboard-stats.ts:29-43`

**Step 1: Update dashboard page to use admin client when super_admin**

The dashboard page currently calls `createClient()` which uses the user's session (RLS-scoped). For super_admin, we need to use `createAdminClient()` and filter by the selected org ID.

Create a helper or modify the page:

```tsx
// In dashboard/page.tsx
const isSuperAdmin = profile.role === 'super_admin'
const selectedOrgId = isSuperAdmin ? await getSelectedOrgId() : null

let supabase
if (isSuperAdmin && selectedOrgId) {
  supabase = createAdminClient()
} else {
  supabase = await createClient()
}

const { stats, locations, recentInspections } = await getDashboardStats(
  supabase,
  isSuperAdmin ? selectedOrgId : undefined
)
```

**Step 2: Update `getDashboardStats` to accept optional `orgId` filter**

Add `orgId?: string` parameter. When provided, add `.eq('organization_id', orgId)` to extinguisher and location queries:

```ts
export async function getDashboardStats(
  supabase: SupabaseClient,
  orgId?: string
): Promise<DashboardData> {
  let extQuery = supabase.from('extinguishers').select('id, status, location_id')
  let locQuery = supabase.from('locations').select('id, name, address')
  let inspQuery = supabase
    .from('inspections')
    .select('id, performed_at, result, extinguisher_id, inspection_type_id, extinguishers(barcode, location_id), inspection_types(name)')
    .order('performed_at', { ascending: false })
    .limit(10)

  if (orgId) {
    locQuery = locQuery.eq('organization_id', orgId)
    // extinguishers are scoped via location — need to join or filter by location_ids
    // Alternative: fetch locations first, then filter extinguishers by location_id
  }
  // ... rest of function
}
```

**Step 3: Apply similar pattern to all other dashboard sub-pages**

Each page under `(dashboard)/dashboard/` that queries data needs the same treatment:
- `locations/page.tsx` — filter locations by selected org
- `team/page.tsx` — filter users by selected org
- `reports/page.tsx` — filter by selected org
- `quotes/page.tsx` — filter by selected org
- `invoices/page.tsx` — filter by selected org
- `settings/page.tsx` — load selected org's settings

For each, the pattern is:
1. Check if super_admin via `getUser()`
2. If yes, use `createAdminClient()` + `getSelectedOrgId()` to scope queries
3. If no, use normal `createClient()` (RLS handles scoping)

**Step 4: Verify**

Run: `npm run build`

**Step 5: Commit**

```bash
git add src/app/(dashboard)/dashboard/ src/lib/queries/dashboard-stats.ts
git commit -m "feat: scope dashboard queries to selected org for super_admin"
```

---

## Task 7: Install Accordion Component (needed for Guide page)

**Files:**
- Create: `src/components/ui/accordion.tsx`

**Step 1: Add accordion component via shadcn**

Run: `npx shadcn@latest add accordion`

**Step 2: Verify the file was created**

Run: `ls src/components/ui/accordion.tsx`

**Step 3: Commit**

```bash
git add src/components/ui/accordion.tsx
git commit -m "feat: add shadcn accordion component"
```

---

## Task 8: Spotlight Tour — Core Component

**Files:**
- Create: `src/components/tutorial/spotlight-tour.tsx`
- Create: `src/components/tutorial/tour-step.tsx`

**Step 1: Create the tour step types and data**

```ts
// In spotlight-tour.tsx
export interface TourStep {
  selector: string        // CSS selector for target element
  title: string
  description: string
  placement?: 'top' | 'bottom' | 'left' | 'right'
}
```

**Step 2: Create the SpotlightTour component**

Core behavior:
- Renders a full-screen backdrop with a transparent "cutout" around the target element
- Uses `getBoundingClientRect()` to position the cutout
- Shows a popover (using shadcn Popover primitives or a simple positioned div) next to the cutout
- Navigation: Next, Back, Skip buttons + step counter
- On complete/skip, sets `localStorage.setItem(`tour_seen_${userId}`, 'true')`
- Re-renders on window resize to keep cutout aligned

The backdrop uses CSS `clip-path` or a semi-transparent overlay with a `box-shadow` trick:
```css
.spotlight-backdrop {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: transparent;
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.6);
  border-radius: 8px;
  pointer-events: none;
}
```

The popover is absolutely positioned relative to the viewport based on the target rect + placement.

**Step 3: Create TourStep popover component**

```tsx
// src/components/tutorial/tour-step.tsx
// Renders the tooltip-like card with title, description, step counter, and nav buttons
// Uses shadcn Card styling, Button components
```

**Step 4: Verify**

Run: `npx next lint src/components/tutorial/`

**Step 5: Commit**

```bash
git add src/components/tutorial/
git commit -m "feat: add SpotlightTour and TourStep components"
```

---

## Task 9: Tour Step Definitions Per Role

**Files:**
- Create: `src/components/tutorial/tour-definitions.ts`

**Step 1: Define tour steps for each role**

```ts
import type { TourStep } from './spotlight-tour'
import type { UserRole } from '@/lib/types/database'

const superAdminTour: TourStep[] = [
  {
    selector: '[data-tour="org-switcher"]',
    title: 'Organization Switcher',
    description: 'Select an organization to view and manage its data. You can switch between organizations at any time.',
    placement: 'right',
  },
  {
    selector: '[data-tour="nav-organizations"]',
    title: 'All Organizations',
    description: 'View, create, and manage all organizations in the system.',
    placement: 'right',
  },
  {
    selector: '[data-tour="global-stats"]',
    title: 'System Overview',
    description: 'Monitor total organizations, extinguishers, overdue items, and revenue across the entire system.',
    placement: 'bottom',
  },
  {
    selector: '[data-tour="nav-guide"]',
    title: 'Need Help?',
    description: 'Visit the Guide anytime for feature walkthroughs, role explanations, and step-by-step workflows.',
    placement: 'right',
  },
]

const orgAdminTour: TourStep[] = [
  {
    selector: '[data-tour="dashboard-stats"]',
    title: 'Dashboard Overview',
    description: 'See your compliance status at a glance — total extinguishers, compliant, due soon, and overdue.',
    placement: 'bottom',
  },
  {
    selector: '[data-tour="nav-locations"]',
    title: 'Locations',
    description: 'Manage your facility locations and the fire extinguishers at each one.',
    placement: 'right',
  },
  {
    selector: '[data-tour="nav-team"]',
    title: 'Team Management',
    description: 'Invite technicians, facility managers, and auditors. Manage roles and permissions.',
    placement: 'right',
  },
  {
    selector: '[data-tour="nav-reports"]',
    title: 'Reports',
    description: 'Generate compliance reports, download inspection certificates, and track inspection history.',
    placement: 'right',
  },
  {
    selector: '[data-tour="nav-quotes"]',
    title: 'Quotes & Invoices',
    description: 'Create quotes for clients and convert them to invoices. Track payment status.',
    placement: 'right',
  },
  {
    selector: '[data-tour="nav-settings"]',
    title: 'Settings',
    description: 'Configure your organization name, logo, and inspection requirements.',
    placement: 'right',
  },
  {
    selector: '[data-tour="nav-guide"]',
    title: 'Guide',
    description: 'Full feature guide with workflows. Come back anytime!',
    placement: 'right',
  },
]

// Similar arrays for facility_manager, technician, auditor (shorter)

export function getTourSteps(role: UserRole): TourStep[] {
  switch (role) {
    case 'super_admin': return superAdminTour
    case 'org_admin': return orgAdminTour
    case 'facility_manager': return facilityManagerTour
    case 'technician': return technicianTour
    case 'auditor': return auditorTour
    default: return []
  }
}
```

**Step 2: Add `data-tour` attributes to sidebar nav items and key dashboard elements**

In `sidebar.tsx`, add `data-tour={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}` to each nav Link.

In the super-admin and dashboard pages, add `data-tour` attributes to stat card containers and other key sections.

**Step 3: Commit**

```bash
git add src/components/tutorial/tour-definitions.ts src/components/layout/sidebar.tsx
git commit -m "feat: add tour step definitions and data-tour attributes"
```

---

## Task 10: Tour Auto-Start Integration

**Files:**
- Create: `src/components/tutorial/tour-provider.tsx`
- Modify: `src/components/layout/app-shell.tsx`

**Step 1: Create TourProvider wrapper**

```tsx
// src/components/tutorial/tour-provider.tsx
'use client'

import { useEffect, useState } from 'react'
import { SpotlightTour } from './spotlight-tour'
import { getTourSteps } from './tour-definitions'
import type { UserRole } from '@/lib/types/database'

export function TourProvider({ role, userId }: { role: UserRole; userId: string }) {
  const [showTour, setShowTour] = useState(false)

  useEffect(() => {
    const key = `tour_seen_${userId}`
    if (!localStorage.getItem(key)) {
      // Small delay to let the page render and elements mount
      const timer = setTimeout(() => setShowTour(true), 800)
      return () => clearTimeout(timer)
    }
  }, [userId])

  if (!showTour) return null

  return (
    <SpotlightTour
      steps={getTourSteps(role)}
      onComplete={() => {
        localStorage.setItem(`tour_seen_${userId}`, 'true')
        setShowTour(false)
      }}
      onSkip={() => {
        localStorage.setItem(`tour_seen_${userId}`, 'true')
        setShowTour(false)
      }}
    />
  )
}
```

**Step 2: Add TourProvider to AppShell**

In `app-shell.tsx`, add `userId` prop and render `<TourProvider role={role} userId={userId} />` inside the shell.

**Step 3: Pass userId from layouts**

Both dashboard layout and super-admin layout pass `authUser.id` or `profile.id` through AppShell.

**Step 4: Verify**

Run: `npm run dev` — navigate to dashboard, tour should auto-start on first visit.

**Step 5: Commit**

```bash
git add src/components/tutorial/tour-provider.tsx src/components/layout/app-shell.tsx src/app/(dashboard)/layout.tsx src/app/(super-admin)/layout.tsx
git commit -m "feat: auto-start spotlight tour on first login"
```

---

## Task 11: Guide Page — Features Section

**Files:**
- Create: `src/components/tutorial/guide-page.tsx`
- Create: `src/app/(dashboard)/dashboard/guide/page.tsx`
- Create: `src/app/(super-admin)/super-admin/guide/page.tsx`

**Step 1: Create the main GuidePage component**

This is a shared client component used by both route pages. It renders:
- Welcome header with "Restart Tour" button
- Tabbed interface: Features | Roles | Workflows
- Features tab: expandable cards for each feature area using Accordion

```tsx
// src/components/tutorial/guide-page.tsx
'use client'

import { useState } from 'react'
import { BookOpen, RotateCcw, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import type { UserRole } from '@/lib/types/database'

// Feature definitions, role comparison data, workflow steps
// all defined inline in this file

interface GuidePageProps {
  role: UserRole
  userId: string
}

export function GuidePage({ role, userId }: GuidePageProps) {
  const [showAll, setShowAll] = useState(false)

  function restartTour() {
    localStorage.removeItem(`tour_seen_${userId}`)
    window.location.reload()
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-heading flex items-center gap-2">
            <BookOpen className="size-6" />
            Guide
          </h1>
          <p className="text-muted-foreground mt-1">
            Learn how to use FE Tracker effectively.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={restartTour}>
          <RotateCcw className="size-3.5 mr-1.5" />
          Restart Tour
        </Button>
      </div>

      {/* Role filter toggle */}
      <div className="flex items-center gap-2">
        <Badge variant={showAll ? 'default' : 'outline'}>
          {showAll ? 'Showing All Features' : `Showing ${formatRole(role)} Features`}
        </Badge>
        <Button variant="ghost" size="sm" onClick={() => setShowAll(!showAll)}>
          {showAll ? 'Show my features' : 'Show all features'}
        </Button>
      </div>

      {/* Tabbed content */}
      <Tabs defaultValue="features">
        <TabsList>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
        </TabsList>

        <TabsContent value="features">
          {/* Expandable feature cards */}
        </TabsContent>

        <TabsContent value="roles">
          {/* Role comparison table */}
        </TabsContent>

        <TabsContent value="workflows">
          {/* Step-by-step workflow accordions */}
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

Features section includes cards for:
- Dashboard Overview (all roles)
- Locations Management (org_admin, facility_manager)
- Inspections (technician)
- Team Management (org_admin)
- Reports & Compliance (org_admin, facility_manager, auditor)
- Quotes & Invoices (org_admin)
- Organization Settings (org_admin)
- System Administration (super_admin)

Each card: icon, title, description, list of key actions, and a "Go to [Feature]" link button.

**Step 2: Create the dashboard guide route page**

```tsx
// src/app/(dashboard)/dashboard/guide/page.tsx
import { getUser } from '@/lib/auth/get-user'
import { redirect } from 'next/navigation'
import { GuidePage } from '@/components/tutorial/guide-page'

export default async function DashboardGuidePage() {
  const userData = await getUser()
  if (!userData) redirect('/login')
  return <GuidePage role={userData.profile.role} userId={userData.profile.id} />
}
```

**Step 3: Create the super-admin guide route page**

```tsx
// src/app/(super-admin)/super-admin/guide/page.tsx
import { requireRole } from '@/lib/auth/require-role'
import { GuidePage } from '@/components/tutorial/guide-page'

export default async function SuperAdminGuidePage() {
  const { profile } = await requireRole(['super_admin'])
  return <GuidePage role={profile.role} userId={profile.id} />
}
```

**Step 4: Commit**

```bash
git add src/components/tutorial/guide-page.tsx src/app/(dashboard)/dashboard/guide/ src/app/(super-admin)/super-admin/guide/
git commit -m "feat: add Guide page with features section"
```

---

## Task 12: Guide Page — Roles Comparison Section

**Files:**
- Modify: `src/components/tutorial/guide-page.tsx`

**Step 1: Add roles comparison data and render as a visual grid**

The roles tab shows a table/grid with:
- Rows: each feature area
- Columns: each role
- Cells: checkmark or dash

Use the existing Table component for this. Style with colored headers per role.

Also include a brief description card for each role explaining their purpose.

**Step 2: Commit**

```bash
git add src/components/tutorial/guide-page.tsx
git commit -m "feat: add roles comparison to guide page"
```

---

## Task 13: Guide Page — Workflows Section

**Files:**
- Modify: `src/components/tutorial/guide-page.tsx`

**Step 1: Add workflow definitions**

Each workflow is an array of steps with: title, description, link (optional), and role scope.

Workflows:
1. **Set up your first location** — org_admin: Go to Locations > Click "Add Location" > Enter name/address > Add extinguishers
2. **Run your first inspection** — technician: Go to Inspect > Scan QR code or select location > Complete checklist > Submit
3. **Generate a compliance report** — org_admin/facility_manager: Go to Reports > Select date range > Download PDF
4. **Create and send an invoice** — org_admin: Go to Quotes > Create quote > Convert to invoice > Send via email
5. **Review compliance as an auditor** — auditor: View compliance dashboard > Check location status > Download reports
6. **Manage organizations** — super_admin: Create org > Invite admin > Switch to org > Configure settings

**Step 2: Render workflows as interactive accordion cards**

Each workflow card:
- Expandable (using Accordion)
- Shows role badge
- Numbered steps with descriptions
- "Go to [page]" buttons that link to the relevant page
- Checkbox per workflow for progress tracking (localStorage: `guide_workflow_${id}_${userId}`)

**Step 3: Commit**

```bash
git add src/components/tutorial/guide-page.tsx
git commit -m "feat: add interactive workflows to guide page"
```

---

## Task 14: Add Guide to Sidebar Navigation

**Files:**
- Modify: `src/components/layout/sidebar.tsx:28-64`
- Modify: `src/components/layout/mobile-nav.tsx:25-58`

**Step 1: Add Guide nav item to all roles in `getNavItems`**

Add `{ label: 'Guide', href: '/dashboard/guide', icon: BookOpen }` (or `/super-admin/guide` for super_admin) as the last item in every role's nav array.

Import `BookOpen` from lucide-react.

**Step 2: Add Guide to mobile nav for all roles**

Same pattern in `getMobileNavItems`.

**Step 3: Verify**

Run: `npm run dev` — check sidebar shows Guide for all roles.

**Step 4: Commit**

```bash
git add src/components/layout/sidebar.tsx src/components/layout/mobile-nav.tsx
git commit -m "feat: add Guide link to sidebar and mobile nav for all roles"
```

---

## Task 15: Final Integration & Build Verification

**Files:**
- All modified files

**Step 1: Run full build**

Run: `npm run build`
Expected: Build succeeds with no errors.

**Step 2: Run lint**

Run: `npm run lint`
Expected: No lint errors.

**Step 3: Manual smoke test checklist**

- [ ] Login as super_admin — see org switcher in sidebar
- [ ] Select an org — sidebar expands with full nav, dashboard shows org data
- [ ] Clear org selection — redirected back to super-admin panel
- [ ] Spotlight tour auto-starts on first visit for each role
- [ ] Tour highlights correct elements, Next/Back/Skip work
- [ ] Guide page accessible from sidebar for all roles
- [ ] Features tab shows role-filtered content
- [ ] Roles tab shows comparison grid
- [ ] Workflows tab shows interactive steps with progress tracking
- [ ] "Restart Tour" button works
- [ ] Mobile nav updated correctly

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat: superadmin full access and interactive tutorial system"
```
