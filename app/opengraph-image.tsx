import { ImageResponse } from 'next/og';

// Image metadata
export const alt = 'Ask AI Legal™ - Where Law Meets Intelligence';
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

// Image generation
export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 60,
          background: 'linear-gradient(to bottom right, #10b981, #059669)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '40px',
          }}
        >
          <div
            style={{
              fontSize: 72,
              fontWeight: 'bold',
              marginBottom: 20,
              textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
            }}
          >
            Ask AI Legal™
          </div>
          <div
            style={{
              fontSize: 36,
              fontWeight: 'normal',
              opacity: 0.95,
              maxWidth: '900px',
              textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
            }}
          >
            Where Law Meets Intelligence
          </div>
          <div
            style={{
              fontSize: 28,
              marginTop: 30,
              opacity: 0.9,
              fontStyle: 'italic',
            }}
          >
            Empowering access to justice with AI
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
