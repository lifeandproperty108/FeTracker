import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email/send'
import DueWarningEmail, { getDueWarningSubject } from '@/lib/email/templates/due-warning'
import type { NotificationType, ExtinguisherStatus } from '@/lib/types/database'

// Due date column to human-readable label
const dueTypeLabels: Record<string, string> = {
  next_monthly_due: 'Monthly Visual',
  next_annual_due: 'Annual Maintenance',
  next_6year_due: '6-Year Internal Exam',
  next_12year_due: '12-Year Hydrostatic Test',
}

const DUE_COLUMNS = [
  'next_monthly_due',
  'next_annual_due',
  'next_6year_due',
  'next_12year_due',
] as const

type DueColumn = (typeof DUE_COLUMNS)[number]

interface AlertItem {
  extinguisherId: string
  barcode: string | null
  type: string
  specificLocation: string | null
  locationId: string
  organizationId: string
  dueColumn: DueColumn
  dueDate: string
  notificationType: '30_day' | '7_day' | 'overdue'
}

interface GroupKey {
  locationId: string
  facilityManagerEmail: string
}

export async function GET(request: NextRequest) {
  // 1. Verify authorization
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const now = new Date()
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

  const nowISO = now.toISOString().split('T')[0]
  const in7DaysISO = in7Days.toISOString().split('T')[0]
  const in30DaysISO = in30Days.toISOString().split('T')[0]

  // 2. Query ALL extinguishers that have any due date within 30-day window
  //    We fetch all with due dates <= in30Days, then classify in code
  const { data: extinguishers, error: extError } = await admin
    .from('extinguishers')
    .select('id, barcode, type, specific_location, location_id, organization_id, next_monthly_due, next_annual_due, next_6year_due, next_12year_due, status')
    .or(
      `next_monthly_due.lte.${in30DaysISO},next_annual_due.lte.${in30DaysISO},next_6year_due.lte.${in30DaysISO},next_12year_due.lte.${in30DaysISO}`
    )
    .not('status', 'eq', 'retired')

  if (extError) {
    console.error('Failed to query extinguishers:', extError)
    return NextResponse.json({ error: 'Database query failed' }, { status: 500 })
  }

  const totalChecked = extinguishers?.length ?? 0

  // 3. Classify each extinguisher's due dates into alert items
  const alertItems: AlertItem[] = []

  for (const ext of extinguishers ?? []) {
    for (const col of DUE_COLUMNS) {
      const dueDate = ext[col] as string | null
      if (!dueDate) continue

      let notificationType: '30_day' | '7_day' | 'overdue' | null = null
      if (dueDate <= nowISO) {
        notificationType = 'overdue'
      } else if (dueDate <= in7DaysISO) {
        notificationType = '7_day'
      } else if (dueDate <= in30DaysISO) {
        notificationType = '30_day'
      }

      if (notificationType) {
        alertItems.push({
          extinguisherId: ext.id,
          barcode: ext.barcode,
          type: ext.type,
          specificLocation: ext.specific_location,
          locationId: ext.location_id,
          organizationId: ext.organization_id,
          dueColumn: col,
          dueDate,
          notificationType,
        })
      }
    }
  }

  // 4. Batch-fetch locations and organizations for all alert items
  const locationIds = [...new Set(alertItems.map((a) => a.locationId))]
  const orgIds = [...new Set(alertItems.map((a) => a.organizationId))]

  const [locResult, orgResult] = await Promise.all([
    locationIds.length > 0
      ? admin.from('locations').select('id, name, facility_manager_email').in('id', locationIds)
      : Promise.resolve({ data: [], error: null }),
    orgIds.length > 0
      ? admin.from('organizations').select('id, name').in('id', orgIds)
      : Promise.resolve({ data: [], error: null }),
  ])

  const locationMap = new Map(
    (locResult.data ?? []).map((l: { id: string; name: string; facility_manager_email: string | null }) => [l.id, l])
  )
  const orgMap = new Map(
    (orgResult.data ?? []).map((o: { id: string; name: string }) => [o.id, o])
  )

  // 5. Check which notifications have already been sent today
  const todayStart = `${nowISO}T00:00:00.000Z`
  const todayEnd = `${nowISO}T23:59:59.999Z`

  const extIdsWithAlerts = [...new Set(alertItems.map((a) => a.extinguisherId))]

  let alreadySent = new Set<string>()
  if (extIdsWithAlerts.length > 0) {
    const { data: sentToday } = await admin
      .from('notifications_log')
      .select('extinguisher_id, notification_type')
      .in('extinguisher_id', extIdsWithAlerts)
      .gte('sent_at', todayStart)
      .lte('sent_at', todayEnd)

    for (const row of sentToday ?? []) {
      alreadySent.add(`${row.extinguisher_id}:${row.notification_type}`)
    }
  }

  // 6. Filter out already-sent and group by location + facility manager
  const groups = new Map<
    string,
    {
      locationId: string
      facilityManagerEmail: string
      locationName: string
      organizationName: string
      items: AlertItem[]
      mostUrgent: '30_day' | '7_day' | 'overdue'
    }
  >()

  const urgencyRank: Record<string, number> = { overdue: 3, '7_day': 2, '30_day': 1 }

  for (const item of alertItems) {
    const key = `${item.extinguisherId}:${item.notificationType}`
    if (alreadySent.has(key)) continue

    const location = locationMap.get(item.locationId)
    if (!location?.facility_manager_email) continue

    const org = orgMap.get(item.organizationId)
    const groupKey = `${item.locationId}:${location.facility_manager_email}`

    if (!groups.has(groupKey)) {
      groups.set(groupKey, {
        locationId: item.locationId,
        facilityManagerEmail: location.facility_manager_email,
        locationName: location.name,
        organizationName: org?.name ?? 'Unknown Organization',
        items: [],
        mostUrgent: item.notificationType,
      })
    }

    const group = groups.get(groupKey)!
    group.items.push(item)
    if (urgencyRank[item.notificationType] > urgencyRank[group.mostUrgent]) {
      group.mostUrgent = item.notificationType
    }
  }

  // 7. Send emails and log notifications
  let sentCount = 0
  const notificationLogs: Array<{
    extinguisher_id: string
    notification_type: NotificationType
    sent_to: string
    sent_at: string
  }> = []

  for (const [, group] of groups) {
    try {
      const emailComponent = DueWarningEmail({
        facilityManagerName: 'Facility Manager',
        buildingName: group.locationName,
        organizationName: group.organizationName,
        warningType: group.mostUrgent,
        extinguishers: group.items.map((item) => ({
          barcode: item.barcode ?? 'N/A',
          type: item.type,
          specificLocation: item.specificLocation ?? '',
          dueDate: item.dueDate,
          dueType: dueTypeLabels[item.dueColumn] ?? item.dueColumn,
        })),
        appUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://fetracker.com'}/dashboard/locations/${group.locationId}`,
      })

      await sendEmail({
        to: group.facilityManagerEmail,
        subject: getDueWarningSubject(group.mostUrgent),
        react: emailComponent,
      })

      sentCount++

      // Log each extinguisher+type combo
      const sentAt = now.toISOString()
      for (const item of group.items) {
        notificationLogs.push({
          extinguisher_id: item.extinguisherId,
          notification_type: item.notificationType,
          sent_to: group.facilityManagerEmail,
          sent_at: sentAt,
        })
      }
    } catch (err) {
      console.error(`Failed to send email to ${group.facilityManagerEmail}:`, err)
    }
  }

  // Batch insert notification logs
  if (notificationLogs.length > 0) {
    const { error: logError } = await admin
      .from('notifications_log')
      .insert(notificationLogs)

    if (logError) {
      console.error('Failed to insert notification logs:', logError)
    }
  }

  // 8. Recalculate and update cached status on ALL extinguishers
  //    Fetch all non-retired extinguishers with their due dates
  const { data: allExtinguishers, error: allExtError } = await admin
    .from('extinguishers')
    .select('id, next_monthly_due, next_annual_due, next_6year_due, next_12year_due, status')
    .not('status', 'eq', 'retired')

  let updatedCount = 0

  if (!allExtError && allExtinguishers) {
    const updates: Array<{ id: string; status: ExtinguisherStatus }> = []

    for (const ext of allExtinguishers) {
      const newStatus = calculateStatus(ext, nowISO, in7DaysISO)
      if (newStatus !== ext.status) {
        updates.push({ id: ext.id, status: newStatus })
      }
    }

    // Batch update in groups of 100 to avoid oversized queries
    const batchSize = 100
    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize)
      const promises = batch.map((u) =>
        admin.from('extinguishers').update({ status: u.status }).eq('id', u.id)
      )
      await Promise.all(promises)
    }

    updatedCount = updates.length
  }

  // 9. Return summary
  return NextResponse.json({
    checked: totalChecked,
    notificationsSent: sentCount,
    statusUpdated: updatedCount,
  })
}

function calculateStatus(
  ext: {
    next_monthly_due: string | null
    next_annual_due: string | null
    next_6year_due: string | null
    next_12year_due: string | null
  },
  nowISO: string,
  in7DaysISO: string
): ExtinguisherStatus {
  const dueDates = [
    ext.next_monthly_due,
    ext.next_annual_due,
    ext.next_6year_due,
    ext.next_12year_due,
  ].filter(Boolean) as string[]

  // Check for overdue
  const hasOverdue = dueDates.some((d) => d <= nowISO)
  if (hasOverdue) return 'overdue'

  // Check for due soon (within 7 days)
  const hasDueSoon = dueDates.some((d) => d <= in7DaysISO)
  if (hasDueSoon) return 'due_soon'

  return 'compliant'
}
