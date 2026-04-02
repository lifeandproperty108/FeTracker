interface InvoiceEmailProps {
  invoiceNumber: number
  totalAmount: number
  dueDate: string | null
  clientName: string
  viewUrl: string
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

export default function InvoiceEmail({
  invoiceNumber,
  totalAmount,
  dueDate,
  clientName,
  viewUrl,
}: InvoiceEmailProps) {
  return (
    <div
      style={{
        fontFamily: 'Arial, Helvetica, sans-serif',
        maxWidth: '600px',
        margin: '0 auto',
        padding: '0',
        backgroundColor: '#ffffff',
      }}
    >
      {/* Header */}
      <div style={{ backgroundColor: '#dc2626', padding: '24px 32px' }}>
        <h1
          style={{
            color: '#ffffff',
            fontSize: '24px',
            fontWeight: 'bold',
            margin: '0',
            letterSpacing: '-0.025em',
          }}
        >
          FE Tracker
        </h1>
      </div>

      {/* Body */}
      <div style={{ padding: '40px 32px' }}>
        <h2
          style={{
            fontSize: '20px',
            fontWeight: '600',
            color: '#111827',
            margin: '0 0 16px 0',
          }}
        >
          Invoice #{invoiceNumber} from FE Tracker
        </h2>

        <p
          style={{
            fontSize: '16px',
            color: '#4b5563',
            lineHeight: '1.6',
            margin: '0 0 8px 0',
          }}
        >
          Hi {clientName},
        </p>

        <p
          style={{
            fontSize: '16px',
            color: '#4b5563',
            lineHeight: '1.6',
            margin: '0 0 24px 0',
          }}
        >
          A new invoice has been issued for your account. Please find the details below.
        </p>

        {/* Amount box */}
        <div
          style={{
            backgroundColor: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '20px',
            margin: '0 0 24px 0',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '8px',
            }}
          >
            <span style={{ fontSize: '14px', color: '#6b7280' }}>Amount Due</span>
            <span
              style={{
                fontSize: '20px',
                fontWeight: '700',
                color: '#111827',
              }}
            >
              {formatCurrency(totalAmount)}
            </span>
          </div>
          {dueDate && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '14px', color: '#6b7280' }}>Due Date</span>
              <span
                style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#111827',
                }}
              >
                {new Date(dueDate).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>

        {/* Button */}
        <div style={{ textAlign: 'center' as const, margin: '0 0 32px 0' }}>
          <a
            href={viewUrl}
            style={{
              display: 'inline-block',
              backgroundColor: '#dc2626',
              color: '#ffffff',
              fontSize: '16px',
              fontWeight: '600',
              textDecoration: 'none',
              padding: '14px 40px',
              borderRadius: '8px',
            }}
          >
            View Invoice
          </a>
        </div>

        <p
          style={{
            fontSize: '14px',
            color: '#9ca3af',
            lineHeight: '1.5',
            margin: '0 0 8px 0',
          }}
        >
          A PDF copy of this invoice is attached to this email.
        </p>

        <p
          style={{
            fontSize: '12px',
            color: '#d1d5db',
            lineHeight: '1.5',
            margin: '0',
          }}
        >
          If you have any questions about this invoice, please contact us.
        </p>
      </div>

      {/* Footer */}
      <div style={{ borderTop: '1px solid #e5e7eb', padding: '24px 32px' }}>
        <p
          style={{
            fontSize: '13px',
            color: '#9ca3af',
            margin: '0',
            textAlign: 'center' as const,
          }}
        >
          FE Tracker — NFPA 10 Compliant Fire Extinguisher Tracking
        </p>
      </div>
    </div>
  )
}
