interface DueWarningEmailProps {
  facilityManagerName: string
  buildingName: string
  organizationName: string
  warningType: '30_day' | '7_day' | 'overdue'
  extinguishers: Array<{
    barcode: string
    type: string
    specificLocation: string
    dueDate: string
    dueType: string
  }>
  appUrl: string
}

const subjectLines: Record<DueWarningEmailProps['warningType'], string> = {
  '30_day': 'Upcoming: Fire Extinguisher Inspection Due in 30 Days',
  '7_day': 'Reminder: Fire Extinguisher Inspection Due in 7 Days',
  overdue: 'Action Required: Fire Extinguisher Inspection Overdue',
}

export function getDueWarningSubject(warningType: DueWarningEmailProps['warningType']): string {
  return subjectLines[warningType]
}

export default function DueWarningEmail({
  facilityManagerName,
  buildingName,
  warningType,
  extinguishers,
  appUrl,
}: DueWarningEmailProps) {
  const isOverdue = warningType === 'overdue'

  return (
    <div style={{ fontFamily: 'Arial, Helvetica, sans-serif', maxWidth: '600px', margin: '0 auto', padding: '0', backgroundColor: '#ffffff' }}>
      {/* Header */}
      <div style={{ backgroundColor: '#dc2626', padding: '24px 32px' }}>
        <h1 style={{ color: '#ffffff', fontSize: '24px', fontWeight: 'bold', margin: '0', letterSpacing: '-0.025em' }}>
          FE Tracker
        </h1>
      </div>

      {/* Body */}
      <div style={{ padding: '40px 32px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', color: isOverdue ? '#dc2626' : '#111827', margin: '0 0 16px 0' }}>
          {subjectLines[warningType]}
        </h2>

        <p style={{ fontSize: '16px', color: '#4b5563', lineHeight: '1.6', margin: '0 0 8px 0' }}>
          Dear {facilityManagerName},
        </p>

        <p style={{ fontSize: '16px', color: '#4b5563', lineHeight: '1.6', margin: '0 0 24px 0' }}>
          The following fire extinguishers at <strong>{buildingName}</strong> require attention:
        </p>

        {/* Extinguisher Table */}
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            margin: '0 0 32px 0',
            fontSize: '14px',
          }}
        >
          <thead>
            <tr>
              <th style={{ textAlign: 'left' as const, padding: '10px 8px', borderBottom: '2px solid #e5e7eb', color: '#374151', fontWeight: '600' }}>
                Barcode/ID
              </th>
              <th style={{ textAlign: 'left' as const, padding: '10px 8px', borderBottom: '2px solid #e5e7eb', color: '#374151', fontWeight: '600' }}>
                Type
              </th>
              <th style={{ textAlign: 'left' as const, padding: '10px 8px', borderBottom: '2px solid #e5e7eb', color: '#374151', fontWeight: '600' }}>
                Location
              </th>
              <th style={{ textAlign: 'left' as const, padding: '10px 8px', borderBottom: '2px solid #e5e7eb', color: '#374151', fontWeight: '600' }}>
                Due Date
              </th>
              <th style={{ textAlign: 'left' as const, padding: '10px 8px', borderBottom: '2px solid #e5e7eb', color: '#374151', fontWeight: '600' }}>
                Inspection Type
              </th>
            </tr>
          </thead>
          <tbody>
            {extinguishers.map((ext) => (
              <tr key={ext.barcode}>
                <td style={{ padding: '10px 8px', borderBottom: '1px solid #e5e7eb', color: isOverdue ? '#dc2626' : '#111827', fontWeight: isOverdue ? '600' : '400' }}>
                  {ext.barcode}
                </td>
                <td style={{ padding: '10px 8px', borderBottom: '1px solid #e5e7eb', color: '#4b5563' }}>
                  {ext.type}
                </td>
                <td style={{ padding: '10px 8px', borderBottom: '1px solid #e5e7eb', color: '#4b5563' }}>
                  {ext.specificLocation}
                </td>
                <td style={{ padding: '10px 8px', borderBottom: '1px solid #e5e7eb', color: isOverdue ? '#dc2626' : '#4b5563', fontWeight: isOverdue ? '600' : '400' }}>
                  {ext.dueDate}
                </td>
                <td style={{ padding: '10px 8px', borderBottom: '1px solid #e5e7eb', color: '#4b5563' }}>
                  {ext.dueType}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

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
            View in FE Tracker
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
