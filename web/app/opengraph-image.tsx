import { ImageResponse } from 'next/og'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#fdf8ee',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Georgia, serif',
          position: 'relative',
        }}
      >
        {/* Top accent bar */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 10, background: '#6b4d8f', display: 'flex' }} />

        {/* Content */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ fontSize: 100, lineHeight: 1, display: 'flex' }}>🌍</div>

          <div style={{ fontSize: 92, color: '#1c1410', lineHeight: 1.1, marginTop: 24, display: 'flex', gap: 20 }}>
            <span>World</span>
            <span style={{ color: '#6b4d8f', display: 'flex' }}>Expressions</span>
          </div>

          <div style={{ width: 80, height: 4, background: '#c1543a', borderRadius: 2, marginTop: 28, display: 'flex' }} />

          <div style={{ fontSize: 36, color: '#5c4f47', fontStyle: 'italic', marginTop: 24, display: 'flex' }}>
            Every language has its own madness.
          </div>
        </div>

        {/* Bottom accent bar */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 8, background: '#c1543a', display: 'flex' }} />
      </div>
    )
  )
}
