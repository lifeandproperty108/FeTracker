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

-- Organizations
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  require_photo_on_failure BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users (linked to auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'technician',
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Locations / Buildings
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  facility_manager_id UUID REFERENCES users(id) ON DELETE SET NULL,
  facility_manager_email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Extinguishers
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

-- Inspection Types (reference/seed data)
CREATE TABLE inspection_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  interval_months INTEGER NOT NULL,
  description TEXT
);

-- Checklist Templates
CREATE TABLE checklist_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_type_id UUID NOT NULL REFERENCES inspection_types(id) ON DELETE CASCADE,
  extinguisher_type extinguisher_type NOT NULL,
  item_label TEXT NOT NULL,
  item_order INTEGER NOT NULL,
  is_critical BOOLEAN DEFAULT FALSE
);

-- Inspections
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

-- Inspection Items (checklist results)
CREATE TABLE inspection_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
  checklist_template_id UUID NOT NULL REFERENCES checklist_templates(id),
  passed BOOLEAN NOT NULL,
  notes TEXT,
  photo_url TEXT
);

-- Notifications Log
CREATE TABLE notifications_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  extinguisher_id UUID NOT NULL REFERENCES extinguishers(id) ON DELETE CASCADE,
  notification_type notification_type NOT NULL,
  sent_to TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quotes
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

-- Invoices
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

-- Line Items (shared quotes/invoices)
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

-- Pending Invitations (for user invitation system)
CREATE TABLE pending_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
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
CREATE INDEX idx_pending_invitations_token ON pending_invitations(token);
CREATE INDEX idx_pending_invitations_email ON pending_invitations(email);

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
ALTER TABLE inspection_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_invitations ENABLE ROW LEVEL SECURITY;

-- Helper function: get current user's org_id
CREATE OR REPLACE FUNCTION auth.user_org_id()
RETURNS UUID AS $$
  SELECT organization_id FROM public.users WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Helper function: get current user's role
CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS user_role AS $$
  SELECT role FROM public.users WHERE id = auth.uid()
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
  WITH CHECK (TRUE); -- Controlled by application logic during signup/invite
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
CREATE POLICY "checklist_templates_select" ON checklist_templates FOR SELECT USING (true);

-- Pending invitations: org admins can see their org's invitations
CREATE POLICY "invitations_select" ON pending_invitations FOR SELECT
  USING (organization_id = auth.user_org_id());
CREATE POLICY "invitations_insert" ON pending_invitations FOR INSERT
  WITH CHECK (organization_id = auth.user_org_id() AND auth.user_role() IN ('org_admin', 'super_admin'));

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
