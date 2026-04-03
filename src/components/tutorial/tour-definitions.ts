import type { UserRole } from '@/lib/types/database'

export interface TourStep {
  selector: string
  title: string
  description: string
  placement?: 'top' | 'bottom' | 'left' | 'right'
}

const superAdminSteps: TourStep[] = [
  {
    selector: '[data-tour="org-switcher"]',
    title: 'Organization Switcher',
    description:
      'Select an organization to view and manage its data. You can switch between organizations at any time.',
    placement: 'right',
  },
  {
    selector: '[data-tour="nav-organizations"]',
    title: 'All Organizations',
    description:
      'View, create, and manage all organizations in the system.',
    placement: 'right',
  },
  {
    selector: '[data-tour="nav-guide"]',
    title: 'Need Help?',
    description:
      'Visit the Guide anytime for feature walkthroughs, role explanations, and step-by-step workflows.',
    placement: 'right',
  },
]

const orgAdminSteps: TourStep[] = [
  {
    selector: '[data-tour="dashboard-stats"]',
    title: 'Dashboard Overview',
    description:
      'See your compliance status at a glance — total extinguishers, compliant, due soon, and overdue.',
    placement: 'bottom',
  },
  {
    selector: '[data-tour="nav-locations"]',
    title: 'Locations',
    description:
      'Manage your facility locations and the fire extinguishers at each one.',
    placement: 'right',
  },
  {
    selector: '[data-tour="nav-team"]',
    title: 'Team Management',
    description:
      'Invite technicians, facility managers, and auditors. Manage roles and permissions.',
    placement: 'right',
  },
  {
    selector: '[data-tour="nav-reports"]',
    title: 'Reports',
    description:
      'Generate compliance reports, download inspection certificates, and track inspection history.',
    placement: 'right',
  },
  {
    selector: '[data-tour="nav-quotes"]',
    title: 'Quotes & Invoices',
    description:
      'Create quotes for clients and convert them to invoices. Track payment status.',
    placement: 'right',
  },
  {
    selector: '[data-tour="nav-settings"]',
    title: 'Settings',
    description:
      'Configure your organization name, logo, and inspection requirements.',
    placement: 'right',
  },
  {
    selector: '[data-tour="nav-guide"]',
    title: 'Guide',
    description:
      'Full feature guide with workflows. Come back anytime!',
    placement: 'right',
  },
]

const facilityManagerSteps: TourStep[] = [
  {
    selector: '[data-tour="dashboard-stats"]',
    title: 'Dashboard Overview',
    description:
      'Monitor compliance across your assigned locations.',
    placement: 'bottom',
  },
  {
    selector: '[data-tour="nav-my-locations"]',
    title: 'My Locations',
    description:
      'View and manage the locations assigned to you.',
    placement: 'right',
  },
  {
    selector: '[data-tour="nav-reports"]',
    title: 'Reports',
    description:
      'View compliance reports for your locations.',
    placement: 'right',
  },
  {
    selector: '[data-tour="nav-guide"]',
    title: 'Guide',
    description:
      'Full feature guide with workflows. Come back anytime!',
    placement: 'right',
  },
]

const technicianSteps: TourStep[] = [
  {
    selector: '[data-tour="nav-inspect"]',
    title: 'Inspect',
    description:
      'Scan QR codes or select locations to perform fire extinguisher inspections.',
    placement: 'right',
  },
  {
    selector: '[data-tour="nav-dashboard"]',
    title: 'Dashboard',
    description:
      'View an overview of extinguisher statuses across your organization.',
    placement: 'right',
  },
  {
    selector: '[data-tour="nav-guide"]',
    title: 'Guide',
    description:
      'Full feature guide with workflows. Come back anytime!',
    placement: 'right',
  },
]

const auditorSteps: TourStep[] = [
  {
    selector: '[data-tour="nav-dashboard"]',
    title: 'Dashboard',
    description:
      'View the compliance overview for your organization.',
    placement: 'right',
  },
  {
    selector: '[data-tour="nav-reports"]',
    title: 'Reports',
    description:
      'Access read-only compliance reports and inspection records.',
    placement: 'right',
  },
  {
    selector: '[data-tour="nav-guide"]',
    title: 'Guide',
    description:
      'Full feature guide with workflows. Come back anytime!',
    placement: 'right',
  },
]

const tourStepsByRole: Record<UserRole, TourStep[]> = {
  super_admin: superAdminSteps,
  org_admin: orgAdminSteps,
  facility_manager: facilityManagerSteps,
  technician: technicianSteps,
  auditor: auditorSteps,
}

export function getTourSteps(role: UserRole): TourStep[] {
  return tourStepsByRole[role] ?? []
}
