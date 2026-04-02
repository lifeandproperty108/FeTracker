import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
  },
  brand: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: '#DC2626',
    marginBottom: 4,
  },
  orgName: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
  },
  dateRange: {
    fontSize: 10,
    color: '#6b7280',
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    marginVertical: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 8,
    color: '#111827',
  },
  summaryRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    padding: 10,
    backgroundColor: '#f9fafb',
    borderRadius: 4,
    marginRight: 8,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
  },
  summaryLabel: {
    fontSize: 8,
    color: '#6b7280',
    marginTop: 2,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    padding: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  cellId: { width: '12%', fontSize: 8 },
  cellType: { width: '15%', fontSize: 8 },
  cellLocation: { width: '23%', fontSize: 8 },
  cellStatus: { width: '12%', fontSize: 8 },
  cellLastInsp: { width: '19%', fontSize: 8 },
  cellNextDue: { width: '19%', fontSize: 8 },
  headerText: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    color: '#374151',
  },
  statusPass: { color: '#16a34a' },
  statusFail: { color: '#DC2626' },
  statusDueSoon: { color: '#d97706' },
  deficiencyRow: {
    flexDirection: 'row',
    padding: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  defCellId: { width: '15%', fontSize: 8 },
  defCellType: { width: '20%', fontSize: 8 },
  defCellDate: { width: '20%', fontSize: 8 },
  defCellResult: { width: '12%', fontSize: 8 },
  defCellNotes: { width: '33%', fontSize: 8 },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 8,
    color: '#9ca3af',
  },
})

export interface ComplianceExtinguisher {
  barcode: string | null
  type: string
  location_name: string
  status: string
  last_inspection_date: string | null
  next_due_date: string | null
}

export interface ComplianceDeficiency {
  barcode: string | null
  type: string
  date: string
  result: string
  notes: string | null
}

export interface ComplianceReportData {
  org_name: string
  date_from: string
  date_to: string
  total_units: number
  compliant_percent: number
  overdue_count: number
  extinguishers: ComplianceExtinguisher[]
  deficiencies: ComplianceDeficiency[]
}

function formatDate(d: string | null): string {
  if (!d) return '--'
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function statusColor(status: string) {
  if (status === 'compliant') return styles.statusPass
  if (status === 'overdue' || status === 'out_of_service') return styles.statusFail
  if (status === 'due_soon') return styles.statusDueSoon
  return {}
}

export function ComplianceReport({ data }: { data: ComplianceReportData }) {
  const timestamp = new Date().toLocaleString('en-US')

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.brand}>FE Tracker</Text>
          <Text style={styles.orgName}>{data.org_name}</Text>
          <Text style={styles.dateRange}>
            Compliance Report: {formatDate(data.date_from)} &ndash;{' '}
            {formatDate(data.date_to)}
          </Text>
        </View>

        <View style={styles.divider} />

        {/* Summary */}
        <Text style={styles.sectionTitle}>Summary</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{data.total_units}</Text>
            <Text style={styles.summaryLabel}>Total Units</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>
              {data.compliant_percent.toFixed(1)}%
            </Text>
            <Text style={styles.summaryLabel}>Compliant</Text>
          </View>
          <View style={[styles.summaryCard, { marginRight: 0 }]}>
            <Text style={[styles.summaryValue, { color: '#DC2626' }]}>
              {data.overdue_count}
            </Text>
            <Text style={styles.summaryLabel}>Overdue</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Extinguisher Table */}
        <Text style={styles.sectionTitle}>Extinguisher Details</Text>
        <View style={styles.tableHeader}>
          <Text style={[styles.cellId, styles.headerText]}>ID / Barcode</Text>
          <Text style={[styles.cellType, styles.headerText]}>Type</Text>
          <Text style={[styles.cellLocation, styles.headerText]}>Location</Text>
          <Text style={[styles.cellStatus, styles.headerText]}>Status</Text>
          <Text style={[styles.cellLastInsp, styles.headerText]}>
            Last Inspection
          </Text>
          <Text style={[styles.cellNextDue, styles.headerText]}>Next Due</Text>
        </View>
        {data.extinguishers.map((ext, i) => (
          <View style={styles.tableRow} key={i}>
            <Text style={styles.cellId}>{ext.barcode ?? '--'}</Text>
            <Text style={styles.cellType}>
              {ext.type.replace(/_/g, ' ')}
            </Text>
            <Text style={styles.cellLocation}>{ext.location_name}</Text>
            <Text style={[styles.cellStatus, statusColor(ext.status)]}>
              {ext.status.replace(/_/g, ' ')}
            </Text>
            <Text style={styles.cellLastInsp}>
              {formatDate(ext.last_inspection_date)}
            </Text>
            <Text style={styles.cellNextDue}>
              {formatDate(ext.next_due_date)}
            </Text>
          </View>
        ))}

        {/* Deficiency Log */}
        {data.deficiencies.length > 0 && (
          <View style={{ marginTop: 16 }}>
            <Text style={styles.sectionTitle}>Deficiency Log</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.defCellId, styles.headerText]}>
                ID / Barcode
              </Text>
              <Text style={[styles.defCellType, styles.headerText]}>Type</Text>
              <Text style={[styles.defCellDate, styles.headerText]}>Date</Text>
              <Text style={[styles.defCellResult, styles.headerText]}>
                Result
              </Text>
              <Text style={[styles.defCellNotes, styles.headerText]}>
                Notes
              </Text>
            </View>
            {data.deficiencies.map((def, i) => (
              <View style={styles.deficiencyRow} key={i}>
                <Text style={styles.defCellId}>{def.barcode ?? '--'}</Text>
                <Text style={styles.defCellType}>
                  {def.type.replace(/_/g, ' ')}
                </Text>
                <Text style={styles.defCellDate}>{formatDate(def.date)}</Text>
                <Text style={[styles.defCellResult, styles.statusFail]}>
                  {def.result.toUpperCase()}
                </Text>
                <Text style={styles.defCellNotes}>{def.notes ?? '--'}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>Generated by FE Tracker</Text>
          <Text>{timestamp}</Text>
        </View>
      </Page>
    </Document>
  )
}
