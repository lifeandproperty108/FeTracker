import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUser } from '@/lib/auth/get-user'
import { getSelectedOrgId } from '@/lib/org-switcher'
import {
  ComplianceReport,
  type ComplianceReportData,
  type ComplianceExtinguisher,
  type ComplianceDeficiency,
} from '@/components/reports/compliance-report'

export async function GET(request: NextRequest) {
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

  const { searchParams } = request.nextUrl
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const locationId = searchParams.get('location_id')

  if (!from || !to) {
    return NextResponse.json(
      { error: 'from and to date params are required' },
      { status: 400 }
    )
  }

  const supabase = isSuperAdmin ? createAdminClient() : await createClient()

  // Fetch organization name
  const { data: org } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', orgId)
    .single()

  // Fetch extinguishers (optionally filtered by location)
  let extQuery = supabase
    .from('extinguishers')
    .select('id, barcode, type, status, specific_location, next_monthly_due, next_annual_due, next_6year_due, next_12year_due, location_id, locations(name)')
    .eq('organization_id', orgId)

  if (locationId) {
    extQuery = extQuery.eq('location_id', locationId)
  }

  const { data: extinguishers } = await extQuery

  const extList = extinguishers ?? []

  // For each extinguisher, find the most recent inspection
  const extIds = extList.map((e) => e.id)

  let inspections: Array<{
    extinguisher_id: string
    performed_at: string
    result: string
    notes: string | null
  }> = []

  if (extIds.length > 0) {
    const { data: allInspections } = await supabase
      .from('inspections')
      .select('extinguisher_id, performed_at, result, notes')
      .in('extinguisher_id', extIds)
      .order('performed_at', { ascending: false })

    inspections = allInspections ?? []
  }

  // Build a map: extinguisher_id -> latest inspection date
  const latestInspMap = new Map<string, string>()
  for (const insp of inspections) {
    if (!latestInspMap.has(insp.extinguisher_id)) {
      latestInspMap.set(insp.extinguisher_id, insp.performed_at)
    }
  }

  // Compute the earliest next due date for each extinguisher
  function getNextDue(ext: {
    next_monthly_due: string | null
    next_annual_due: string | null
    next_6year_due: string | null
    next_12year_due: string | null
  }): string | null {
    const dates = [
      ext.next_monthly_due,
      ext.next_annual_due,
      ext.next_6year_due,
      ext.next_12year_due,
    ].filter(Boolean) as string[]
    if (dates.length === 0) return null
    dates.sort()
    return dates[0]
  }

  const extRows: ComplianceExtinguisher[] = extList.map((ext) => {
    const loc = ext.locations as unknown as { name: string } | null
    return {
      barcode: ext.barcode,
      type: ext.type,
      location_name: loc?.name ?? '--',
      status: ext.status,
      last_inspection_date: latestInspMap.get(ext.id) ?? null,
      next_due_date: getNextDue(ext),
    }
  })

  // Compute summary stats
  const totalUnits = extRows.length
  const compliantCount = extRows.filter((e) => e.status === 'compliant').length
  const overdueCount = extRows.filter((e) => e.status === 'overdue').length
  const compliantPercent = totalUnits > 0 ? (compliantCount / totalUnits) * 100 : 0

  // Get deficiencies (failed inspections in date range)
  const deficiencies: ComplianceDeficiency[] = []

  if (extIds.length > 0) {
    const { data: failedInspections } = await supabase
      .from('inspections')
      .select('extinguisher_id, performed_at, result, notes')
      .in('extinguisher_id', extIds)
      .eq('result', 'fail')
      .gte('performed_at', from)
      .lte('performed_at', to)
      .order('performed_at', { ascending: false })

    const extMap = new Map(extList.map((e) => [e.id, e]))

    for (const insp of failedInspections ?? []) {
      const ext = extMap.get(insp.extinguisher_id)
      deficiencies.push({
        barcode: ext?.barcode ?? null,
        type: ext?.type ?? 'unknown',
        date: insp.performed_at,
        result: insp.result,
        notes: insp.notes,
      })
    }
  }

  const reportData: ComplianceReportData = {
    org_name: org?.name ?? 'Unknown Organization',
    date_from: from,
    date_to: to,
    total_units: totalUnits,
    compliant_percent: compliantPercent,
    overdue_count: overdueCount,
    extinguishers: extRows,
    deficiencies,
  }

  const buffer = await renderToBuffer(
    React.createElement(ComplianceReport, { data: reportData }) as any
  )

  return new NextResponse(Buffer.from(buffer) as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename="compliance-report.pdf"',
    },
  })
}
