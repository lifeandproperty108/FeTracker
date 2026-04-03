# Superadmin Full Access & Interactive Tutorial System

**Date:** 2026-04-02
**Status:** Approved

## Problem

1. Super_admin cannot access org-level features (locations, inspections, reports, quotes, invoices, settings, team). They are gated out of `/dashboard` routes and have NULL `organization_id`.
2. No tutorial, onboarding, or help system exists in the app.

## Solution Overview

Two complementary features:
- **Organization Switcher** giving super_admin full access to all org-level features
- **Three-layer tutorial system** with first-login spotlight tour, dedicated guide page, and always-accessible sidebar link

---

## Part 1: Superadmin Organization Switcher & Full Access

### Components

- **`OrgSwitcher`** — combobox dropdown in super-admin sidebar listing all organizations. Selection stored in `selected_org_id` cookie.
- **`getSelectedOrg()`** — server-side utility reading the cookie; used by dashboard pages to scope queries when user is super_admin.

### Layout Changes

- `(dashboard)/layout.tsx` — allow `super_admin` role through (currently blocked)
- `(inspect)/layout.tsx` — already allows super_admin, no change needed

### Sidebar Changes

When super_admin has an org selected:
- Show full org_admin nav items: Locations, Team, Reports, Quotes, Invoices, Settings
- Show link back to `/super-admin` panel
- Org switcher visible at top of sidebar

When no org selected and on `/dashboard`:
- Show prompt to select an organization

### Data Layer

- All dashboard queries using `user.organization_id` get fallback to `selectedOrgId` when user is super_admin
- Super_admin already uses admin Supabase client (RLS bypass), so queries just need org ID passed explicitly

---

## Part 2: Spotlight Tour (First Login)

### Component

- **`SpotlightTour`** — backdrop overlay with cutout around target element + popover with title/description/nav buttons
- Built with shadcn Popover + custom CSS backdrop (no external library)

### Tour Definitions

JSON config per role defining steps: `{ selector, title, description, placement }`

**Role-tailored steps:**
- **super_admin:** org switcher → organizations list → global stats → guide page
- **org_admin:** dashboard overview → locations → team → inspections → reports → quotes/invoices → settings → guide
- **facility_manager:** dashboard → my locations → reports → guide
- **technician:** dashboard → inspect/scan → completing an inspection → guide
- **auditor:** dashboard → compliance overview → reports → guide

### Tour State

- `has_seen_tour` tracked in localStorage per user ID
- Auto-starts on first dashboard load
- Controls: Next, Back, Skip, step counter ("3 of 8")

---

## Part 3: Guide Page

### Route

- `/dashboard/guide` and `/super-admin/guide` (shared component, different layouts)
- New "Guide" nav item in sidebar for all roles (book/help icon)

### Page Structure

1. **Welcome header** with "Restart Tour" button
2. **Features section** — expandable cards per feature area:
   - Dashboard Overview, Locations, Inspections, Team Management, Reports & Compliance, Quotes & Invoices, Settings
   - Each card: icon, description, key actions
3. **Roles section** — visual comparison grid of all 5 roles with access checkmarks
4. **Workflows section** — interactive step-by-step accordions:
   - "Set up your first location" (org_admin)
   - "Run your first inspection" (technician)
   - "Generate a compliance report" (org_admin/facility_manager)
   - "Create and send an invoice" (org_admin)
   - "Review compliance as an auditor" (auditor)
   - "Manage organizations" (super_admin)
5. **Progress tracking** — localStorage checkboxes on workflows

### Role Filtering

- Each user sees features/workflows relevant to their role by default
- Toggle to "Show all features" available

### Interactive Elements

- Workflow steps link directly to relevant pages (e.g., "Go to Locations" button)
- Cards use shadcn Accordion and Card components
