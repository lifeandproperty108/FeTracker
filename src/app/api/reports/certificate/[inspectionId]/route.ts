import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/get-user'
import {
  InspectionCertificate,
  type InspectionCertificateData,
  type CertificateChecklistItem,
} from '@/components/reports/inspection-certificate'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ inspectionId: string }> }
) {
  const { inspectionId } = await params

  const userData = await getUser()
  if (!userData) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { profile } = userData
  if (!profile.organization_id) {
    return NextResponse.json({ error: 'No organization' }, { status: 400 })
  }

  const supabase = await createClient()

  // Fetch inspection with related data
  const { data: inspection, error } = await supabase
    .from('inspections')
    .select(
      'id, performed_at, result, notes, inspection_type_id, technician_id, extinguisher_id'
    )
    .eq('id', inspectionId)
    .eq('organization_id', profile.organization_id)
    .single()

  if (error || !inspection) {
    return NextResponse.json({ error: 'Inspection not found' }, { status: 404 })
  }

  // Fetch related data in parallel
  const [extResult, techResult, typeResult, itemsResult] = await Promise.all([
    supabase
      .from('extinguishers')
      .select(
        'type, serial_number, barcode, specific_location, location_id, next_monthly_due, next_annual_due, next_6year_due, next_12year_due, locations(name)'
      )
      .eq('id', inspection.extinguisher_id)
      .single(),
    supabase
      .from('users')
      .select('full_name')
      .eq('id', inspection.technician_id)
      .single(),
    supabase
      .from('inspection_types')
      .select('name')
      .eq('id', inspection.inspection_type_id)
      .single(),
    supabase
      .from('inspection_items')
      .select('passed, notes, checklist_template_id')
      .eq('inspection_id', inspectionId),
  ])

  const ext = extResult.data
  const technician = techResult.data
  const inspType = typeResult.data
  const items = itemsResult.data ?? []

  // Fetch checklist template labels for items
  const templateIds = items.map((i) => i.checklist_template_id)
  let templateMap = new Map<string, string>()

  if (templateIds.length > 0) {
    const { data: templates } = await supabase
      .from('checklist_templates')
      .select('id, item_label')
      .in('id', templateIds)

    templateMap = new Map(
      (templates ?? []).map((t) => [t.id, t.item_label])
    )
  }

  const checklistItems: CertificateChecklistItem[] = items.map((item) => ({
    label: templateMap.get(item.checklist_template_id) ?? 'Unknown Item',
    passed: item.passed,
    notes: item.notes,
  }))

  // Compute next due date (earliest)
  const dueDates = [
    ext?.next_monthly_due,
    ext?.next_annual_due,
    ext?.next_6year_due,
    ext?.next_12year_due,
  ].filter(Boolean) as string[]
  dueDates.sort()
  const nextDue = dueDates.length > 0 ? dueDates[0] : null

  const loc = ext?.locations as unknown as { name: string } | null

  const certData: InspectionCertificateData = {
    extinguisher_type: ext?.type ?? 'unknown',
    serial_number: ext?.serial_number ?? null,
    barcode: ext?.barcode ?? null,
    location_name: loc?.name ?? '--',
    specific_location: ext?.specific_location ?? null,
    inspection_date: inspection.performed_at,
    inspection_type_name: inspType?.name ?? '--',
    result: inspection.result as 'pass' | 'fail',
    technician_name: technician?.full_name ?? '--',
    checklist_items: checklistItems,
    next_due_date: nextDue,
    notes: inspection.notes,
  }

  const buffer = await renderToBuffer(
    React.createElement(InspectionCertificate, { data: certData }) as any
  )

  return new NextResponse(Buffer.from(buffer) as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="certificate-${inspectionId}.pdf"`,
    },
  })
}
