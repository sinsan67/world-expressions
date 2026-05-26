import { ImageResponse } from 'next/og'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #1e0b4b 0%, #312e81 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          padding: '60px',
          gap: '80px',
        }}
      >
        {/* Globe SVG */}
        <svg
          width="260"
          height="260"
          viewBox="0 0 100 100"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="50" cy="50" r="48" fill="#1d4ed8" />
          <path d="M51,5 C54,7 57,11 56,17 C55,21 52,23 52,27 C52,31 54,34 53,38 C52,42 50,46 50,51 C50,56 51,62 50,67 C49,72 47,76 48,80 C45,81 43,79 43,74 C43,68 42,62 43,57 C44,52 42,47 43,42 C44,38 46,34 45,29 C44,24 46,19 49,13 Z" fill="#16a34a" />
          <path d="M17,33 C21,29 26,31 25,38 C24,43 21,45 22,51 C23,57 21,63 20,70 C19,76 21,82 19,85 C15,83 13,76 14,69 C15,62 17,55 16,49 C15,43 13,37 17,33 Z" fill="#16a34a" />
          <path d="M69,32 C74,33 78,38 75,44 C73,47 70,46 68,43 C66,39 67,34 69,32 Z" fill="#16a34a" />
          <ellipse cx="50" cy="50" rx="47.5" ry="13" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
          <ellipse cx="50" cy="50" rx="13" ry="47.5" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
          <circle cx="50" cy="50" r="48" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
        </svg>

        {/* Text */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              fontSize: 78,
              fontWeight: 800,
              color: 'white',
              letterSpacing: '-2px',
              lineHeight: 1.1,
            }}
          >
            <span>World</span>
            <span style={{ color: '#c4b5fd' }}>Expressions</span>
          </div>
          <div
            style={{
              fontSize: 28,
              color: 'rgba(196,181,253,0.8)',
              fontStyle: 'italic',
            }}
          >
            Every language has its own madness.
          </div>
        </div>
      </div>
    )
  )
}
