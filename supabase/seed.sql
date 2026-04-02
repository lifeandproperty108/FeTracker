-- ===========================================
-- NFPA 10 Seed Data
-- Inspection Types & Checklist Templates
-- ===========================================

-- -----------------------------------------------
-- 1. Inspection Types
-- -----------------------------------------------
INSERT INTO inspection_types (id, name, interval_months, description) VALUES
  ('11111111-0000-0000-0000-000000000001', 'monthly_visual',          1,   'Monthly visual inspection per NFPA 10 Section 7.2.1'),
  ('11111111-0000-0000-0000-000000000002', 'annual_maintenance',      12,  'Annual maintenance inspection per NFPA 10 Section 7.3'),
  ('11111111-0000-0000-0000-000000000003', 'six_year_internal',       72,  'Six-year internal examination per NFPA 10 Section 7.4'),
  ('11111111-0000-0000-0000-000000000004', 'twelve_year_hydrostatic', 144, 'Twelve-year hydrostatic test per NFPA 10 Section 7.5');

-- -----------------------------------------------
-- 2. Monthly Visual Checklist (all 8 types)
-- -----------------------------------------------
-- Items: location, access, operating instructions, tamper seal,
--        physical damage, pressure gauge (skip for CO2), fullness
-- Critical: access obstruction, tamper seal, damage, pressure, fullness

DO $$
DECLARE
  monthly_id UUID := '11111111-0000-0000-0000-000000000001';
  ext_types  TEXT[] := ARRAY['water','dry_chemical_stored','dry_chemical_cartridge','co2','wet_chemical','clean_agent','dry_powder','foam'];
  t TEXT;
  ord INTEGER;
BEGIN
  FOREACH t IN ARRAY ext_types
  LOOP
    ord := 1;

    INSERT INTO checklist_templates (inspection_type_id, extinguisher_type, item_label, item_order, is_critical)
    VALUES (monthly_id, t::extinguisher_type, 'Extinguisher in designated location', ord, false);
    ord := ord + 1;

    INSERT INTO checklist_templates (inspection_type_id, extinguisher_type, item_label, item_order, is_critical)
    VALUES (monthly_id, t::extinguisher_type, 'Access and visibility not obstructed', ord, true);
    ord := ord + 1;

    INSERT INTO checklist_templates (inspection_type_id, extinguisher_type, item_label, item_order, is_critical)
    VALUES (monthly_id, t::extinguisher_type, 'Operating instructions legible and facing outward', ord, false);
    ord := ord + 1;

    INSERT INTO checklist_templates (inspection_type_id, extinguisher_type, item_label, item_order, is_critical)
    VALUES (monthly_id, t::extinguisher_type, 'Tamper seal intact', ord, true);
    ord := ord + 1;

    INSERT INTO checklist_templates (inspection_type_id, extinguisher_type, item_label, item_order, is_critical)
    VALUES (monthly_id, t::extinguisher_type, 'No visible physical damage or corrosion', ord, true);
    ord := ord + 1;

    -- Pressure gauge: skip for CO2 (CO2 uses weight, not a gauge)
    IF t <> 'co2' THEN
      INSERT INTO checklist_templates (inspection_type_id, extinguisher_type, item_label, item_order, is_critical)
      VALUES (monthly_id, t::extinguisher_type, 'Pressure gauge in operable range', ord, true);
      ord := ord + 1;
    END IF;

    INSERT INTO checklist_templates (inspection_type_id, extinguisher_type, item_label, item_order, is_critical)
    VALUES (monthly_id, t::extinguisher_type, 'Fullness verified by hefting or weighing', ord, true);
  END LOOP;
END;
$$;

-- -----------------------------------------------
-- 3. Annual Maintenance Checklists (type-specific)
-- -----------------------------------------------

DO $$
DECLARE
  annual_id UUID := '11111111-0000-0000-0000-000000000002';

  -- Helper to insert a checklist item
  PROCEDURE add_item(p_type TEXT, p_label TEXT, p_order INT, p_critical BOOLEAN)
  LANGUAGE plpgsql AS $proc$
  BEGIN
    INSERT INTO checklist_templates (inspection_type_id, extinguisher_type, item_label, item_order, is_critical)
    VALUES (annual_id, p_type::extinguisher_type, p_label, p_order, p_critical);
  END;
  $proc$;

BEGIN
  -- dry_chemical_stored (10 items)
  CALL add_item('dry_chemical_stored', 'Pull pin operates freely',                       1,  true);
  CALL add_item('dry_chemical_stored', 'Tamper seal intact',                              2,  true);
  CALL add_item('dry_chemical_stored', 'Hose and fittings in good condition',             3,  true);
  CALL add_item('dry_chemical_stored', 'Nozzle clear and undamaged',                      4,  true);
  CALL add_item('dry_chemical_stored', 'Cylinder free of dents, corrosion, and damage',   5,  true);
  CALL add_item('dry_chemical_stored', 'Pressure gauge reads in operable range',          6,  true);
  CALL add_item('dry_chemical_stored', 'Label and nameplate legible',                     7,  false);
  CALL add_item('dry_chemical_stored', 'Mounting bracket secure and at proper height',    8,  false);
  CALL add_item('dry_chemical_stored', 'Hydrostatic test date verified and current',      9,  true);
  CALL add_item('dry_chemical_stored', 'Maintenance tag attached and current',            10, false);

  -- co2 (9 items)
  CALL add_item('co2', 'Weight within 10% of stamped weight',                   1,  true);
  CALL add_item('co2', 'Discharge horn intact and secure',                      2,  true);
  CALL add_item('co2', 'Cylinder free of dents, corrosion, and damage',         3,  true);
  CALL add_item('co2', 'Pull pin and tamper seal intact',                       4,  true);
  CALL add_item('co2', 'Label and nameplate legible',                           5,  false);
  CALL add_item('co2', 'Mounting bracket secure and at proper height',          6,  false);
  CALL add_item('co2', 'Conductivity test date verified and current',           7,  true);
  CALL add_item('co2', 'Hydrostatic test date verified and current',            8,  true);
  CALL add_item('co2', 'Maintenance tag attached and current',                  9,  false);

  -- wet_chemical (10 items)
  CALL add_item('wet_chemical', 'Pull pin operates freely',                       1,  true);
  CALL add_item('wet_chemical', 'Tamper seal intact',                             2,  true);
  CALL add_item('wet_chemical', 'Hose and wand in good condition',                3,  true);
  CALL add_item('wet_chemical', 'Nozzle clear and undamaged',                     4,  true);
  CALL add_item('wet_chemical', 'Cylinder free of dents, corrosion, and damage',  5,  true);
  CALL add_item('wet_chemical', 'Pressure gauge reads in operable range',         6,  true);
  CALL add_item('wet_chemical', 'Label and nameplate legible',                    7,  false);
  CALL add_item('wet_chemical', 'Mounting bracket secure and at proper height',   8,  false);
  CALL add_item('wet_chemical', 'Hydrostatic test date verified and current',     9,  true);
  CALL add_item('wet_chemical', 'Maintenance tag attached and current',           10, false);

  -- water (10 items)
  CALL add_item('water', 'Pull pin operates freely',                       1,  true);
  CALL add_item('water', 'Tamper seal intact',                             2,  true);
  CALL add_item('water', 'Hose and fittings in good condition',            3,  true);
  CALL add_item('water', 'Nozzle clear and undamaged',                     4,  true);
  CALL add_item('water', 'Cylinder free of dents, corrosion, and damage',  5,  true);
  CALL add_item('water', 'Pressure gauge reads in operable range',         6,  true);
  CALL add_item('water', 'Label and nameplate legible',                    7,  false);
  CALL add_item('water', 'Mounting bracket secure and at proper height',   8,  false);
  CALL add_item('water', 'Hydrostatic test date verified and current',     9,  true);
  CALL add_item('water', 'Maintenance tag attached and current',           10, false);

  -- clean_agent (10 items)
  CALL add_item('clean_agent', 'Weight verified against nameplate specification',   1,  true);
  CALL add_item('clean_agent', 'Pull pin and tamper seal intact',                   2,  true);
  CALL add_item('clean_agent', 'Hose and fittings in good condition',               3,  true);
  CALL add_item('clean_agent', 'Nozzle clear and undamaged',                        4,  true);
  CALL add_item('clean_agent', 'Cylinder free of dents, corrosion, and damage',     5,  true);
  CALL add_item('clean_agent', 'Pressure gauge reads in operable range',            6,  true);
  CALL add_item('clean_agent', 'Label and nameplate legible',                       7,  false);
  CALL add_item('clean_agent', 'Mounting bracket secure and at proper height',      8,  false);
  CALL add_item('clean_agent', 'Hydrostatic test date verified and current',        9,  true);
  CALL add_item('clean_agent', 'Maintenance tag attached and current',              10, false);

  -- dry_chemical_cartridge (10 items)
  CALL add_item('dry_chemical_cartridge', 'Cartridge weight verified within tolerance',       1,  true);
  CALL add_item('dry_chemical_cartridge', 'Pull pin and tamper seal intact',                  2,  true);
  CALL add_item('dry_chemical_cartridge', 'Hose and fittings in good condition',              3,  true);
  CALL add_item('dry_chemical_cartridge', 'Nozzle clear and undamaged',                       4,  true);
  CALL add_item('dry_chemical_cartridge', 'Cylinder free of dents, corrosion, and damage',    5,  true);
  CALL add_item('dry_chemical_cartridge', 'Agent condition verified (free-flowing, no clumps)', 6, true);
  CALL add_item('dry_chemical_cartridge', 'Label and nameplate legible',                      7,  false);
  CALL add_item('dry_chemical_cartridge', 'Mounting bracket secure and at proper height',     8,  false);
  CALL add_item('dry_chemical_cartridge', 'Hydrostatic test date verified and current',       9,  true);
  CALL add_item('dry_chemical_cartridge', 'Maintenance tag attached and current',             10, false);

  -- dry_powder (7 items)
  CALL add_item('dry_powder', 'Agent type verified appropriate for specific metal hazard',  1,  true);
  CALL add_item('dry_powder', 'Applicator in good condition and correct type',              2,  true);
  CALL add_item('dry_powder', 'Cylinder free of dents, corrosion, and damage',              3,  true);
  CALL add_item('dry_powder', 'Agent quantity verified by weight',                          4,  true);
  CALL add_item('dry_powder', 'Label and nameplate legible',                                5,  false);
  CALL add_item('dry_powder', 'Mounting bracket secure and at proper height',               6,  false);
  CALL add_item('dry_powder', 'Maintenance tag attached and current',                       7,  false);

  -- foam (11 items)
  CALL add_item('foam', 'Pull pin operates freely',                       1,  true);
  CALL add_item('foam', 'Tamper seal intact',                             2,  true);
  CALL add_item('foam', 'Hose and fittings in good condition',            3,  true);
  CALL add_item('foam', 'Nozzle clear and undamaged',                     4,  true);
  CALL add_item('foam', 'Cylinder free of dents, corrosion, and damage',  5,  true);
  CALL add_item('foam', 'Pressure gauge reads in operable range',         6,  true);
  CALL add_item('foam', 'Foam agent expiration date verified and current', 7, true);
  CALL add_item('foam', 'Label and nameplate legible',                    8,  false);
  CALL add_item('foam', 'Mounting bracket secure and at proper height',   9,  false);
  CALL add_item('foam', 'Hydrostatic test date verified and current',     10, true);
  CALL add_item('foam', 'Maintenance tag attached and current',           11, false);
END;
$$;

-- -----------------------------------------------
-- 4. Six-Year Internal Examination
--    Stored-pressure types only: dry_chemical_stored, clean_agent
-- -----------------------------------------------

DO $$
DECLARE
  sixyear_id UUID := '11111111-0000-0000-0000-000000000003';
  stored_types TEXT[] := ARRAY['dry_chemical_stored', 'clean_agent'];
  t TEXT;
BEGIN
  FOREACH t IN ARRAY stored_types
  LOOP
    INSERT INTO checklist_templates (inspection_type_id, extinguisher_type, item_label, item_order, is_critical) VALUES
      (sixyear_id, t::extinguisher_type, 'Extinguisher discharged and agent removed',                  1, true),
      (sixyear_id, t::extinguisher_type, 'Internal examination of cylinder — no corrosion or damage',  2, true),
      (sixyear_id, t::extinguisher_type, 'Valve and stem assembly inspected and functional',           3, true),
      (sixyear_id, t::extinguisher_type, 'O-rings and seals replaced',                                4, true),
      (sixyear_id, t::extinguisher_type, 'Recharged to correct weight and pressure',                  5, true),
      (sixyear_id, t::extinguisher_type, 'Hydrostatic test date verified still within 12-year cycle',  6, true),
      (sixyear_id, t::extinguisher_type, 'New 6-year internal examination label applied',             7, false);
  END LOOP;
END;
$$;

-- -----------------------------------------------
-- 5. Twelve-Year Hydrostatic Test (all 8 types)
-- -----------------------------------------------

DO $$
DECLARE
  hydro_id  UUID := '11111111-0000-0000-0000-000000000004';
  ext_types TEXT[] := ARRAY['water','dry_chemical_stored','dry_chemical_cartridge','co2','wet_chemical','clean_agent','dry_powder','foam'];
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ext_types
  LOOP
    INSERT INTO checklist_templates (inspection_type_id, extinguisher_type, item_label, item_order, is_critical) VALUES
      (hydro_id, t::extinguisher_type, 'Hydrostatic test performed per CGA C-1 / NFPA 10',          1, true),
      (hydro_id, t::extinguisher_type, 'Test pressure held for required duration without leakage',   2, true),
      (hydro_id, t::extinguisher_type, 'No permanent expansion beyond elastic limit',                3, true),
      (hydro_id, t::extinguisher_type, 'All components inspected and replaced as needed',            4, true),
      (hydro_id, t::extinguisher_type, 'Extinguisher recharged to correct specifications',           5, true),
      (hydro_id, t::extinguisher_type, 'New hydrostatic test label applied with date',               6, false),
      (hydro_id, t::extinguisher_type, 'Cylinder marked with test date, tester ID, and pressure',   7, false);
  END LOOP;
END;
$$;
