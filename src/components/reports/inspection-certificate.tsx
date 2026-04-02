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
  headerBar: {
    backgroundColor: '#DC2626',
    padding: 16,
    borderRadius: 4,
    marginBottom: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
    marginBottom: 2,
  },
  headerSub: {
    fontSize: 10,
    color: '#fecaca',
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#DC2626',
    marginBottom: 8,
    marginTop: 16,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    marginVertical: 12,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  label: {
    width: '35%',
    fontFamily: 'Helvetica-Bold',
    color: '#374151',
    fontSize: 10,
  },
  value: {
    width: '65%',
    color: '#111827',
    fontSize: 10,
  },
  resultPass: {
    color: '#16a34a',
    fontFamily: 'Helvetica-Bold',
    fontSize: 14,
  },
  resultFail: {
    color: '#DC2626',
    fontFamily: 'Helvetica-Bold',
    fontSize: 14,
  },
  resultContainer: {
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 4,
    marginVertical: 12,
  },
  resultLabel: {
    fontSize: 8,
    color: '#6b7280',
    marginBottom: 4,
  },
  checklistHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    padding: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db',
  },
  checklistRow: {
    flexDirection: 'row',
    padding: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  checkCellItem: { width: '60%', fontSize: 9 },
  checkCellResult: { width: '20%', fontSize: 9 },
  checkCellNotes: { width: '20%', fontSize: 9 },
  headerText: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    color: '#374151',
  },
  passText: { color: '#16a34a' },
  failText: { color: '#DC2626' },
  signatureSection: {
    marginTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureBlock: {
    width: '45%',
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
    marginBottom: 4,
    height: 30,
  },
  signatureLabel: {
    fontSize: 8,
    color: '#6b7280',
  },
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

export interface CertificateChecklistItem {
  label: string
  passed: boolean
  notes: string | null
}

export interface InspectionCertificateData {
  extinguisher_type: string
  serial_number: string | null
  barcode: string | null
  location_name: string
  specific_location: string | null
  inspection_date: string
  inspection_type_name: string
  result: 'pass' | 'fail'
  technician_name: string
  checklist_items: CertificateChecklistItem[]
  next_due_date: string | null
  notes: string | null
}

function formatDate(d: string | null): string {
  if (!d) return '--'
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function InspectionCertificate({
  data,
}: {
  data: InspectionCertificateData
}) {
  const timestamp = new Date().toLocaleString('en-US')

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerBar}>
          <Text style={styles.headerTitle}>Inspection Certificate</Text>
          <Text style={styles.headerSub}>FE Tracker</Text>
        </View>

        {/* Result Badge */}
        <View style={styles.resultContainer}>
          <Text style={styles.resultLabel}>INSPECTION RESULT</Text>
          <Text
            style={
              data.result === 'pass' ? styles.resultPass : styles.resultFail
            }
          >
            {data.result.toUpperCase()}
          </Text>
        </View>

        {/* Extinguisher Details */}
        <Text style={styles.sectionTitle}>Extinguisher Details</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Type:</Text>
          <Text style={styles.value}>
            {data.extinguisher_type.replace(/_/g, ' ')}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Serial Number:</Text>
          <Text style={styles.value}>{data.serial_number ?? '--'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Barcode:</Text>
          <Text style={styles.value}>{data.barcode ?? '--'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Location:</Text>
          <Text style={styles.value}>
            {data.location_name}
            {data.specific_location ? ` - ${data.specific_location}` : ''}
          </Text>
        </View>

        <View style={styles.divider} />

        {/* Inspection Details */}
        <Text style={styles.sectionTitle}>Inspection Details</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Date:</Text>
          <Text style={styles.value}>{formatDate(data.inspection_date)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Inspection Type:</Text>
          <Text style={styles.value}>
            {data.inspection_type_name.replace(/_/g, ' ')}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Technician:</Text>
          <Text style={styles.value}>{data.technician_name}</Text>
        </View>
        {data.notes && (
          <View style={styles.row}>
            <Text style={styles.label}>Notes:</Text>
            <Text style={styles.value}>{data.notes}</Text>
          </View>
        )}

        <View style={styles.divider} />

        {/* Checklist Summary */}
        <Text style={styles.sectionTitle}>Checklist Summary</Text>
        <View style={styles.checklistHeader}>
          <Text style={[styles.checkCellItem, styles.headerText]}>Item</Text>
          <Text style={[styles.checkCellResult, styles.headerText]}>
            Result
          </Text>
          <Text style={[styles.checkCellNotes, styles.headerText]}>Notes</Text>
        </View>
        {data.checklist_items.map((item, i) => (
          <View style={styles.checklistRow} key={i}>
            <Text style={styles.checkCellItem}>{item.label}</Text>
            <Text
              style={[
                styles.checkCellResult,
                item.passed ? styles.passText : styles.failText,
              ]}
            >
              {item.passed ? 'PASS' : 'FAIL'}
            </Text>
            <Text style={styles.checkCellNotes}>{item.notes ?? '--'}</Text>
          </View>
        ))}

        <View style={styles.divider} />

        {/* Next Due Date */}
        <View style={styles.row}>
          <Text style={styles.label}>Next Due Date:</Text>
          <Text style={[styles.value, { fontFamily: 'Helvetica-Bold' }]}>
            {formatDate(data.next_due_date)}
          </Text>
        </View>

        {/* Signature Lines */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBlock}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Technician Signature</Text>
          </View>
          <View style={styles.signatureBlock}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Date</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>Generated by FE Tracker</Text>
          <Text>{timestamp}</Text>
        </View>
      </Page>
    </Document>
  )
}
