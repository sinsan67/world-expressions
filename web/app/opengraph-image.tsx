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
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          padding: '60px',
        }}
      >
        <div
          style={{
            fontSize: 80,
            fontWeight: 700,
            color: 'white',
            letterSpacing: '-3px',
            textAlign: 'center',
          }}
        >
          World Expressions
        </div>
        <div
          style={{
            fontSize: 34,
            color: '#c4b5fd',
            marginTop: 28,
            fontStyle: 'italic',
            textAlign: 'center',
          }}
        >
          Every language has its own madness.
        </div>
        <div
          style={{
            fontSize: 22,
            color: '#6d28d9',
            marginTop: 60,
          }}
        >
          world-expressions.vercel.app
        </div>
      </div>
    )
  )
}
