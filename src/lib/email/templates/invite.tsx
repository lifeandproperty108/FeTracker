import type { UserRole } from '@/lib/types/database'

interface InviteEmailProps {
  organizationName: string
  role: UserRole
  token: string
}

const roleLabels: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  org_admin: 'Organization Admin',
  facility_manager: 'Facility Manager',
  technician: 'Technician',
  auditor: 'Auditor',
}

export default function InviteEmail({ organizationName, role, token }: InviteEmailProps) {
  const acceptUrl = `${process.env.NEXT_PUBLIC_APP_URL}/accept-invite/${token}`

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
        <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', margin: '0 0 16px 0' }}>
          You&apos;ve been invited to join {organizationName} on FE Tracker
        </h2>

        <p style={{ fontSize: '16px', color: '#4b5563', lineHeight: '1.6', margin: '0 0 8px 0' }}>
          You&apos;ve been invited as a <strong>{roleLabels[role]}</strong>.
        </p>

        <p style={{ fontSize: '16px', color: '#4b5563', lineHeight: '1.6', margin: '0 0 32px 0' }}>
          Click the button below to create your account and get started.
        </p>

        {/* Button */}
        <div style={{ textAlign: 'center' as const, margin: '0 0 32px 0' }}>
          <a
            href={acceptUrl}
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
            Accept Invitation
          </a>
        </div>

        <p style={{ fontSize: '14px', color: '#9ca3af', lineHeight: '1.5', margin: '0 0 8px 0' }}>
          This invitation expires in 7 days.
        </p>

        <p style={{ fontSize: '12px', color: '#d1d5db', lineHeight: '1.5', margin: '0' }}>
          If you didn&apos;t expect this invitation, you can safely ignore this email.
        </p>
      </div>

      {/* Footer */}
      <div style={{ borderTop: '1px solid #e5e7eb', padding: '24px 32px' }}>
        <p style={{ fontSize: '13px', color: '#9ca3af', margin: '0', textAlign: 'center' as const }}>
          FE Tracker — NFPA 10 Compliant Fire Extinguisher Tracking
        </p>
      </div>
    </div>
  )
}
