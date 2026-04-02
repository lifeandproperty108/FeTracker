import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'FE Tracker — NFPA 10 Fire Extinguisher Compliance'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: '100%',
          backgroundColor: '#DC2626',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px',
        }}
      >
        {/* Fire extinguisher icon */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginRight: '80px',
          }}
        >
          <svg
            width="180"
            height="280"
            viewBox="0 0 180 280"
            fill="none"
          >
            <rect x="50" y="20" width="30" height="40" rx="6" fill="white" />
            <rect x="80" y="28" width="50" height="14" rx="7" fill="white" />
            <rect x="40" y="55" width="100" height="200" rx="16" fill="white" />
            <circle cx="90" cy="130" r="24" fill="#DC2626" />
            <rect x="80" y="160" width="20" height="50" rx="4" fill="#DC2626" />
          </svg>
        </div>

        {/* Text content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              fontSize: 80,
              fontWeight: 700,
              color: 'white',
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
            }}
          >
            FE Tracker
          </div>
          <div
            style={{
              fontSize: 32,
              fontWeight: 400,
              color: 'rgba(255, 255, 255, 0.85)',
              marginTop: '20px',
              lineHeight: 1.4,
              maxWidth: '500px',
            }}
          >
            NFPA 10 Compliant Fire Extinguisher Tracking
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
