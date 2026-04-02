interface DeficiencyAlertEmailProps {
  facilityManagerName: string
  buildingName: string
  organizationName: string
  extinguisherBarcode: string
  extinguisherType: string
  specificLocation: string
  failedItems: Array<{
    label: string
    notes: string | null
    isCritical: boolean
  }>
  technicianName: string
  inspectionDate: string
  appUrl: string
}

export function getDeficiencyAlertSubject(buildingName: string): string {
  return `Alert: Fire Extinguisher Out of Service — ${buildingName}`
}

export default function DeficiencyAlertEmail({
  facilityManagerName,
  buildingName,
  extinguisherBarcode,
  extinguisherType,
  specificLocation,
  failedItems,
  technicianName,
  inspectionDate,
  appUrl,
}: DeficiencyAlertEmailProps) {
  return (
    <div style={{ fontFamily: 'Arial, Helvetica, sans-serif', maxWidth: '600px', margin: '0 auto', padding: '0', backgroundColor: '#ffffff' }}>
      {/* Header */}
      <div style={{ backgroundColor: '#dc2626', padding: '24px 32px' }}>
        <h1 style={{ color: '#ffffff', fontSize: '24px', fontWeight: 'bold', margin: '0', letterSpacing: '-0.025em' }}>
          FE Tracker
        </h1>
      </div>

      {/* Alert Banner */}
      <div style={{ backgroundColor: '#fef2f2', borderBottom: '2px solid #dc2626', padding: '16px 32px', textAlign: 'center' as const }}>
        <span style={{ color: '#dc2626', fontSize: '16px', fontWeight: '700', letterSpacing: '0.05em', textTransform: 'uppercase' as const }}>
          RED ALERT — Extinguisher Out of Service
        </span>
      </div>

      {/* Body */}
      <div style={{ padding: '40px 32px' }}>
        <p style={{ fontSize: '16px', color: '#4b5563', lineHeight: '1.6', margin: '0 0 8px 0' }}>
          Dear {facilityManagerName},
        </p>

        <p style={{ fontSize: '16px', color: '#4b5563', lineHeight: '1.6', margin: '0 0 24px 0' }}>
          A fire extinguisher at <strong>{buildingName}</strong> has failed inspection and requires immediate attention.
        </p>

        {/* Extinguisher Details */}
        <div style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '20px', margin: '0 0 24px 0' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#374151', margin: '0 0 12px 0', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>
            Extinguisher Details
          </h3>
          <table style={{ width: '100%', fontSize: '14px' }}>
            <tbody>
              <tr>
                <td style={{ padding: '4px 0', color: '#6b7280', fontWeight: '600', width: '120px' }}>Barcode/ID</td>
                <td style={{ padding: '4px 0', color: '#111827' }}>{extinguisherBarcode}</td>
              </tr>
              <tr>
                <td style={{ padding: '4px 0', color: '#6b7280', fontWeight: '600' }}>Type</td>
                <td style={{ padding: '4px 0', color: '#111827' }}>{extinguisherType}</td>
              </tr>
              <tr>
                <td style={{ padding: '4px 0', color: '#6b7280', fontWeight: '600' }}>Location</td>
                <td style={{ padding: '4px 0', color: '#111827' }}>{specificLocation}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Failed Items */}
        <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', margin: '0 0 12px 0' }}>
          Failed Inspection Items
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', margin: '0 0 24px 0', fontSize: '14px' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left' as const, padding: '10px 8px', borderBottom: '2px solid #e5e7eb', color: '#374151', fontWeight: '600' }}>
                Item
              </th>
              <th style={{ textAlign: 'left' as const, padding: '10px 8px', borderBottom: '2px solid #e5e7eb', color: '#374151', fontWeight: '600' }}>
                Notes
              </th>
            </tr>
          </thead>
          <tbody>
            {failedItems.map((item) => (
              <tr key={item.label}>
                <td
                  style={{
                    padding: '10px 8px',
                    borderBottom: '1px solid #e5e7eb',
                    color: item.isCritical ? '#dc2626' : '#111827',
                    fontWeight: item.isCritical ? '600' : '400',
                  }}
                >
                  {item.label}
                  {item.isCritical && (
                    <span style={{ fontSize: '11px', backgroundColor: '#dc2626', color: '#ffffff', padding: '2px 6px', borderRadius: '4px', marginLeft: '8px', fontWeight: '600' }}>
                      CRITICAL
                    </span>
                  )}
                </td>
                <td style={{ padding: '10px 8px', borderBottom: '1px solid #e5e7eb', color: '#4b5563' }}>
                  {item.notes || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <p style={{ fontSize: '14px', color: '#6b7280', lineHeight: '1.5', margin: '0 0 24px 0' }}>
          Inspected by <strong>{technicianName}</strong> on <strong>{inspectionDate}</strong>.
        </p>

        <p style={{ fontSize: '14px', color: '#4b5563', lineHeight: '1.6', margin: '0 0 32px 0', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '16px' }}>
          An extinguisher that has been marked out of service must be replaced or repaired before the area can be considered compliant.
        </p>

        {/* Button */}
        <div style={{ textAlign: 'center' as const, margin: '0 0 32px 0' }}>
          <a
            href={appUrl}
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
            View Details
          </a>
        </div>
      </div>

      {/* Footer */}
      <div style={{ borderTop: '1px solid #e5e7eb', padding: '24px 32px' }}>
        <p style={{ fontSize: '13px', color: '#9ca3af', margin: '0', textAlign: 'center' as const }}>
          FE Tracker &mdash; NFPA 10 Compliant Fire Extinguisher Tracking
        </p>
      </div>
    </div>
  )
}
