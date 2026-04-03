import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUser } from '@/lib/auth/get-user'
import { getSelectedOrgId } from '@/lib/org-switcher'
import { sendEmail } from '@/lib/email/send'
import { createElement } from 'react'
import type { ExtinguisherStatus } from '@/lib/types/database'

interface InspectionItemPayload {
  checklist_template_id: string
  passed: boolean
  notes?: string | null
  photo_url?: string | null
}

interface InspectionPayload {
  extinguisher_id: string
  inspection_type_id: string
  items: InspectionItemPayload[]
  notes?: string | null
}

// Inline deficiency alert email component
function DeficiencyAlertEmail({
  extinguisherBarcode,
  inspectionTypeName,
  locationName,
  technicianName,
  failedItems,
  performedAt,
}: {
  extinguisherBarcode: string
  inspectionTypeName: string
  locationName: string
  technicianName: string
  failedItems: string[]
  performedAt: string
}) {
  return createElement(
    'div',
    {
      style: {
        fontFamily: 'Arial, sans-serif',
        maxWidth: '600px',
        margin: '0 auto',
        padding: '24px',
      },
    },
    createElement(
      'h2',
      { style: { color: '#dc2626', marginBottom: '16px' } },
      'Deficiency Alert — Fire Extinguisher Inspection'
    ),
    createElement(
      'p',
      { style: { marginBottom: '12px' } },
      `An inspection performed on ${performedAt} found deficiencies that require attention.`
    ),
    createElement(
      'table',
      {
        style: {
          width: '100%',
          borderCollapse: 'collapse' as const,
          marginBottom: '16px',
        },
      },
      createElement(
        'tbody',
        null,
        ...[
          ['Extinguisher', extinguisherBarcode],
          ['Inspection Type', inspectionTypeName],
          ['Location', locationName],
          ['Technician', technicianName],
        ].map(([label, val]) =>
          createElement(
            'tr',
            { key: label },
            createElement(
              'td',
              {
                style: {
                  padding: '8px',
                  borderBottom: '1px solid #e5e7eb',
                  fontWeight: 'bold',
                  width: '40%',
                },
              },
              label
            ),
            createElement(
              'td',
              {
                style: {
                  padding: '8px',
                  borderBottom: '1px solid #e5e7eb',
                },
              },
              val
            )
          )
        )
      )
    ),
    createElement(
      'h3',
      { style: { marginBottom: '8px' } },
      'Failed Items:'
    ),
    createElement(
      'ul',
      { style: { paddingLeft: '20px', marginBottom: '16px' } },
      ...failedItems.map((item) =>
        createElement('li', { key: item, style: { color: '#dc2626', marginBottom: '4px' } }, item)
      )
    ),
    createElement(
      'p',
      { style: { color: '#6b7280', fontSize: '12px' } },
      'This is an automated notification from FE Tracker.'
    )
  )
}

function addMonths(date: Date, months: number): string {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d.toISOString()
}

function addDays(date: Date, days: number): string {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d.toISOString()
}

function computeStatus(ext: {
  next_monthly_due: string | null
  next_annual_due: string | null
  next_6year_due: string | null
  next_12year_due: string | null
}): ExtinguisherStatus {
  const now = new Date()
  const soonThreshold = new Date()
  soonThreshold.setDate(soonThreshold.getDate() + 30)

  const dues = [
    ext.next_monthly_due,
    ext.next_annual_due,
    ext.next_6year_due,
    ext.next_12year_due,
  ].filter(Boolean) as string[]

  let hasOverdue = false
  let hasDueSoon = false

  for (const d of dues) {
    const date = new Date(d)
    if (date < now) hasOverdue = true
    else if (date < soonThreshold) hasDueSoon = true
  }

  if (hasOverdue) return 'overdue'
  if (hasDueSoon) return 'due_soon'
  return 'compliant'
}

export async function POST(request: NextRequest) {
  const userData = await getUser()
  if (!userData) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { profile } = userData

  const isSuperAdmin = profile.role === 'super_admin'
  const selectedOrgId = isSuperAdmin ? await getSelectedOrgId() : null
  const orgId = selectedOrgId ?? profile.organization_id

  if (!orgId) {
    return NextResponse.json({ error: 'No organization' }, { status: 400 })
  }

  let body: InspectionPayload
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Validate required fields
  const { extinguisher_id, inspection_type_id, items, notes } = body

  if (!extinguisher_id || typeof extinguisher_id !== 'string') {
    return NextResponse.json({ error: 'extinguisher_id is required' }, { status: 400 })
  }
  if (!inspection_type_id || typeof inspection_type_id !== 'string') {
    return NextResponse.json({ error: 'inspection_type_id is required' }, { status: 400 })
  }
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'items array is required' }, { status: 400 })
  }

  for (const item of items) {
    if (!item.checklist_template_id || typeof item.passed !== 'boolean') {
      return NextResponse.json(
        { error: 'Each item needs checklist_template_id and passed (boolean)' },
        { status: 400 }
      )
    }
  }

  const supabase = isSuperAdmin ? createAdminClient() : await createClient()
  const performedAt = new Date().toISOString()

  // Determine overall result
  const overallResult = items.some((i) => !i.passed) ? 'fail' : 'pass'

  // 1. Insert inspection
  const { data: inspection, error: inspError } = await supabase
    .from('inspections')
    .insert({
      extinguisher_id,
      organization_id: profile.organization_id,
      inspection_type_id,
      technician_id: profile.id,
      performed_at: performedAt,
      result: overallResult,
      notes: notes ?? null,
    })
    .select()
    .single()

  if (inspError || !inspection) {
    return NextResponse.json(
      { error: inspError?.message ?? 'Failed to create inspection' },
      { status: 500 }
    )
  }

  // 2. Insert inspection items
  const itemRows = items.map((item) => ({
    inspection_id: inspection.id,
    checklist_template_id: item.checklist_template_id,
    passed: item.passed,
    notes: item.notes ?? null,
    photo_url: item.photo_url ?? null,
  }))

  const { error: itemsError } = await supabase
    .from('inspection_items')
    .insert(itemRows)

  if (itemsError) {
    return NextResponse.json(
      { error: itemsError.message },
      { status: 500 }
    )
  }

  // 3. Look up inspection type name
  const { data: inspType } = await supabase
    .from('inspection_types')
    .select('name')
    .eq('id', inspection_type_id)
    .single()

  const typeName = inspType?.name ?? ''

  // 4. Look up checklist templates for critical item check
  const templateIds = items.filter((i) => !i.passed).map((i) => i.checklist_template_id)
  let hasCriticalFailure = false

  if (templateIds.length > 0) {
    const { data: failedTemplates } = await supabase
      .from('checklist_templates')
      .select('id, is_critical, item_label')
      .in('id', templateIds)

    hasCriticalFailure = (failedTemplates ?? []).some((t: { is_critical: boolean }) => t.is_critical)
  }

  // 5. Update extinguisher due dates based on cascading logic
  const now = new Date(performedAt)
  const dueDateUpdates: Record<string, string> = {}

  if (typeName === 'monthly_visual') {
    dueDateUpdates.next_monthly_due = addDays(now, 30)
  } else if (typeName === 'annual_maintenance') {
    dueDateUpdates.next_annual_due = addMonths(now, 12)
    dueDateUpdates.next_monthly_due = addDays(now, 30)
  } else if (typeName === 'six_year_internal') {
    dueDateUpdates.next_6year_due = addMonths(now, 72)
    dueDateUpdates.next_annual_due = addMonths(now, 12)
    dueDateUpdates.next_monthly_due = addDays(now, 30)
  } else if (typeName === 'twelve_year_hydrostatic') {
    dueDateUpdates.next_12year_due = addMonths(now, 144)
    dueDateUpdates.next_6year_due = addMonths(now, 72)
    dueDateUpdates.next_annual_due = addMonths(now, 12)
    dueDateUpdates.next_monthly_due = addDays(now, 30)
  }

  // 6. Determine new status
  let newStatus: ExtinguisherStatus
  if (hasCriticalFailure) {
    newStatus = 'out_of_service'
  } else {
    // Fetch current extinguisher to merge due dates
    const { data: currentExt } = await supabase
      .from('extinguishers')
      .select('next_monthly_due, next_annual_due, next_6year_due, next_12year_due')
      .eq('id', extinguisher_id)
      .single()

    const merged = {
      next_monthly_due: dueDateUpdates.next_monthly_due ?? currentExt?.next_monthly_due ?? null,
      next_annual_due: dueDateUpdates.next_annual_due ?? currentExt?.next_annual_due ?? null,
      next_6year_due: dueDateUpdates.next_6year_due ?? currentExt?.next_6year_due ?? null,
      next_12year_due: dueDateUpdates.next_12year_due ?? currentExt?.next_12year_due ?? null,
    }
    newStatus = computeStatus(merged)
  }

  // 7. Update extinguisher
  await supabase
    .from('extinguishers')
    .update({
      ...dueDateUpdates,
      status: newStatus,
    })
    .eq('id', extinguisher_id)

  // 8. Deficiency alert email (fire and forget)
  if (overallResult === 'fail') {
    sendDeficiencyAlert(supabase, {
      extinguisher_id,
      inspection_type_name: typeName,
      technician_name: profile.full_name,
      performed_at: performedAt,
      failed_items: items.filter((i) => !i.passed),
    }).catch((err) => {
      console.error('Deficiency alert email failed:', err)
    })
  }

  return NextResponse.json(inspection, { status: 201 })
}

async function sendDeficiencyAlert(
  supabase: Awaited<ReturnType<typeof createClient>>,
  info: {
    extinguisher_id: string
    inspection_type_name: string
    technician_name: string
    performed_at: string
    failed_items: InspectionItemPayload[]
  }
) {
  // Get extinguisher + location info
  const { data: ext } = await supabase
    .from('extinguishers')
    .select('barcode, location_id')
    .eq('id', info.extinguisher_id)
    .single()

  if (!ext) return

  const { data: location } = await supabase
    .from('locations')
    .select('name, facility_manager_email')
    .eq('id', ext.location_id)
    .single()

  if (!location?.facility_manager_email) return

  // Get failed item labels
  const templateIds = info.failed_items.map((i) => i.checklist_template_id)
  const { data: templates } = await supabase
    .from('checklist_templates')
    .select('id, item_label')
    .in('id', templateIds)

  const failedLabels = (templates ?? []).map((t: { item_label: string }) => t.item_label)

  const performedDate = new Date(info.performed_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  await sendEmail({
    to: location.facility_manager_email,
    subject: `Deficiency Alert — Extinguisher ${ext.barcode ?? 'Unknown'}`,
    react: createElement(DeficiencyAlertEmail, {
      extinguisherBarcode: ext.barcode ?? 'Unknown',
      inspectionTypeName: info.inspection_type_name.replace(/_/g, ' '),
      locationName: location.name,
      technicianName: info.technician_name,
      failedItems: failedLabels,
      performedAt: performedDate,
    }),
  })
}
