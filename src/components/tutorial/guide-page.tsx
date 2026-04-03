'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  BookOpen,
  LayoutDashboard,
  MapPin,
  ClipboardList,
  Users,
  BarChart3,
  Receipt,
  Settings,
  Building2,
  ArrowRight,
  Check,
  Minus,
  Eye,
  EyeOff,
  RotateCcw,
  type LucideIcon,
} from 'lucide-react'
import type { UserRole } from '@/lib/types/database'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

// ---------------------------------------------------------------------------
// Types & Data
// ---------------------------------------------------------------------------

interface GuidePageProps {
  role: UserRole
  userId: string
}

const ROLE_COLORS: Record<UserRole, string> = {
  super_admin: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  org_admin: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  facility_manager: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  technician: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  auditor: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
}

const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  org_admin: 'Org Admin',
  facility_manager: 'Facility Manager',
  technician: 'Technician',
  auditor: 'Auditor',
}

function RoleBadge({ role }: { role: UserRole }) {
  return (
    <Badge className={`${ROLE_COLORS[role]} border-0 pointer-events-none`}>
      {ROLE_LABELS[role]}
    </Badge>
  )
}

// --- Features data ---

interface Feature {
  icon: LucideIcon
  title: string
  description: string
  actions: string[]
  link: string
  roles: UserRole[]
}

const FEATURES: Feature[] = [
  {
    icon: LayoutDashboard,
    title: 'Dashboard Overview',
    description:
      'Your home base. See compliance stats, location status, and recent inspections at a glance.',
    actions: [
      'View compliance percentages',
      'Check overdue extinguishers',
      'See recent inspections',
    ],
    link: '/dashboard',
    roles: ['super_admin', 'org_admin', 'facility_manager', 'technician', 'auditor'],
  },
  {
    icon: MapPin,
    title: 'Locations Management',
    description:
      'Manage your facility locations and the fire extinguishers at each one.',
    actions: [
      'Add new locations',
      'Add/edit extinguishers',
      'Generate QR code labels',
      'View extinguisher details',
    ],
    link: '/dashboard/locations',
    roles: ['org_admin', 'facility_manager'],
  },
  {
    icon: ClipboardList,
    title: 'Inspections',
    description:
      'Perform fire extinguisher inspections using QR codes or by selecting locations.',
    actions: [
      'Scan QR codes to start inspection',
      'Complete inspection checklists',
      'Attach photos for failed items',
      'View inspection history',
    ],
    link: '/inspect',
    roles: ['technician', 'org_admin'],
  },
  {
    icon: Users,
    title: 'Team Management',
    description: 'Invite team members and manage their roles and permissions.',
    actions: [
      'Invite users via email',
      'Assign roles (technician, facility manager, auditor)',
      'Manage pending invitations',
    ],
    link: '/dashboard/team',
    roles: ['org_admin'],
  },
  {
    icon: BarChart3,
    title: 'Reports & Compliance',
    description:
      'Generate compliance reports and download inspection certificates.',
    actions: [
      'Filter reports by date range',
      'Download PDF compliance reports',
      'View inspection certificates',
    ],
    link: '/dashboard/reports',
    roles: ['org_admin', 'facility_manager', 'auditor'],
  },
  {
    icon: Receipt,
    title: 'Quotes & Invoices',
    description:
      'Create quotes for inspection services and convert them to invoices.',
    actions: [
      'Create quotes with line items',
      'Convert quotes to invoices',
      'Track payment status',
      'Send invoices via email',
    ],
    link: '/dashboard/quotes',
    roles: ['org_admin'],
  },
  {
    icon: Settings,
    title: 'Organization Settings',
    description:
      "Configure your organization's profile and inspection requirements.",
    actions: [
      'Update organization name and logo',
      'Configure inspection photo requirements',
      'View organization slug',
    ],
    link: '/dashboard/settings',
    roles: ['org_admin'],
  },
  {
    icon: Building2,
    title: 'System Administration',
    description:
      'Manage all organizations, view global statistics, and oversee the entire system.',
    actions: [
      'Create new organizations',
      'View all organizations',
      'Monitor global compliance',
      'Switch between organizations',
    ],
    link: '/super-admin',
    roles: ['super_admin'],
  },
]

// --- Roles data ---

interface RoleInfo {
  role: UserRole
  description: string
}

const ROLE_DESCRIPTIONS: RoleInfo[] = [
  {
    role: 'super_admin',
    description:
      'System-wide administrator. Manages all organizations and oversees the entire platform.',
  },
  {
    role: 'org_admin',
    description:
      'Organization owner. Full control over locations, team, reports, quotes, invoices, and settings.',
  },
  {
    role: 'facility_manager',
    description:
      'Manages assigned locations and monitors compliance for their facilities.',
  },
  {
    role: 'technician',
    description:
      'Field inspector. Performs fire extinguisher inspections via mobile QR scanning.',
  },
  {
    role: 'auditor',
    description:
      'Read-only compliance reviewer. Views reports and compliance data without making changes.',
  },
]

const PERMISSION_AREAS = [
  'Dashboard',
  'Locations',
  'Inspections',
  'Team',
  'Reports',
  'Quotes/Invoices',
  'Settings',
  'System Admin',
] as const

const PERMISSIONS: Record<string, UserRole[]> = {
  Dashboard: ['super_admin', 'org_admin', 'facility_manager', 'technician', 'auditor'],
  Locations: ['org_admin', 'facility_manager'],
  Inspections: ['technician', 'org_admin'],
  Team: ['org_admin'],
  Reports: ['org_admin', 'facility_manager', 'auditor'],
  'Quotes/Invoices': ['org_admin'],
  Settings: ['org_admin'],
  'System Admin': ['super_admin'],
}

// --- Workflows data ---

interface WorkflowStep {
  text: string
  link?: string
}

interface Workflow {
  title: string
  roles: UserRole[]
  steps: WorkflowStep[]
}

const WORKFLOWS: Workflow[] = [
  {
    title: 'Set up your first location',
    roles: ['org_admin'],
    steps: [
      { text: 'Navigate to Locations from the sidebar', link: '/dashboard/locations' },
      { text: 'Click "Add Location" and enter the facility name and address' },
      { text: 'Open the new location and click "Add Extinguisher"' },
      { text: 'Fill in extinguisher details (type, barcode, location within facility)' },
      { text: 'Generate QR code labels for easy mobile scanning' },
    ],
  },
  {
    title: 'Run your first inspection',
    roles: ['technician'],
    steps: [
      { text: 'Go to Inspect from the sidebar or bottom nav', link: '/inspect' },
      { text: 'Scan a QR code on an extinguisher, or select a location manually' },
      { text: 'Complete the inspection checklist — pass or fail each item' },
      { text: 'If any items fail, attach a photo showing the issue' },
      { text: 'Submit the inspection — it is recorded and visible in reports' },
    ],
  },
  {
    title: 'Generate a compliance report',
    roles: ['org_admin', 'facility_manager'],
    steps: [
      { text: 'Navigate to Reports from the sidebar', link: '/dashboard/reports' },
      { text: 'Select a date range for the report period' },
      { text: 'Review compliance statistics and inspection history' },
      { text: 'Download the PDF compliance report for your records' },
    ],
  },
  {
    title: 'Create and send an invoice',
    roles: ['org_admin'],
    steps: [
      { text: 'Go to Quotes from the sidebar', link: '/dashboard/quotes' },
      { text: 'Click "New Quote" and add line items with descriptions and prices' },
      { text: 'Send the quote to your client for approval' },
      { text: 'Once approved, convert the quote to an invoice' },
      { text: 'Send the invoice via email — track payment status from the Invoices page' },
    ],
  },
  {
    title: 'Review compliance as an auditor',
    roles: ['auditor'],
    steps: [
      { text: 'Your Dashboard shows the compliance overview automatically' },
      { text: 'Navigate to Reports to see detailed inspection records', link: '/dashboard/reports' },
      { text: 'Filter by date range to focus on specific periods' },
      { text: 'Download compliance reports for external review' },
    ],
  },
  {
    title: 'Manage organizations (Super Admin)',
    roles: ['super_admin'],
    steps: [
      { text: 'From the Admin Panel, click "New Organization" to create one', link: '/super-admin' },
      { text: 'Invite an org admin by going to Team after selecting the org' },
      { text: 'Use the Organization Switcher in the sidebar to switch between orgs' },
      { text: 'Each org\'s dashboard, locations, and reports are fully accessible' },
    ],
  },
]

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function FeaturesTab({
  role,
  showAll,
}: {
  role: UserRole
  showAll: boolean
}) {
  const visible = showAll
    ? FEATURES
    : FEATURES.filter((f) => f.roles.includes(role))

  return (
    <Accordion className="space-y-3">
      {visible.map((feature, i) => {
        const Icon = feature.icon
        const accessible = feature.roles.includes(role)

        return (
          <AccordionItem
            key={feature.title}
            value={String(i)}
            className={`rounded-xl border border-border/60 bg-card px-4 transition-opacity ${
              !accessible ? 'opacity-50' : ''
            }`}
          >
            <AccordionTrigger className="py-4 hover:no-underline">
              <div className="flex items-center gap-3 pr-2">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400">
                  <Icon className="size-5" />
                </div>
                <div className="text-left">
                  <div className="font-heading font-semibold leading-snug">
                    {feature.title}
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pb-2">
                {!accessible && (
                  <p className="text-xs font-medium text-muted-foreground italic">
                    Not available for your role
                  </p>
                )}
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Key actions
                  </p>
                  <ul className="space-y-1.5">
                    {feature.actions.map((action) => (
                      <li key={action} className="flex items-start gap-2 text-sm">
                        <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-500" />
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-muted-foreground mr-1">Roles:</span>
                  {feature.roles.map((r) => (
                    <RoleBadge key={r} role={r} />
                  ))}
                </div>
                {accessible && (
                  <Button variant="outline" size="sm" render={<Link href={feature.link} />}>
                    Go to {feature.title}
                    <ArrowRight className="size-3.5" />
                  </Button>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        )
      })}
    </Accordion>
  )
}

function RolesTab() {
  const allRoles: UserRole[] = [
    'super_admin',
    'org_admin',
    'facility_manager',
    'technician',
    'auditor',
  ]

  return (
    <div className="space-y-6">
      {/* Role description cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ROLE_DESCRIPTIONS.map((info) => (
          <Card key={info.role} size="sm" className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <RoleBadge role={info.role} />
              </CardTitle>
              <CardDescription className="text-xs leading-relaxed">
                {info.description}
              </CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Permissions table */}
      <Card className="shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-40">Feature</TableHead>
                {allRoles.map((r) => (
                  <TableHead key={r} className="text-center">
                    <RoleBadge role={r} />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {PERMISSION_AREAS.map((area) => (
                <TableRow key={area}>
                  <TableCell className="font-medium">{area}</TableCell>
                  {allRoles.map((r) => (
                    <TableCell key={r} className="text-center">
                      {PERMISSIONS[area].includes(r) ? (
                        <Check className="mx-auto size-4 text-emerald-500" />
                      ) : (
                        <Minus className="mx-auto size-4 text-muted-foreground/40" />
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

function WorkflowsTab({
  role,
  userId,
  showAll,
}: {
  role: UserRole
  userId: string
  showAll: boolean
}) {
  const [completed, setCompleted] = useState<Record<number, boolean>>({})

  // Load completion state from localStorage
  useEffect(() => {
    const loaded: Record<number, boolean> = {}
    WORKFLOWS.forEach((_, idx) => {
      const key = `guide_workflow_${idx}_${userId}`
      if (typeof window !== 'undefined' && localStorage.getItem(key) === 'true') {
        loaded[idx] = true
      }
    })
    setCompleted(loaded)
  }, [userId])

  const toggleWorkflow = useCallback(
    (idx: number) => {
      setCompleted((prev) => {
        const next = { ...prev, [idx]: !prev[idx] }
        const key = `guide_workflow_${idx}_${userId}`
        if (next[idx]) {
          localStorage.setItem(key, 'true')
        } else {
          localStorage.removeItem(key)
        }
        return next
      })
    },
    [userId],
  )

  const visible = showAll
    ? WORKFLOWS
    : WORKFLOWS.filter((w) => w.roles.some((r) => r === role))

  return (
    <Accordion className="space-y-3">
      {visible.map((workflow, i) => {
        const accessible = workflow.roles.some((r) => r === role)
        const originalIdx = WORKFLOWS.indexOf(workflow)

        return (
          <AccordionItem
            key={workflow.title}
            value={String(i)}
            className={`rounded-xl border border-border/60 bg-card px-4 transition-opacity ${
              !accessible ? 'opacity-50' : ''
            }`}
          >
            <AccordionTrigger className="py-4 hover:no-underline">
              <div className="flex items-center gap-3 pr-2">
                <div
                  className={`flex size-9 shrink-0 items-center justify-center rounded-lg font-heading font-bold text-sm ${
                    completed[originalIdx]
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {completed[originalIdx] ? (
                    <Check className="size-5" />
                  ) : (
                    originalIdx + 1
                  )}
                </div>
                <div className="text-left">
                  <div className="font-heading font-semibold leading-snug flex items-center gap-2 flex-wrap">
                    {workflow.title}
                    {workflow.roles.map((r) => (
                      <RoleBadge key={r} role={r} />
                    ))}
                  </div>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pb-2">
                {!accessible && (
                  <p className="text-xs font-medium text-muted-foreground italic">
                    Not available for your role
                  </p>
                )}
                <ol className="space-y-3">
                  {workflow.steps.map((step, stepIdx) => (
                    <li key={stepIdx} className="flex items-start gap-3 text-sm">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-red-50 text-xs font-bold text-red-600 dark:bg-red-950/40 dark:text-red-400">
                        {stepIdx + 1}
                      </span>
                      <div className="flex flex-wrap items-center gap-2 pt-0.5">
                        <span>{step.text}</span>
                        {step.link && accessible && (
                          <Button
                            variant="ghost"
                            size="xs"
                            render={<Link href={step.link} />}
                          >
                            Go
                            <ArrowRight className="size-3" />
                          </Button>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
                {accessible && (
                  <button
                    type="button"
                    onClick={() => toggleWorkflow(originalIdx)}
                    className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                      completed[originalIdx]
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400'
                        : 'border-border bg-muted/50 text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <div
                      className={`flex size-4 items-center justify-center rounded border transition-colors ${
                        completed[originalIdx]
                          ? 'border-emerald-500 bg-emerald-500 text-white'
                          : 'border-muted-foreground/40'
                      }`}
                    >
                      {completed[originalIdx] && <Check className="size-3" />}
                    </div>
                    {completed[originalIdx] ? 'Completed' : 'Mark as completed'}
                  </button>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        )
      })}
    </Accordion>
  )
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function GuidePage({ role, userId }: GuidePageProps) {
  const [showAll, setShowAll] = useState(false)

  const handleRestartTour = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`tour_completed_${userId}`)
      window.location.reload()
    }
  }, [userId])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400">
            <BookOpen className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight font-heading">
              Guide
            </h1>
            <p className="text-sm text-muted-foreground">
              Learn how to get the most out of FE Tracker
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleRestartTour}>
          <RotateCcw className="size-3.5" />
          Restart Tour
        </Button>
      </div>

      {/* Role filter toggle */}
      <div className="flex items-center gap-3">
        <RoleBadge role={role} />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAll((s) => !s)}
        >
          {showAll ? (
            <>
              <EyeOff className="size-3.5" />
              Show my features
            </>
          ) : (
            <>
              <Eye className="size-3.5" />
              Show all features
            </>
          )}
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="features">
        <TabsList variant="line" className="mb-6">
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
        </TabsList>

        <TabsContent value="features">
          <FeaturesTab role={role} showAll={showAll} />
        </TabsContent>

        <TabsContent value="roles">
          <RolesTab />
        </TabsContent>

        <TabsContent value="workflows">
          <WorkflowsTab role={role} userId={userId} showAll={showAll} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
