# FE Tracker Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a multi-tenant B2B web app for NFPA 10-compliant fire extinguisher maintenance tracking with inspections, notifications, reports, and invoicing.

**Architecture:** Next.js App Router monolith on Vercel, Supabase for Postgres + Auth + Storage + RLS-based multi-tenancy, Resend for transactional emails, shadcn/ui + Tailwind for a modern/minimal UI with red accent.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS, shadcn/ui, Supabase (Postgres + Auth + Storage), Resend, Vercel Cron, @react-pdf/renderer (PDF generation), html5-qrcode (QR scanning), qrcode (QR generation)

**Design Doc:** `docs/plans/2026-04-02-fe-tracker-design.md`

---

## Phase 1: Project Foundation

### Task 1: Scaffold Next.js Project

**Files:**
- Create: `package.json`, `next.config.ts`, `tailwind.config.ts`, `tsconfig.json`, `src/app/layout.tsx`, `src/app/page.tsx`

**Step 1: Create Next.js app**

```bash
cd "/Users/md/FE Tracker"
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-pnpm
```

**Step 2: Install core dependencies**

```bash
pnpm add @supabase/supabase-js @supabase/ssr resend
pnpm add @react-pdf/renderer html5-qrcode qrcode
pnpm add date-fns zod
pnpm add -D @types/qrcode supabase
```

**Step 3: Initialize shadcn/ui**

```bash
pnpm dlx shadcn@latest init
```

Choose: New York style, Zinc base color, CSS variables: yes. Then override the primary color to red in `src/app/globals.css`.

**Step 4: Install shadcn components we'll need**

```bash
pnpm dlx shadcn@latest add button card input label select textarea table badge dialog dropdown-menu sheet tabs separator avatar toast sonner command popover calendar form
```

**Step 5: Commit**

```bash
git init
git add -A
git commit -m "feat: scaffold Next.js project with Tailwind, shadcn/ui, and core deps"
```

---

### Task 2: Configure Supabase Client

**Files:**
- Create: `src/lib/supabase/client.ts` (browser client)
- Create: `src/lib/supabase/server.ts` (server client with cookies)
- Create: `src/lib/supabase/admin.ts` (service role client for Super Admin / cron)
- Create: `src/lib/supabase/middleware.ts` (auth refresh helper)
- Create: `.env.local.example`

**Step 1: Create `.env.local.example`**

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
RESEND_API_KEY=your-resend-key
CRON_SECRET=your-cron-secret
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Step 2: Create browser client** (`src/lib/supabase/client.ts`)

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**Step 3: Create server client** (`src/lib/supabase/server.ts`)

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from Server Component — ignore
          }
        },
      },
    }
  )
}
```

**Step 4: Create admin client** (`src/lib/supabase/admin.ts`)

```typescript
import { createClient } from '@supabase/supabase-js'

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
```

**Step 5: Create middleware helper** (`src/lib/supabase/middleware.ts`)

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Redirect unauthenticated users to login (except public routes)
  const publicPaths = ['/', '/login', '/accept-invite']
  const isPublic = publicPaths.some(p => request.nextUrl.pathname === p || request.nextUrl.pathname.startsWith(p + '/'))

  if (!user && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
```

**Step 6: Create root middleware** (`src/middleware.ts`)

```typescript
import { updateSession } from '@/lib/supabase/middleware'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
```

**Step 7: Commit**

```bash
git add -A
git commit -m "feat: configure Supabase clients (browser, server, admin, middleware)"
```

---

### Task 3: Database Schema — Supabase Migration

**Files:**
- Create: `supabase/migrations/001_schema.sql`

**Step 1: Initialize Supabase locally (optional, for migration tracking)**

```bash
pnpm supabase init
```

**Step 2: Write the full schema migration** (`supabase/migrations/001_schema.sql`)

```sql
-- ===========================================
-- FE Tracker Database Schema
-- ===========================================

-- Enums
CREATE TYPE user_role AS ENUM ('super_admin', 'org_admin', 'facility_manager', 'technician', 'auditor');
CREATE TYPE extinguisher_type AS ENUM ('water', 'dry_chemical_stored', 'dry_chemical_cartridge', 'co2', 'wet_chemical', 'clean_agent', 'dry_powder', 'foam');
CREATE TYPE extinguisher_status AS ENUM ('compliant', 'due_soon', 'overdue', 'out_of_service', 'retired');
CREATE TYPE inspection_result AS ENUM ('pass', 'fail');
CREATE TYPE notification_type AS ENUM ('30_day', '7_day', 'overdue', 'deficiency');
CREATE TYPE quote_status AS ENUM ('draft', 'sent', 'approved', 'declined', 'converted');
CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'paid', 'overdue');

-- ===========================================
-- Organizations
-- ===========================================
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  require_photo_on_failure BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- Users (linked to auth.users)
-- ===========================================
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'technician',
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- Locations / Buildings
-- ===========================================
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  facility_manager_id UUID REFERENCES users(id) ON DELETE SET NULL,
  facility_manager_email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- Extinguishers
-- ===========================================
CREATE TABLE extinguishers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  barcode TEXT,
  qr_code_url TEXT,
  type extinguisher_type NOT NULL,
  size TEXT,
  manufacturer TEXT,
  model_number TEXT,
  serial_number TEXT,
  manufacture_date DATE,
  install_date DATE,
  specific_location TEXT,
  status extinguisher_status DEFAULT 'compliant',
  next_monthly_due DATE,
  next_annual_due DATE,
  next_6year_due DATE,
  next_12year_due DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, barcode)
);

-- ===========================================
-- Inspection Types (reference/seed data)
-- ===========================================
CREATE TABLE inspection_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  interval_months INTEGER NOT NULL,
  description TEXT
);

-- ===========================================
-- Checklist Templates
-- ===========================================
CREATE TABLE checklist_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_type_id UUID NOT NULL REFERENCES inspection_types(id) ON DELETE CASCADE,
  extinguisher_type extinguisher_type NOT NULL,
  item_label TEXT NOT NULL,
  item_order INTEGER NOT NULL,
  is_critical BOOLEAN DEFAULT FALSE
);

-- ===========================================
-- Inspections
-- ===========================================
CREATE TABLE inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  extinguisher_id UUID NOT NULL REFERENCES extinguishers(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  inspection_type_id UUID NOT NULL REFERENCES inspection_types(id),
  technician_id UUID NOT NULL REFERENCES users(id),
  performed_at TIMESTAMPTZ DEFAULT NOW(),
  result inspection_result NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- Inspection Items (checklist results)
-- ===========================================
CREATE TABLE inspection_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
  checklist_template_id UUID NOT NULL REFERENCES checklist_templates(id),
  passed BOOLEAN NOT NULL,
  notes TEXT,
  photo_url TEXT
);

-- ===========================================
-- Notifications Log
-- ===========================================
CREATE TABLE notifications_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  extinguisher_id UUID NOT NULL REFERENCES extinguishers(id) ON DELETE CASCADE,
  notification_type notification_type NOT NULL,
  sent_to TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- Quotes
-- ===========================================
CREATE TABLE quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  quote_number SERIAL,
  status quote_status DEFAULT 'draft',
  issued_date DATE,
  valid_until DATE,
  notes TEXT,
  total_amount NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- Invoices
-- ===========================================
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL,
  invoice_number SERIAL,
  status invoice_status DEFAULT 'draft',
  issued_date DATE,
  due_date DATE,
  notes TEXT,
  total_amount NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- Line Items (shared quotes/invoices)
-- ===========================================
CREATE TABLE line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity NUMERIC(10,2) DEFAULT 1,
  unit_price NUMERIC(10,2) DEFAULT 0,
  amount NUMERIC(10,2) DEFAULT 0,
  inspection_id UUID REFERENCES inspections(id) ON DELETE SET NULL,
  sort_order INTEGER DEFAULT 0,
  CHECK (quote_id IS NOT NULL OR invoice_id IS NOT NULL)
);

-- ===========================================
-- Indexes
-- ===========================================
CREATE INDEX idx_users_org ON users(organization_id);
CREATE INDEX idx_locations_org ON locations(organization_id);
CREATE INDEX idx_extinguishers_org ON extinguishers(organization_id);
CREATE INDEX idx_extinguishers_location ON extinguishers(location_id);
CREATE INDEX idx_extinguishers_status ON extinguishers(status);
CREATE INDEX idx_extinguishers_next_monthly ON extinguishers(next_monthly_due);
CREATE INDEX idx_extinguishers_next_annual ON extinguishers(next_annual_due);
CREATE INDEX idx_extinguishers_next_6year ON extinguishers(next_6year_due);
CREATE INDEX idx_extinguishers_next_12year ON extinguishers(next_12year_due);
CREATE INDEX idx_inspections_org ON inspections(organization_id);
CREATE INDEX idx_inspections_extinguisher ON inspections(extinguisher_id);
CREATE INDEX idx_inspection_items_inspection ON inspection_items(inspection_id);
CREATE INDEX idx_notifications_extinguisher ON notifications_log(extinguisher_id);
CREATE INDEX idx_quotes_org ON quotes(organization_id);
CREATE INDEX idx_invoices_org ON invoices(organization_id);
CREATE INDEX idx_line_items_quote ON line_items(quote_id);
CREATE INDEX idx_line_items_invoice ON line_items(invoice_id);

-- ===========================================
-- Row Level Security
-- ===========================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE extinguishers ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE line_items ENABLE ROW LEVEL SECURITY;
-- inspection_types and checklist_templates are public read (reference data)

-- Helper function: get current user's org_id
CREATE OR REPLACE FUNCTION auth.user_org_id()
RETURNS UUID AS $$
  SELECT organization_id FROM users WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Helper function: get current user's role
CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS user_role AS $$
  SELECT role FROM users WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Organizations: users see only their own org
CREATE POLICY "org_select" ON organizations FOR SELECT
  USING (id = auth.user_org_id());
CREATE POLICY "org_update" ON organizations FOR UPDATE
  USING (id = auth.user_org_id() AND auth.user_role() = 'org_admin');

-- Users: see users in same org
CREATE POLICY "users_select" ON users FOR SELECT
  USING (organization_id = auth.user_org_id() OR id = auth.uid());
CREATE POLICY "users_insert" ON users FOR INSERT
  WITH CHECK (organization_id = auth.user_org_id() AND auth.user_role() = 'org_admin');
CREATE POLICY "users_update" ON users FOR UPDATE
  USING (id = auth.uid() OR (organization_id = auth.user_org_id() AND auth.user_role() = 'org_admin'));

-- Locations: scoped to org
CREATE POLICY "locations_select" ON locations FOR SELECT
  USING (organization_id = auth.user_org_id());
CREATE POLICY "locations_insert" ON locations FOR INSERT
  WITH CHECK (organization_id = auth.user_org_id() AND auth.user_role() IN ('org_admin', 'facility_manager'));
CREATE POLICY "locations_update" ON locations FOR UPDATE
  USING (organization_id = auth.user_org_id() AND auth.user_role() IN ('org_admin', 'facility_manager'));
CREATE POLICY "locations_delete" ON locations FOR DELETE
  USING (organization_id = auth.user_org_id() AND auth.user_role() = 'org_admin');

-- Extinguishers: scoped to org
CREATE POLICY "ext_select" ON extinguishers FOR SELECT
  USING (organization_id = auth.user_org_id());
CREATE POLICY "ext_insert" ON extinguishers FOR INSERT
  WITH CHECK (organization_id = auth.user_org_id());
CREATE POLICY "ext_update" ON extinguishers FOR UPDATE
  USING (organization_id = auth.user_org_id());
CREATE POLICY "ext_delete" ON extinguishers FOR DELETE
  USING (organization_id = auth.user_org_id() AND auth.user_role() = 'org_admin');

-- Inspections: scoped to org
CREATE POLICY "insp_select" ON inspections FOR SELECT
  USING (organization_id = auth.user_org_id());
CREATE POLICY "insp_insert" ON inspections FOR INSERT
  WITH CHECK (organization_id = auth.user_org_id() AND auth.user_role() IN ('technician', 'org_admin'));

-- Inspection Items: via inspection's org
CREATE POLICY "insp_items_select" ON inspection_items FOR SELECT
  USING (inspection_id IN (SELECT id FROM inspections WHERE organization_id = auth.user_org_id()));
CREATE POLICY "insp_items_insert" ON inspection_items FOR INSERT
  WITH CHECK (inspection_id IN (SELECT id FROM inspections WHERE organization_id = auth.user_org_id()));

-- Notifications Log: scoped to org via extinguisher
CREATE POLICY "notif_select" ON notifications_log FOR SELECT
  USING (extinguisher_id IN (SELECT id FROM extinguishers WHERE organization_id = auth.user_org_id()));

-- Quotes: scoped to org
CREATE POLICY "quotes_select" ON quotes FOR SELECT
  USING (organization_id = auth.user_org_id());
CREATE POLICY "quotes_insert" ON quotes FOR INSERT
  WITH CHECK (organization_id = auth.user_org_id());
CREATE POLICY "quotes_update" ON quotes FOR UPDATE
  USING (organization_id = auth.user_org_id());

-- Invoices: scoped to org
CREATE POLICY "invoices_select" ON invoices FOR SELECT
  USING (organization_id = auth.user_org_id());
CREATE POLICY "invoices_insert" ON invoices FOR INSERT
  WITH CHECK (organization_id = auth.user_org_id());
CREATE POLICY "invoices_update" ON invoices FOR UPDATE
  USING (organization_id = auth.user_org_id());

-- Line Items: via quote or invoice org
CREATE POLICY "line_items_select" ON line_items FOR SELECT
  USING (
    (quote_id IN (SELECT id FROM quotes WHERE organization_id = auth.user_org_id()))
    OR
    (invoice_id IN (SELECT id FROM invoices WHERE organization_id = auth.user_org_id()))
  );
CREATE POLICY "line_items_insert" ON line_items FOR INSERT
  WITH CHECK (
    (quote_id IN (SELECT id FROM quotes WHERE organization_id = auth.user_org_id()))
    OR
    (invoice_id IN (SELECT id FROM invoices WHERE organization_id = auth.user_org_id()))
  );
CREATE POLICY "line_items_update" ON line_items FOR UPDATE
  USING (
    (quote_id IN (SELECT id FROM quotes WHERE organization_id = auth.user_org_id()))
    OR
    (invoice_id IN (SELECT id FROM invoices WHERE organization_id = auth.user_org_id()))
  );
CREATE POLICY "line_items_delete" ON line_items FOR DELETE
  USING (
    (quote_id IN (SELECT id FROM quotes WHERE organization_id = auth.user_org_id()))
    OR
    (invoice_id IN (SELECT id FROM invoices WHERE organization_id = auth.user_org_id()))
  );

-- Public read access for reference tables
CREATE POLICY "inspection_types_select" ON inspection_types FOR SELECT USING (true);
ALTER TABLE inspection_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "checklist_templates_select" ON checklist_templates FOR SELECT USING (true);
ALTER TABLE checklist_templates ENABLE ROW LEVEL SECURITY;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: add Supabase schema migration with RLS policies"
```

---

### Task 4: Seed NFPA 10 Reference Data

**Files:**
- Create: `supabase/seed.sql`

**Step 1: Write seed data** (`supabase/seed.sql`)

This seeds `inspection_types` and `checklist_templates` for all extinguisher types per NFPA 10.

```sql
-- ===========================================
-- Inspection Types
-- ===========================================
INSERT INTO inspection_types (id, name, interval_months, description) VALUES
  ('11111111-0000-0000-0000-000000000001', 'monthly_visual', 1, 'Monthly visual inspection per NFPA 10 §7.2.1'),
  ('11111111-0000-0000-0000-000000000002', 'annual_maintenance', 12, 'Annual maintenance inspection per NFPA 10 §7.3'),
  ('11111111-0000-0000-0000-000000000003', 'six_year_internal', 72, '6-year internal examination per NFPA 10 §7.4'),
  ('11111111-0000-0000-0000-000000000004', 'twelve_year_hydrostatic', 144, '12-year hydrostatic test per NFPA 10 §7.5');

-- ===========================================
-- Monthly Visual Checklist (all types share same checklist)
-- ===========================================
-- We insert for each extinguisher_type; item_label and order are the same.
-- Using a DO block to avoid repeating 8x:

DO $$
DECLARE
  etype extinguisher_type;
  monthly_id UUID := '11111111-0000-0000-0000-000000000001';
  items TEXT[] := ARRAY[
    'Extinguisher in designated location',
    'No obstruction to access or visibility',
    'Operating instructions legible and facing outward',
    'Tamper seal and pull pin intact',
    'No visible physical damage, corrosion, or leakage',
    'Pressure gauge in operable range (green zone)',
    'Fullness verified by weight or heft'
  ];
  critical BOOLEAN[] := ARRAY[false, true, false, true, true, true, true];
  i INTEGER;
BEGIN
  FOR etype IN SELECT unnest(enum_range(NULL::extinguisher_type))
  LOOP
    FOR i IN 1..array_length(items, 1)
    LOOP
      -- Skip pressure gauge check for CO2 (no gauge)
      IF etype = 'co2' AND items[i] = 'Pressure gauge in operable range (green zone)' THEN
        CONTINUE;
      END IF;
      INSERT INTO checklist_templates (inspection_type_id, extinguisher_type, item_label, item_order, is_critical)
      VALUES (monthly_id, etype, items[i], i, critical[i]);
    END LOOP;
  END LOOP;
END $$;

-- ===========================================
-- Annual Maintenance — Dry Chemical (Stored Pressure)
-- ===========================================
INSERT INTO checklist_templates (inspection_type_id, extinguisher_type, item_label, item_order, is_critical) VALUES
  ('11111111-0000-0000-0000-000000000002', 'dry_chemical_stored', 'Pull pin removed, inspected, and replaced', 1, false),
  ('11111111-0000-0000-0000-000000000002', 'dry_chemical_stored', 'Tamper seal replaced', 2, false),
  ('11111111-0000-0000-0000-000000000002', 'dry_chemical_stored', 'Discharge hose inspected for cracks/blockage', 3, true),
  ('11111111-0000-0000-0000-000000000002', 'dry_chemical_stored', 'Nozzle clear and undamaged', 4, true),
  ('11111111-0000-0000-0000-000000000002', 'dry_chemical_stored', 'Cylinder condition — no dents, corrosion, or damage', 5, true),
  ('11111111-0000-0000-0000-000000000002', 'dry_chemical_stored', 'Pressure gauge reads in operable range', 6, true),
  ('11111111-0000-0000-0000-000000000002', 'dry_chemical_stored', 'Label/nameplate legible with correct info', 7, false),
  ('11111111-0000-0000-0000-000000000002', 'dry_chemical_stored', 'Mounting bracket secure, correct height', 8, false),
  ('11111111-0000-0000-0000-000000000002', 'dry_chemical_stored', 'Hydrostatic test date not expired', 9, true),
  ('11111111-0000-0000-0000-000000000002', 'dry_chemical_stored', 'Maintenance tag/label updated', 10, false);

-- Annual Maintenance — CO2
INSERT INTO checklist_templates (inspection_type_id, extinguisher_type, item_label, item_order, is_critical) VALUES
  ('11111111-0000-0000-0000-000000000002', 'co2', 'Weight verified within 10% of stamped weight', 1, true),
  ('11111111-0000-0000-0000-000000000002', 'co2', 'Discharge horn inspected for cracks', 2, true),
  ('11111111-0000-0000-0000-000000000002', 'co2', 'Cylinder condition — no dents, corrosion, or damage', 3, true),
  ('11111111-0000-0000-0000-000000000002', 'co2', 'Pull pin and tamper seal inspected and replaced', 4, false),
  ('11111111-0000-0000-0000-000000000002', 'co2', 'Label/nameplate legible with correct info', 5, false),
  ('11111111-0000-0000-0000-000000000002', 'co2', 'Mounting bracket secure, correct height', 6, false),
  ('11111111-0000-0000-0000-000000000002', 'co2', 'Conductivity test date not expired', 7, true),
  ('11111111-0000-0000-0000-000000000002', 'co2', 'Hydrostatic test date not expired', 8, true),
  ('11111111-0000-0000-0000-000000000002', 'co2', 'Maintenance tag/label updated', 9, false);

-- Annual Maintenance — Wet Chemical
INSERT INTO checklist_templates (inspection_type_id, extinguisher_type, item_label, item_order, is_critical) VALUES
  ('11111111-0000-0000-0000-000000000002', 'wet_chemical', 'Pull pin removed, inspected, and replaced', 1, false),
  ('11111111-0000-0000-0000-000000000002', 'wet_chemical', 'Tamper seal replaced', 2, false),
  ('11111111-0000-0000-0000-000000000002', 'wet_chemical', 'Discharge hose and wand inspected', 3, true),
  ('11111111-0000-0000-0000-000000000002', 'wet_chemical', 'Nozzle clear and undamaged', 4, true),
  ('11111111-0000-0000-0000-000000000002', 'wet_chemical', 'Cylinder condition — no dents, corrosion, or damage', 5, true),
  ('11111111-0000-0000-0000-000000000002', 'wet_chemical', 'Pressure gauge reads in operable range', 6, true),
  ('11111111-0000-0000-0000-000000000002', 'wet_chemical', 'Label/nameplate legible with correct info', 7, false),
  ('11111111-0000-0000-0000-000000000002', 'wet_chemical', 'Mounting bracket secure, correct height', 8, false),
  ('11111111-0000-0000-0000-000000000002', 'wet_chemical', 'Hydrostatic test date not expired', 9, true),
  ('11111111-0000-0000-0000-000000000002', 'wet_chemical', 'Maintenance tag/label updated', 10, false);

-- Annual Maintenance — Water
INSERT INTO checklist_templates (inspection_type_id, extinguisher_type, item_label, item_order, is_critical) VALUES
  ('11111111-0000-0000-0000-000000000002', 'water', 'Pull pin removed, inspected, and replaced', 1, false),
  ('11111111-0000-0000-0000-000000000002', 'water', 'Tamper seal replaced', 2, false),
  ('11111111-0000-0000-0000-000000000002', 'water', 'Discharge hose inspected for cracks/blockage', 3, true),
  ('11111111-0000-0000-0000-000000000002', 'water', 'Nozzle clear and undamaged', 4, true),
  ('11111111-0000-0000-0000-000000000002', 'water', 'Cylinder condition — no dents, corrosion, or damage', 5, true),
  ('11111111-0000-0000-0000-000000000002', 'water', 'Pressure gauge reads in operable range', 6, true),
  ('11111111-0000-0000-0000-000000000002', 'water', 'Label/nameplate legible with correct info', 7, false),
  ('11111111-0000-0000-0000-000000000002', 'water', 'Mounting bracket secure, correct height', 8, false),
  ('11111111-0000-0000-0000-000000000002', 'water', 'Hydrostatic test date not expired', 9, true),
  ('11111111-0000-0000-0000-000000000002', 'water', 'Maintenance tag/label updated', 10, false);

-- Annual Maintenance — Clean Agent
INSERT INTO checklist_templates (inspection_type_id, extinguisher_type, item_label, item_order, is_critical) VALUES
  ('11111111-0000-0000-0000-000000000002', 'clean_agent', 'Weight verified per manufacturer specs', 1, true),
  ('11111111-0000-0000-0000-000000000002', 'clean_agent', 'Pull pin and tamper seal inspected and replaced', 2, false),
  ('11111111-0000-0000-0000-000000000002', 'clean_agent', 'Discharge hose inspected for cracks/blockage', 3, true),
  ('11111111-0000-0000-0000-000000000002', 'clean_agent', 'Nozzle clear and undamaged', 4, true),
  ('11111111-0000-0000-0000-000000000002', 'clean_agent', 'Cylinder condition — no dents, corrosion, or damage', 5, true),
  ('11111111-0000-0000-0000-000000000002', 'clean_agent', 'Pressure gauge reads in operable range', 6, true),
  ('11111111-0000-0000-0000-000000000002', 'clean_agent', 'Label/nameplate legible with correct info', 7, false),
  ('11111111-0000-0000-0000-000000000002', 'clean_agent', 'Mounting bracket secure, correct height', 8, false),
  ('11111111-0000-0000-0000-000000000002', 'clean_agent', 'Hydrostatic test date not expired', 9, true),
  ('11111111-0000-0000-0000-000000000002', 'clean_agent', 'Maintenance tag/label updated', 10, false);

-- Annual Maintenance — Dry Chemical (Cartridge)
INSERT INTO checklist_templates (inspection_type_id, extinguisher_type, item_label, item_order, is_critical) VALUES
  ('11111111-0000-0000-0000-000000000002', 'dry_chemical_cartridge', 'Cartridge weight verified', 1, true),
  ('11111111-0000-0000-0000-000000000002', 'dry_chemical_cartridge', 'Pull pin and tamper seal inspected and replaced', 2, false),
  ('11111111-0000-0000-0000-000000000002', 'dry_chemical_cartridge', 'Discharge hose inspected for cracks/blockage', 3, true),
  ('11111111-0000-0000-0000-000000000002', 'dry_chemical_cartridge', 'Nozzle clear and undamaged', 4, true),
  ('11111111-0000-0000-0000-000000000002', 'dry_chemical_cartridge', 'Cylinder condition — no dents, corrosion, or damage', 5, true),
  ('11111111-0000-0000-0000-000000000002', 'dry_chemical_cartridge', 'Agent condition verified (no caking/clumping)', 6, true),
  ('11111111-0000-0000-0000-000000000002', 'dry_chemical_cartridge', 'Label/nameplate legible with correct info', 7, false),
  ('11111111-0000-0000-0000-000000000002', 'dry_chemical_cartridge', 'Mounting bracket secure, correct height', 8, false),
  ('11111111-0000-0000-0000-000000000002', 'dry_chemical_cartridge', 'Hydrostatic test date not expired', 9, true),
  ('11111111-0000-0000-0000-000000000002', 'dry_chemical_cartridge', 'Maintenance tag/label updated', 10, false);

-- Annual Maintenance — Dry Powder (Class D)
INSERT INTO checklist_templates (inspection_type_id, extinguisher_type, item_label, item_order, is_critical) VALUES
  ('11111111-0000-0000-0000-000000000002', 'dry_powder', 'Agent type verified for specific metal hazard', 1, true),
  ('11111111-0000-0000-0000-000000000002', 'dry_powder', 'Applicator/nozzle inspected and functional', 2, true),
  ('11111111-0000-0000-0000-000000000002', 'dry_powder', 'Cylinder condition — no dents, corrosion, or damage', 3, true),
  ('11111111-0000-0000-0000-000000000002', 'dry_powder', 'Agent quantity verified', 4, true),
  ('11111111-0000-0000-0000-000000000002', 'dry_powder', 'Label/nameplate legible with correct info', 5, false),
  ('11111111-0000-0000-0000-000000000002', 'dry_powder', 'Mounting bracket secure, correct height', 6, false),
  ('11111111-0000-0000-0000-000000000002', 'dry_powder', 'Maintenance tag/label updated', 7, false);

-- Annual Maintenance — Foam
INSERT INTO checklist_templates (inspection_type_id, extinguisher_type, item_label, item_order, is_critical) VALUES
  ('11111111-0000-0000-0000-000000000002', 'foam', 'Pull pin removed, inspected, and replaced', 1, false),
  ('11111111-0000-0000-0000-000000000002', 'foam', 'Tamper seal replaced', 2, false),
  ('11111111-0000-0000-0000-000000000002', 'foam', 'Discharge hose inspected for cracks/blockage', 3, true),
  ('11111111-0000-0000-0000-000000000002', 'foam', 'Nozzle clear and undamaged', 4, true),
  ('11111111-0000-0000-0000-000000000002', 'foam', 'Cylinder condition — no dents, corrosion, or damage', 5, true),
  ('11111111-0000-0000-0000-000000000002', 'foam', 'Pressure gauge reads in operable range', 6, true),
  ('11111111-0000-0000-0000-000000000002', 'foam', 'Foam agent expiration date verified', 7, true),
  ('11111111-0000-0000-0000-000000000002', 'foam', 'Label/nameplate legible with correct info', 8, false),
  ('11111111-0000-0000-0000-000000000002', 'foam', 'Mounting bracket secure, correct height', 9, false),
  ('11111111-0000-0000-0000-000000000002', 'foam', 'Hydrostatic test date not expired', 10, true),
  ('11111111-0000-0000-0000-000000000002', 'foam', 'Maintenance tag/label updated', 11, false);

-- ===========================================
-- 6-Year Internal Exam — Stored Pressure types only
-- ===========================================
INSERT INTO checklist_templates (inspection_type_id, extinguisher_type, item_label, item_order, is_critical) VALUES
  ('11111111-0000-0000-0000-000000000003', 'dry_chemical_stored', 'Unit discharged completely', 1, true),
  ('11111111-0000-0000-0000-000000000003', 'dry_chemical_stored', 'Internal cylinder examination — no corrosion, pitting, or thread damage', 2, true),
  ('11111111-0000-0000-0000-000000000003', 'dry_chemical_stored', 'Valve stem and components inspected', 3, true),
  ('11111111-0000-0000-0000-000000000003', 'dry_chemical_stored', 'O-rings and seals replaced', 4, false),
  ('11111111-0000-0000-0000-000000000003', 'dry_chemical_stored', 'Recharged with correct agent type and weight', 5, true),
  ('11111111-0000-0000-0000-000000000003', 'dry_chemical_stored', 'Hydrostatic test date re-verified', 6, true),
  ('11111111-0000-0000-0000-000000000003', 'dry_chemical_stored', 'New 6-year maintenance label affixed', 7, false);

INSERT INTO checklist_templates (inspection_type_id, extinguisher_type, item_label, item_order, is_critical) VALUES
  ('11111111-0000-0000-0000-000000000003', 'clean_agent', 'Unit discharged completely', 1, true),
  ('11111111-0000-0000-0000-000000000003', 'clean_agent', 'Internal cylinder examination — no corrosion, pitting, or thread damage', 2, true),
  ('11111111-0000-0000-0000-000000000003', 'clean_agent', 'Valve stem and components inspected', 3, true),
  ('11111111-0000-0000-0000-000000000003', 'clean_agent', 'O-rings and seals replaced', 4, false),
  ('11111111-0000-0000-0000-000000000003', 'clean_agent', 'Recharged with correct agent type and weight', 5, true),
  ('11111111-0000-0000-0000-000000000003', 'clean_agent', 'Hydrostatic test date re-verified', 6, true),
  ('11111111-0000-0000-0000-000000000003', 'clean_agent', 'New 6-year maintenance label affixed', 7, false);

-- ===========================================
-- 12-Year Hydrostatic — All rechargeable types
-- ===========================================
DO $$
DECLARE
  etype extinguisher_type;
  hydro_id UUID := '11111111-0000-0000-0000-000000000004';
  items TEXT[] := ARRAY[
    'Cylinder hydrostatically tested per CGA C-1',
    'Test pressure held for required duration',
    'No visible expansion, distortion, or leakage',
    'All internal components replaced as required',
    'Recharged with correct agent type and weight',
    'New hydrostatic test date label affixed',
    'Cylinder marked with test date, tester ID, and test pressure'
  ];
  critical BOOLEAN[] := ARRAY[true, true, true, true, true, false, false];
  i INTEGER;
BEGIN
  FOR etype IN SELECT unnest(enum_range(NULL::extinguisher_type))
  LOOP
    FOR i IN 1..array_length(items, 1)
    LOOP
      INSERT INTO checklist_templates (inspection_type_id, extinguisher_type, item_label, item_order, is_critical)
      VALUES (hydro_id, etype, items[i], i, critical[i]);
    END LOOP;
  END LOOP;
END $$;
```

**Step 2: Commit**

```bash
git add -A
git commit -m "feat: add NFPA 10 seed data for inspection types and checklist templates"
```

---

## Phase 2: Auth & Core Layout

### Task 5: TypeScript Types

**Files:**
- Create: `src/lib/types/database.ts`

**Step 1: Define all TypeScript types matching the schema**

```typescript
// Enums
export type UserRole = 'super_admin' | 'org_admin' | 'facility_manager' | 'technician' | 'auditor'
export type ExtinguisherType = 'water' | 'dry_chemical_stored' | 'dry_chemical_cartridge' | 'co2' | 'wet_chemical' | 'clean_agent' | 'dry_powder' | 'foam'
export type ExtinguisherStatus = 'compliant' | 'due_soon' | 'overdue' | 'out_of_service' | 'retired'
export type InspectionResult = 'pass' | 'fail'
export type NotificationType = '30_day' | '7_day' | 'overdue' | 'deficiency'
export type QuoteStatus = 'draft' | 'sent' | 'approved' | 'declined' | 'converted'
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue'

// Tables
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
```

**Step 2: Commit**

```bash
git add -A
git commit -m "feat: add TypeScript type definitions for database schema"
```

---

### Task 6: Auth Pages (Login + Invite Acceptance)

**Files:**
- Create: `src/app/login/page.tsx`
- Create: `src/app/login/actions.ts`
- Create: `src/app/accept-invite/[token]/page.tsx`
- Create: `src/app/auth/callback/route.ts`

**Step 1: Create login page** with email + password form using shadcn `Card`, `Input`, `Button`, `Label`.

**Step 2: Create login server actions** — `signIn` and `signUp` using `createClient()` from server.ts. On success, redirect based on user role:
- `super_admin` → `/super-admin`
- All others → `/dashboard`

**Step 3: Create auth callback route** for email confirmation redirect handling.

**Step 4: Create invite acceptance page** that:
- Reads invite token from URL
- Looks up the pending invitation
- Creates the user account via Supabase Auth
- Links them to the correct org + role
- Redirects to `/dashboard`

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add auth pages — login, invite acceptance, callback"
```

---

### Task 7: Auth Context & Role Guard

**Files:**
- Create: `src/lib/auth/get-user.ts` (server-side helper: fetches user + role from DB)
- Create: `src/lib/auth/require-role.ts` (server-side guard: throws/redirects if wrong role)
- Create: `src/components/providers/auth-provider.tsx` (client-side context for role/org)

**Step 1: Create `get-user.ts`** — fetches current auth user, then queries `users` table for role + org_id. Returns `{ user, profile }` or `null`.

**Step 2: Create `require-role.ts`** — accepts allowed roles array, calls `getUser()`, redirects to `/login` if not authed or to `/dashboard` if wrong role.

**Step 3: Create client-side `AuthProvider`** — wraps app, provides `{ user, role, organizationId }` via React context. Fetches on mount from `/api/auth/me` endpoint.

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add auth helpers — getUser, requireRole, AuthProvider"
```

---

### Task 8: App Shell — Sidebar Layout

**Files:**
- Create: `src/components/layout/sidebar.tsx`
- Create: `src/components/layout/mobile-nav.tsx`
- Create: `src/components/layout/app-shell.tsx`
- Create: `src/components/layout/header.tsx`
- Create: `src/app/(dashboard)/layout.tsx`
- Create: `src/app/(super-admin)/layout.tsx`

**Step 1: Create `app-shell.tsx`** — responsive layout wrapper:
- Desktop: left sidebar (240px) + main content
- Mobile: bottom nav + main content
- Header with user avatar, org name, role badge

**Step 2: Create `sidebar.tsx`** — role-aware navigation:
- Org Admin: Dashboard, Locations, Team, Reports, Quotes, Invoices, Settings
- Facility Manager: Dashboard, My Locations, Reports
- Technician: hidden (they use `/inspect`)
- Auditor: Dashboard, Reports (read-only badge)

**Step 3: Create `mobile-nav.tsx`** — bottom navigation bar for mobile with 4-5 icons.

**Step 4: Create dashboard layout** (`src/app/(dashboard)/layout.tsx`) — wraps with AppShell, calls `requireRole(['org_admin', 'facility_manager', 'technician', 'auditor'])`.

**Step 5: Create super-admin layout** (`src/app/(super-admin)/layout.tsx`) — wraps with AppShell (super-admin nav variant), calls `requireRole(['super_admin'])`.

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: add app shell — sidebar, mobile nav, role-aware layouts"
```

---

## Phase 3: Super Admin Features

### Task 9: Super Admin Dashboard

**Files:**
- Create: `src/app/(super-admin)/super-admin/page.tsx`
- Create: `src/app/(super-admin)/super-admin/organizations/page.tsx`
- Create: `src/app/(super-admin)/super-admin/organizations/[id]/page.tsx`
- Create: `src/app/(super-admin)/super-admin/organizations/new/page.tsx`
- Create: `src/app/api/organizations/route.ts`
- Create: `src/app/api/organizations/[id]/route.ts`

**Step 1: Create Super Admin dashboard page** — Server Component. Uses admin client (bypasses RLS). Shows:
- Stat cards: Total Orgs, Total Extinguishers, Global Overdue, Total Revenue
- Organizations table: name, location count, overdue count, last activity

**Step 2: Create "New Organization" page** — form for org name, slug (auto-generated from name), main contact email. On submit, creates org + invites Org Admin.

**Step 3: Create organization detail page** — Super Admin can view/edit any org, see their buildings, extinguishers, team. "Jump into" button sets a session override to view as that org.

**Step 4: Create API routes** for CRUD operations on organizations using admin client.

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add Super Admin dashboard and org management"
```

---

### Task 10: User Invitation System

**Files:**
- Create: `src/lib/invitations.ts` (invitation logic)
- Create: `src/app/api/invitations/route.ts`
- Create: `src/lib/email/templates/invite.tsx` (React email template)
- Create: `src/lib/email/send.ts` (Resend wrapper)

**Step 1: Create invitation logic** — generates a signed token, stores pending invitation in a `pending_invitations` table (add to migration: `id`, `email`, `organization_id`, `role`, `token`, `expires_at`, `accepted`).

**Step 2: Create Resend wrapper** (`send.ts`) — initializes Resend client, exports `sendEmail({ to, subject, react })`.

**Step 3: Create invite email template** — React component with FE Tracker branding, "You've been invited to [Org Name]" messaging, accept button linking to `/accept-invite/[token]`.

**Step 4: Create API route** — POST creates invitation + sends email. Only callable by `super_admin` or `org_admin`.

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add user invitation system with email via Resend"
```

---

## Phase 4: Org Dashboard & Location Management

### Task 11: Org Dashboard

**Files:**
- Create: `src/app/(dashboard)/dashboard/page.tsx`
- Create: `src/lib/queries/dashboard-stats.ts`

**Step 1: Create dashboard stats query** — fetches for current org:
- Total extinguishers count
- Count by status (compliant, due_soon, overdue, out_of_service)
- Recent inspections (last 10)
- Locations with their overdue counts

**Step 2: Create dashboard page** — Server Component showing:
- 4 stat cards (total, compliant %, due soon, overdue) with color coding
- Location list with status indicators (green/amber/red dots)
- Recent inspections feed

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: add org dashboard with compliance stats"
```

---

### Task 12: Location CRUD

**Files:**
- Create: `src/app/(dashboard)/dashboard/locations/page.tsx`
- Create: `src/app/(dashboard)/dashboard/locations/[id]/page.tsx`
- Create: `src/app/(dashboard)/dashboard/locations/new/page.tsx`
- Create: `src/components/locations/location-form.tsx`
- Create: `src/app/api/locations/route.ts`
- Create: `src/app/api/locations/[id]/route.ts`

**Step 1: Create locations list page** — table with name, address, facility manager, extinguisher count, overdue count. Add Location button.

**Step 2: Create location form** — name, address, assign facility manager (dropdown of org users with that role), facility manager email.

**Step 3: Create location detail page** — building info header + extinguisher table (next task fills this in). Tabs: Extinguishers, Inspections, Reports.

**Step 4: Create API routes** with RLS-scoped queries.

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add location/building management CRUD"
```

---

## Phase 5: Extinguisher Management

### Task 13: Extinguisher CRUD + QR Generation

**Files:**
- Create: `src/app/(dashboard)/dashboard/locations/[id]/extinguishers/new/page.tsx`
- Create: `src/app/(dashboard)/dashboard/extinguishers/[id]/page.tsx`
- Create: `src/components/extinguishers/extinguisher-form.tsx`
- Create: `src/components/extinguishers/extinguisher-table.tsx`
- Create: `src/lib/qr.ts` (QR generation utility)
- Create: `src/app/api/extinguishers/route.ts`
- Create: `src/app/api/extinguishers/[id]/route.ts`

**Step 1: Create QR generation utility** — uses `qrcode` package to generate a data URL encoding `{APP_URL}/inspect/extinguisher/{id}`. Stores the QR as a PNG in Supabase Storage.

**Step 2: Create extinguisher form** — type (dropdown), barcode, size, manufacturer, model, serial number, manufacture date, install date, specific location description. On create, auto-generates QR code.

**Step 3: Create extinguisher table component** — used on location detail page. Columns: barcode, type, specific location, status badge, next due date (earliest of all due dates), last inspected. Sortable + filterable by status and type.

**Step 4: Create extinguisher detail page** — unit info, status badge, all due dates displayed, inspection history table, QR code display + download button.

**Step 5: Create API routes** with RLS.

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: add extinguisher CRUD with QR code generation"
```

---

### Task 14: QR Label Printing

**Files:**
- Create: `src/components/extinguishers/qr-label-sheet.tsx`
- Create: `src/app/api/extinguishers/qr-labels/route.ts`

**Step 1: Create QR label sheet component** — generates a printable page of QR labels (Avery 5160 or similar layout). Each label has QR code + barcode text + specific location + extinguisher type.

**Step 2: Create API route** to generate label PDF for a location's extinguishers (or selected extinguishers).

**Step 3: Add "Print QR Labels" button to location detail page** — opens print dialog with formatted labels.

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add QR label sheet printing for extinguishers"
```

---

## Phase 6: Inspection System

### Task 15: Mobile Inspection Flow — Layout & Scanner

**Files:**
- Create: `src/app/(inspect)/layout.tsx` (mobile-optimized layout, no sidebar)
- Create: `src/app/(inspect)/inspect/page.tsx` (technician landing)
- Create: `src/app/(inspect)/inspect/scan/page.tsx` (QR scanner)
- Create: `src/app/(inspect)/inspect/location/[id]/page.tsx` (location extinguisher list)
- Create: `src/components/inspect/qr-scanner.tsx`

**Step 1: Create inspect layout** — mobile-first, no sidebar. Top bar with FE Tracker logo, back button. Bottom: simple nav (Scan, Locations, History).

**Step 2: Create technician landing page** — two big action cards: "Scan QR Code" and "Select Location". Recent inspections by this technician below.

**Step 3: Create QR scanner page** — uses `html5-qrcode` library. Full screen camera, overlay box. On scan, extracts extinguisher ID from URL, navigates to inspection form. "Enter ID manually" text input below.

**Step 4: Create location extinguisher list** — mobile card layout, sorted by most urgent due date first. Each card shows: barcode, type, location description, status badge, next due. Tap → go to inspection form.

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add mobile inspection layout, QR scanner, location list"
```

---

### Task 16: Inspection Checklist Form

**Files:**
- Create: `src/app/(inspect)/inspect/extinguisher/[id]/page.tsx`
- Create: `src/components/inspect/checklist-form.tsx`
- Create: `src/components/inspect/checklist-item.tsx`
- Create: `src/components/inspect/photo-capture.tsx`
- Create: `src/app/(inspect)/inspect/extinguisher/[id]/complete/page.tsx`
- Create: `src/app/api/inspections/route.ts`

**Step 1: Create inspection page** — Server Component loads extinguisher info + checklist template for the selected inspection type. Passes to client ChecklistForm.

**Step 2: Create ChecklistForm** — Client Component:
- Inspection type selector at top (monthly, annual, 6-year, 12-year — filtered by what's applicable to this extinguisher type)
- List of ChecklistItem components
- Notes textarea at bottom
- Sticky bottom bar: progress (X/Y items checked) + Submit button

**Step 3: Create ChecklistItem** — large card with:
- Item label text
- Big pass (green check) / fail (red X) toggle buttons
- On fail: expands notes input + PhotoCapture button
- If org `require_photo_on_failure` is true AND item failed, photo is required before submit

**Step 4: Create PhotoCapture** — Client Component that opens native camera via `<input type="file" accept="image/*" capture="environment">`. Previews photo, uploads to Supabase Storage on capture.

**Step 5: Create inspection API route** (POST `/api/inspections`):
- Validates all checklist items are filled
- Creates `inspections` record with overall result (fail if any item failed)
- Creates `inspection_items` records
- Updates extinguisher due dates (cascading logic per design doc)
- Updates extinguisher cached status
- If any critical item failed → set status to `out_of_service`
- If any failure + org has deficiency alerts → send immediate email to facility manager via Resend
- Returns success

**Step 6: Create completion page** — shows success message, inspection summary, link to "Inspect Next Unit" (returns to location list) or "Back to Home".

**Step 7: Commit**

```bash
git add -A
git commit -m "feat: add inspection checklist form with photo capture and due date logic"
```

---

## Phase 7: Notifications

### Task 17: Email Templates

**Files:**
- Create: `src/lib/email/templates/due-warning.tsx`
- Create: `src/lib/email/templates/deficiency-alert.tsx`

**Step 1: Create due warning email template** — React component (for Resend):
- Subject: varies by type (30-day, 7-day, overdue)
- Body: FE Tracker header, "Dear [Facility Manager Name]", list of extinguishers due/overdue with their type, location, and due date. Call-to-action: "View in FE Tracker" button.

**Step 2: Create deficiency alert template** — React component:
- Subject: "Alert: Fire Extinguisher Out of Service — [Building Name]"
- Body: extinguisher details, failed checklist items, technician who inspected, timestamp. "An extinguisher has been marked out of service and requires immediate attention."

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: add email templates for due warnings and deficiency alerts"
```

---

### Task 18: Cron Job — Due Date Checker

**Files:**
- Create: `src/app/api/cron/check-due-dates/route.ts`
- Create: `vercel.json` (cron schedule config)

**Step 1: Create cron API route** — GET handler, protected by `CRON_SECRET`:
```
1. Verify authorization header matches CRON_SECRET
2. Use admin client (bypasses RLS)
3. Query all extinguishers where any next_*_due falls in alert windows
4. Group by location → facility_manager_email
5. For each group:
   a. Check notifications_log for already-sent notifications today
   b. Determine notification type (30_day, 7_day, overdue)
   c. Send email via Resend using due-warning template
   d. Log to notifications_log
6. Recalculate and update cached status on all extinguishers
7. Return summary JSON
```

**Step 2: Create `vercel.json`** with cron config:
```json
{
  "crons": [
    {
      "path": "/api/cron/check-due-dates",
      "schedule": "0 8 * * *"
    }
  ]
}
```

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: add daily cron job for due date checking and email alerts"
```

---

## Phase 8: Reports & PDF Generation

### Task 19: Compliance Reports

**Files:**
- Create: `src/app/(dashboard)/dashboard/reports/page.tsx`
- Create: `src/components/reports/compliance-report.tsx` (React PDF document)
- Create: `src/components/reports/inspection-certificate.tsx` (React PDF document)
- Create: `src/app/api/reports/compliance/route.ts`
- Create: `src/app/api/reports/certificate/[inspectionId]/route.ts`

**Step 1: Create reports page** — date range picker, report type dropdown (Building Compliance Summary, Full Org Report, Unit History). Generate + preview button. Download PDF button.

**Step 2: Create compliance report PDF** using `@react-pdf/renderer`:
- Header: FE Tracker logo + org info + date range
- Summary section: total units, compliant %, overdue count
- Per-extinguisher table: ID, type, location, status, last inspection, next due dates
- Deficiency log: any failed items in date range
- Footer: "Generated by FE Tracker" + timestamp

**Step 3: Create inspection certificate PDF** — per-unit document:
- FE Tracker header
- Extinguisher details (type, serial, location)
- Inspection performed: date, type, technician name
- Result: PASS/FAIL
- Checklist summary
- Next due date
- Technician signature line

**Step 4: Create API routes** that generate and return PDFs as `application/pdf` response.

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add compliance reports and inspection certificates as PDF"
```

---

## Phase 9: Invoicing & Quotes

### Task 20: Quote Management

**Files:**
- Create: `src/app/(dashboard)/dashboard/quotes/page.tsx`
- Create: `src/app/(dashboard)/dashboard/quotes/new/page.tsx`
- Create: `src/app/(dashboard)/dashboard/quotes/[id]/page.tsx`
- Create: `src/components/billing/line-item-editor.tsx`
- Create: `src/components/billing/document-preview.tsx`
- Create: `src/app/api/quotes/route.ts`
- Create: `src/app/api/quotes/[id]/route.ts`

**Step 1: Create quotes list page** — table: quote number, org/client name, status badge, total, issued date. New Quote button.

**Step 2: Create new quote page** — select client org, optionally select location. Auto-populate line items from:
- Scheduled inspections (count of extinguishers by type × rate placeholder)
- Add custom line items (description, qty, unit price)
- Line item editor component: sortable rows, add/remove, auto-calculate amounts + total

**Step 3: Create quote detail page** — document-style preview + actions:
- Edit (if draft)
- Send (emails PDF to org admin of client org)
- Mark as Approved/Declined
- Convert to Invoice (copies all data to new invoice, sets quote status to `converted`)

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add quote management with line item editor"
```

---

### Task 21: Invoice Management

**Files:**
- Create: `src/app/(dashboard)/dashboard/invoices/page.tsx`
- Create: `src/app/(dashboard)/dashboard/invoices/[id]/page.tsx`
- Create: `src/components/billing/invoice-pdf.tsx` (React PDF)
- Create: `src/components/billing/quote-pdf.tsx` (React PDF)
- Create: `src/app/api/invoices/route.ts`
- Create: `src/app/api/invoices/[id]/route.ts`
- Create: `src/app/api/invoices/[id]/send/route.ts`
- Create: `src/lib/email/templates/invoice-email.tsx`

**Step 1: Create invoices list page** — table: invoice number, client, status badge, total, issued date, due date. Filters by status.

**Step 2: Create invoice detail page** — same document preview as quotes. Actions: Edit, Send (email with PDF attachment), Mark as Paid, Download PDF.

**Step 3: Create invoice PDF** using `@react-pdf/renderer`:
- FE Tracker header/branding
- From (service provider) and To (client org) blocks
- Invoice number, date, due date
- Line items table: description, qty, unit price, amount
- Total
- Payment terms/notes

**Step 4: Create quote PDF** — same layout as invoice but labeled "Quote" with valid-until date.

**Step 5: Create send invoice email template + API route** — attaches PDF, sends to org admin of client org.

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: add invoice management with PDF generation and email sending"
```

---

## Phase 10: Team Management & Settings

### Task 22: Team Management (Org Admin)

**Files:**
- Create: `src/app/(dashboard)/dashboard/team/page.tsx`
- Create: `src/components/team/invite-dialog.tsx`
- Create: `src/components/team/member-table.tsx`

**Step 1: Create team page** — shows all users in the org. Table: name, email, role, status (active/pending), last active. "Invite Team Member" button.

**Step 2: Create invite dialog** — email input, role selector (can only assign roles ≤ their own level: org_admin can invite all except super_admin). Sends invitation email.

**Step 3: Role management** — Org Admin can change roles of users in their org (except can't demote themselves or promote to super_admin).

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add team management and invitation for org admins"
```

---

### Task 23: Org Settings

**Files:**
- Create: `src/app/(dashboard)/dashboard/settings/page.tsx`

**Step 1: Create settings page** — Org Admin only:
- Organization name, slug
- Logo upload (Supabase Storage)
- `require_photo_on_failure` toggle
- Danger zone: nothing destructive in v1

**Step 2: Commit**

```bash
git add -A
git commit -m "feat: add org settings page"
```

---

## Phase 11: Auditor View

### Task 24: Read-Only Auditor Dashboard

**Files:**
- Create: `src/app/(dashboard)/audit/page.tsx`
- Create: `src/app/(dashboard)/audit/locations/[id]/page.tsx`
- Create: `src/app/(dashboard)/audit/extinguishers/[id]/page.tsx`

**Step 1: Create auditor dashboard** — same as org dashboard but:
- No edit/create/delete buttons anywhere
- "Read Only" badge in header
- Can view all locations, extinguishers, inspection history
- Can generate/download compliance reports
- Cannot access team, settings, quotes, invoices

**Step 2: Commit**

```bash
git add -A
git commit -m "feat: add read-only auditor view"
```

---

## Phase 12: Landing Page & Polish

### Task 25: Marketing Landing Page

**Files:**
- Create: `src/app/page.tsx` (update from scaffold)
- Create: `src/components/landing/hero.tsx`
- Create: `src/components/landing/features.tsx`
- Create: `src/components/landing/footer.tsx`

**Step 1: Create landing page** — modern/minimal with red accent:
- Hero: "NFPA 10 Compliant Fire Extinguisher Tracking" headline, "Built for fire safety professionals" subtext, Login CTA button
- Features grid: Multi-tenant, NFPA 10 Checklists, QR Scanning, Automated Alerts, Compliance Reports, Invoicing
- Footer: FE Tracker branding

**Step 2: Commit**

```bash
git add -A
git commit -m "feat: add marketing landing page"
```

---

### Task 26: Global Polish & Error Handling

**Files:**
- Create: `src/app/not-found.tsx`
- Create: `src/app/error.tsx`
- Create: `src/app/(dashboard)/loading.tsx`
- Create: `src/app/(super-admin)/loading.tsx`

**Step 1: Add loading states** — skeleton loaders using shadcn Skeleton component for dashboard, tables, forms.

**Step 2: Add error boundaries** — friendly error page with "Go back" button.

**Step 3: Add 404 page** — "Page not found" with link back to dashboard.

**Step 4: Review all pages for responsive behavior** — test at 375px, 768px, 1024px, 1440px.

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add loading states, error boundaries, 404 page"
```

---

## Deployment

### Task 27: Deploy to Vercel

**Step 1:** Connect repo to Vercel via `vercel link`.

**Step 2:** Set environment variables in Vercel dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `CRON_SECRET`
- `NEXT_PUBLIC_APP_URL`

**Step 3:** Run schema migration against Supabase project (via Supabase dashboard SQL editor or CLI).

**Step 4:** Run seed.sql to populate NFPA 10 reference data.

**Step 5:** Create Super Admin user manually in Supabase Auth + users table.

**Step 6:** Deploy: `vercel --prod`

**Step 7: Commit any deploy config changes**

```bash
git add -A
git commit -m "chore: configure Vercel deployment"
```
