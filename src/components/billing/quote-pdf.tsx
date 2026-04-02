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
    color: '#111827',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Helvetica-Bold',
    color: '#2563eb',
    letterSpacing: 2,
  },
  brandName: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    marginTop: 4,
    color: '#6b7280',
  },
  metaBlock: {
    alignItems: 'flex-end',
  },
  metaLabel: {
    fontSize: 8,
    color: '#9ca3af',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  metaValue: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 6,
  },
  parties: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  partyBlock: {
    width: '45%',
  },
  partyTitle: {
    fontSize: 8,
    color: '#9ca3af',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  partyName: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 2,
  },
  partyDetail: {
    fontSize: 10,
    color: '#6b7280',
    marginBottom: 1,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    padding: '8 10',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tableRow: {
    flexDirection: 'row',
    padding: '7 10',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  colDescription: { width: '50%' },
  colQty: { width: '12%', textAlign: 'right' },
  colUnitPrice: { width: '19%', textAlign: 'right' },
  colAmount: { width: '19%', textAlign: 'right' },
  headerText: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#6b7280',
    textTransform: 'uppercase',
  },
  cellText: {
    fontSize: 10,
  },
  totalRow: {
    flexDirection: 'row',
    padding: '10 10',
    marginTop: 4,
  },
  totalLabel: {
    width: '81%',
    textAlign: 'right',
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
  },
  totalValue: {
    width: '19%',
    textAlign: 'right',
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#2563eb',
  },
  notes: {
    marginTop: 30,
    padding: 15,
    backgroundColor: '#f9fafb',
    borderRadius: 4,
  },
  notesTitle: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#9ca3af',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  notesText: {
    fontSize: 9,
    color: '#6b7280',
    lineHeight: 1.5,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#d1d5db',
  },
})

function formatCurrency(amount: number) {
  return `$${amount.toFixed(2)}`
}

export interface QuotePdfLineItem {
  description: string
  quantity: number
  unit_price: number
  amount: number
}

export interface QuotePdfProps {
  quoteNumber: number
  issuedDate: string | null
  validUntil: string | null
  totalAmount: number
  notes: string | null
  providerName: string
  providerAddress?: string
  clientName: string
  clientAddress?: string
  lineItems: QuotePdfLineItem[]
}

export default function QuotePdf({
  quoteNumber,
  issuedDate,
  validUntil,
  totalAmount,
  notes,
  providerName,
  providerAddress,
  clientName,
  clientAddress,
  lineItems,
}: QuotePdfProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>QUOTE</Text>
            <Text style={styles.brandName}>FE Tracker</Text>
          </View>
          <View style={styles.metaBlock}>
            <Text style={styles.metaLabel}>Quote Number</Text>
            <Text style={styles.metaValue}>#{quoteNumber}</Text>
            <Text style={styles.metaLabel}>Issued Date</Text>
            <Text style={styles.metaValue}>{issuedDate ?? '--'}</Text>
            <Text style={styles.metaLabel}>Valid Until</Text>
            <Text style={styles.metaValue}>{validUntil ?? '--'}</Text>
          </View>
        </View>

        {/* From / To */}
        <View style={styles.parties}>
          <View style={styles.partyBlock}>
            <Text style={styles.partyTitle}>From</Text>
            <Text style={styles.partyName}>{providerName}</Text>
            {providerAddress && (
              <Text style={styles.partyDetail}>{providerAddress}</Text>
            )}
          </View>
          <View style={styles.partyBlock}>
            <Text style={styles.partyTitle}>To</Text>
            <Text style={styles.partyName}>{clientName}</Text>
            {clientAddress && (
              <Text style={styles.partyDetail}>{clientAddress}</Text>
            )}
          </View>
        </View>

        {/* Line Items Table */}
        <View style={styles.tableHeader}>
          <Text style={[styles.headerText, styles.colDescription]}>Description</Text>
          <Text style={[styles.headerText, styles.colQty]}>Qty</Text>
          <Text style={[styles.headerText, styles.colUnitPrice]}>Unit Price</Text>
          <Text style={[styles.headerText, styles.colAmount]}>Amount</Text>
        </View>
        {lineItems.map((item, i) => (
          <View style={styles.tableRow} key={i}>
            <Text style={[styles.cellText, styles.colDescription]}>
              {item.description}
            </Text>
            <Text style={[styles.cellText, styles.colQty]}>{item.quantity}</Text>
            <Text style={[styles.cellText, styles.colUnitPrice]}>
              {formatCurrency(item.unit_price)}
            </Text>
            <Text style={[styles.cellText, styles.colAmount]}>
              {formatCurrency(item.amount)}
            </Text>
          </View>
        ))}

        {/* Total */}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{formatCurrency(totalAmount)}</Text>
        </View>

        {/* Notes */}
        {notes && (
          <View style={styles.notes}>
            <Text style={styles.notesTitle}>Notes / Terms</Text>
            <Text style={styles.notesText}>{notes}</Text>
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer}>
          FE Tracker — NFPA 10 Compliant Fire Extinguisher Tracking
        </Text>
      </Page>
    </Document>
  )
}
