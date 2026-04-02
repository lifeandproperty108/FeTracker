// ===========================================
// FE Tracker Database Types
// ===========================================

// Enums
export type UserRole = 'super_admin' | 'org_admin' | 'facility_manager' | 'technician' | 'auditor'
export type ExtinguisherType = 'water' | 'dry_chemical_stored' | 'dry_chemical_cartridge' | 'co2' | 'wet_chemical' | 'clean_agent' | 'dry_powder' | 'foam'
export type ExtinguisherStatus = 'compliant' | 'due_soon' | 'overdue' | 'out_of_service' | 'retired'
export type InspectionResult = 'pass' | 'fail'
export type NotificationType = '30_day' | '7_day' | 'overdue' | 'deficiency'
export type QuoteStatus = 'draft' | 'sent' | 'approved' | 'declined' | 'converted'
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue'

// ===========================================
// Table Interfaces
// ===========================================

export interface Organization {
  id: string
  name: string
  slug: string
  logo_url: string | null
  require_photo_on_failure: boolean
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  email: string
  full_name: string
  phone: string | null
  role: UserRole
  organization_id: string | null
  created_at: string
}

export interface Location {
  id: string
  organization_id: string
  name: string
  address: string | null
  facility_manager_id: string | null
  facility_manager_email: string | null
  created_at: string
}

export interface Extinguisher {
  id: string
  location_id: string
  organization_id: string
  barcode: string | null
  qr_code_url: string | null
  type: ExtinguisherType
  size: string | null
  manufacturer: string | null
  model_number: string | null
  serial_number: string | null
  manufacture_date: string | null
  install_date: string | null
  specific_location: string | null
  status: ExtinguisherStatus
  next_monthly_due: string | null
  next_annual_due: string | null
  next_6year_due: string | null
  next_12year_due: string | null
  created_at: string
}

export interface InspectionType {
  id: string
  name: string
  interval_months: number
  description: string | null
}

export interface ChecklistTemplate {
  id: string
  inspection_type_id: string
  extinguisher_type: ExtinguisherType
  item_label: string
  item_order: number
  is_critical: boolean
}

export interface Inspection {
  id: string
  extinguisher_id: string
  organization_id: string
  inspection_type_id: string
  technician_id: string
  performed_at: string
  result: InspectionResult
  notes: string | null
  created_at: string
}

export interface InspectionItem {
  id: string
  inspection_id: string
  checklist_template_id: string
  passed: boolean
  notes: string | null
  photo_url: string | null
}

export interface NotificationLog {
  id: string
  extinguisher_id: string
  notification_type: NotificationType
  sent_to: string
  sent_at: string
}

export interface Quote {
  id: string
  organization_id: string
  location_id: string | null
  quote_number: number
  status: QuoteStatus
  issued_date: string | null
  valid_until: string | null
  notes: string | null
  total_amount: number
  created_at: string
}

export interface Invoice {
  id: string
  organization_id: string
  quote_id: string | null
  invoice_number: number
  status: InvoiceStatus
  issued_date: string | null
  due_date: string | null
  notes: string | null
  total_amount: number
  created_at: string
}

export interface LineItem {
  id: string
  quote_id: string | null
  invoice_id: string | null
  description: string
  quantity: number
  unit_price: number
  amount: number
  inspection_id: string | null
  sort_order: number
}

export interface PendingInvitation {
  id: string
  email: string
  organization_id: string
  role: UserRole
  token: string
  expires_at: string
  accepted: boolean
  created_at: string
}

// ===========================================
// Utility / Joined Types
// ===========================================

// Extinguisher with its location info joined
export interface ExtinguisherWithLocation extends Extinguisher {
  location: Location
}

// Inspection with related data joined
export interface InspectionWithDetails extends Inspection {
  extinguisher: Extinguisher
  technician: User
  inspection_type: InspectionType
  items: InspectionItem[]
}

// Dashboard stats shape
export interface DashboardStats {
  total_extinguishers: number
  compliant_count: number
  due_soon_count: number
  overdue_count: number
  out_of_service_count: number
}
