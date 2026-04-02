# FE Tracker — Design Document

**Date:** 2026-04-02
**Status:** Approved

## Overview

FE Tracker is a multi-tenant B2B web application for tracking fire extinguisher maintenance in compliance with NFPA 10 standards. A fire safety service provider (Super Admin) manages multiple client organizations (school districts, corporate campuses), their buildings, extinguishers, inspections, and billing.

## Tech Stack

- **Frontend:** Next.js (App Router), React, Tailwind CSS, shadcn/ui
- **Database:** Supabase (PostgreSQL) with Row Level Security
- **Auth:** Supabase Auth
- **File Storage:** Supabase Storage (photos, PDFs)
- **Email:** Resend (transactional emails)
- **Hosting:** Vercel
- **Cron:** Vercel Cron Jobs

## Core Decisions

| Area | Decision |
|---|---|
| NFPA 10 Scope | Full lifecycle — monthly, annual, 6-year, 12-year, type-specific |
| Extinguisher Types | All NFPA 10 types (Water, Dry Chemical stored/cartridge, CO2, Wet Chemical, Clean Agent, Dry Powder, Foam) |
| Roles | Super Admin, Org Admin, Facility Manager, Technician, Auditor |
| Inspection Workflow | Checklist-based per NFPA 10, type-specific items |
| Field Identification | QR scanning + manual lookup fallback |
| Reports | Full compliance PDF reports + per-unit inspection certificates |
| Notifications | Due date warnings (30/7/overdue) + immediate deficiency alerts |
| Auth/Onboarding | Gated — Super Admin creates orgs, invites clients |
| Super Admin | Cross-org dashboard for the service provider |
| Offline | Online-only v1, architected for offline v2 |
| Photos | Optional by default, configurable to require on failures per org |
| Design | Modern/minimal, red accent (#DC2626), Inter font, generous whitespace |
| Invoicing | Auto-generated from inspections + custom line items, quote-to-invoice flow |

---

## 1. Database Schema

### Core Tables

**`organizations`** — Top-level tenants
- `id` (uuid, PK), `name`, `slug` (unique, for URLs), `logo_url`, `require_photo_on_failure` (boolean, default false), `created_at`, `updated_at`

**`users`** — All users, linked to Supabase Auth
- `id` (uuid, PK, matches auth.users.id), `email`, `full_name`, `phone`, `role` (enum: `super_admin`, `org_admin`, `facility_manager`, `technician`, `auditor`), `organization_id` (FK -> organizations, nullable for super_admin), `created_at`

**`locations`** — Buildings within an org
- `id` (uuid, PK), `organization_id` (FK), `name`, `address`, `facility_manager_id` (FK -> users), `facility_manager_email` (denormalized for cron efficiency), `created_at`

**`extinguishers`** — Individual units within a location
- `id` (uuid, PK), `location_id` (FK), `organization_id` (FK, denormalized for RLS), `barcode` (unique per org), `qr_code_url`, `type` (enum: `water`, `dry_chemical_stored`, `dry_chemical_cartridge`, `co2`, `wet_chemical`, `clean_agent`, `dry_powder`, `foam`), `size`, `manufacturer`, `model_number`, `serial_number`, `manufacture_date`, `install_date`, `specific_location` (text), `status` (enum: `compliant`, `due_soon`, `overdue`, `out_of_service`, `retired`), `next_monthly_due`, `next_annual_due`, `next_6year_due`, `next_12year_due`, `created_at`

**`inspection_types`** — Reference table for NFPA 10 inspection categories
- `id`, `name` (monthly_visual, annual_maintenance, six_year_internal, twelve_year_hydrostatic), `interval_months`, `description`

**`checklist_templates`** — Items to check per inspection type + extinguisher type
- `id`, `inspection_type_id` (FK), `extinguisher_type` (enum), `item_label`, `item_order`, `is_critical` (boolean)

**`inspections`** — Completed inspection records
- `id` (uuid, PK), `extinguisher_id` (FK), `organization_id` (FK, for RLS), `inspection_type_id` (FK), `technician_id` (FK -> users), `performed_at` (timestamp), `result` (enum: `pass`, `fail`), `notes`, `created_at`

**`inspection_items`** — Individual checklist results per inspection
- `id`, `inspection_id` (FK), `checklist_template_id` (FK), `passed` (boolean), `notes`, `photo_url`

**`notifications_log`** — Track sent emails to avoid duplicates
- `id`, `extinguisher_id` (FK), `notification_type` (enum: `30_day`, `7_day`, `overdue`, `deficiency`), `sent_to`, `sent_at`

### Invoicing Tables

**`quotes`**
- `id` (uuid, PK), `organization_id` (FK), `location_id` (FK, nullable), `quote_number` (sequential per org), `status` (enum: `draft`, `sent`, `approved`, `declined`, `converted`), `issued_date`, `valid_until`, `notes`, `total_amount`, `created_at`

**`invoices`**
- `id` (uuid, PK), `organization_id` (FK), `quote_id` (FK, nullable), `invoice_number` (sequential per org), `status` (enum: `draft`, `sent`, `paid`, `overdue`), `issued_date`, `due_date`, `notes`, `total_amount`, `created_at`

**`line_items`** — Shared between quotes and invoices
- `id`, `quote_id` (FK, nullable), `invoice_id` (FK, nullable), `description`, `quantity`, `unit_price`, `amount`, `inspection_id` (FK, nullable), `sort_order`

### Row Level Security

Every table with `organization_id` has RLS policies scoped to the authenticated user's org:

```sql
CREATE POLICY "Users can only see their org's data"
ON [table] FOR SELECT
USING (
  organization_id = (
    SELECT organization_id FROM users WHERE id = auth.uid()
  )
);
```

Super Admin bypasses RLS via the `service_role` key used only in server-side API routes.

---

## 2. Application Architecture

### Route Structure

```
/                           -> Marketing landing page
/login                      -> Supabase Auth
/accept-invite/:token       -> Invitation acceptance

/super-admin                -> Super Admin dashboard (cross-org)
/super-admin/organizations  -> Manage all orgs
/super-admin/organizations/[id] -> Jump into any org

/dashboard                  -> Org-level dashboard (role-aware)
/dashboard/locations        -> Buildings list
/dashboard/locations/[id]   -> Building detail + extinguisher list
/dashboard/extinguishers/[id] -> Unit detail + inspection history
/dashboard/team             -> User management (Org Admin only)
/dashboard/reports          -> Compliance reports + PDF export
/dashboard/settings         -> Org settings

/dashboard/quotes           -> Quote list
/dashboard/quotes/new       -> Create quote
/dashboard/quotes/[id]      -> Quote detail / edit / convert
/dashboard/invoices         -> Invoice list
/dashboard/invoices/[id]    -> Invoice detail / edit / send

/inspect                    -> Mobile technician landing
/inspect/scan               -> QR scanner
/inspect/location/[id]      -> Extinguisher list for location
/inspect/extinguisher/[id]  -> Inspection checklist form
/inspect/extinguisher/[id]/complete -> Summary + submit

/audit/[org-id]             -> Auditor read-only view
```

### Rendering Strategy

- **Server Components:** Dashboard pages, reports, data tables
- **Client Components:** Inspection checklist form, QR scanner, invoice/quote editor, photo upload
- **Middleware:** Auth check, role routing, org context extraction from JWT

### Key Data Flows

**Inspection submission:** Scan QR -> load checklist -> fill pass/fail per item -> attach photos -> submit -> update due dates -> trigger deficiency email if failures

**Quote-to-Invoice:** Create quote -> auto-populate from inspections -> add custom line items -> send -> client approves -> convert to invoice -> track payment

**Daily cron:** `/api/cron/check-due-dates` -> query all extinguishers with upcoming/overdue dates -> group by location/facility manager -> check notifications_log -> send via Resend -> log

---

## 3. UI Design

### Design Tokens

- **Primary/Accent:** Red-600 (#DC2626)
- **Background:** White (#FFFFFF), Gray-50 (#F9FAFB) panels
- **Text:** Gray-900 primary, Gray-500 secondary
- **Success:** Green-600 | **Warning:** Amber-500 | **Danger:** Red-600
- **Border radius:** rounded-lg (8px)
- **Font:** Inter
- **Component library:** shadcn/ui

### Responsive Breakpoints

- Desktop (1024px+): Sidebar nav, multi-column layouts
- Tablet (768-1023px): Collapsible sidebar, horizontal scroll tables
- Mobile (<768px): Bottom nav, single column, card-based lists, optimized for /inspect flow

### Key Screens

1. **Super Admin Dashboard** — Cards (total orgs, extinguishers, overdue, revenue) + org table
2. **Org Dashboard** — Cards (total, compliant, due soon, overdue) + location list + recent inspections
3. **Location Detail** — Building info + extinguisher table with filters
4. **Mobile Technician View** — Bottom nav, large tap targets, single column, color-coded list
5. **Inspection Checklist** — Card per item, large pass/fail toggles, photo capture, sticky submit bar
6. **QR Scanner** — Full-screen camera, overlay targeting box, manual fallback
7. **Reports** — Date range picker, report type selector, in-browser preview, PDF download
8. **Quote/Invoice Editor** — Document-style layout, auto-populated + custom line items, action bar

---

## 4. NFPA 10 Compliance Logic

### Inspection Schedule

| Inspection | Interval | Applies To |
|---|---|---|
| Monthly Visual | 30 days | All types |
| Annual Maintenance | 12 months | All types |
| 6-Year Internal | 72 months | Stored-pressure dry chemical, stored-pressure clean agent |
| 12-Year Hydrostatic | 144 months | All rechargeable types |
| Conductivity Test | 72 months | CO2 only |

### Due Date Cascading

Higher-level inspections reset all lower-level due dates:
- 12-year resets -> 6-year, annual, monthly
- 6-year resets -> annual, monthly
- Annual resets -> monthly

### Status Derivation

Computed and cached on extinguisher record:
1. Any open critical failure -> `out_of_service`
2. Any `next_*_due < NOW()` -> `overdue`
3. Any `next_*_due < NOW() + 30 days` -> `due_soon`
4. Else -> `compliant`

### Email Triggers

| Condition | Recipient | Timing |
|---|---|---|
| Due in 30 days | Facility Manager | Daily cron |
| Due in 7 days | Facility Manager | Daily cron |
| Overdue | Facility Manager + Org Admin | Daily cron |
| Critical failure | Facility Manager | Immediate on submit |

### Checklist Templates

Type-specific checklists per NFPA 10 requirements. Examples:
- **Monthly Visual (all):** Location, access, tamper seal, pressure gauge, damage, fullness (7 items)
- **Annual Dry Chemical:** Monthly items + pin inspection, hose, nozzle, cylinder, label, mounting, hydro date (10 items)
- **6-Year Internal:** Annual items + discharge, internal exam, valve components, seals, recharge, label (7 additional items)
- **Annual CO2:** Weight verification, discharge horn, no pressure gauge check, conductivity date

Full checklist item definitions will be seeded in the `checklist_templates` table.
