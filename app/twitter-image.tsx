import { ImageResponse } from 'next/og';

// Image metadata
export const alt = 'Ask AI Legal™ - AI-Powered Legal Assistant';
export const size = {
  width: 1200,
  height: 600,
};

export const contentType = 'image/png';

// Image generation for Twitter
export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 56,
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontFamily: 'system-ui, sans-serif',
          position: 'relative',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '50px',
          }}
        >
          <div
            style={{
              fontSize: 68,
              fontWeight: 'bold',
              marginBottom: 20,
              textShadow: '3px 3px 6px rgba(0,0,0,0.4)',
            }}
          >
            Ask AI Legal™
          </div>
          <div
            style={{
              fontSize: 32,
              fontWeight: 'normal',
              opacity: 0.95,
              maxWidth: '850px',
              lineHeight: 1.4,
              textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
            }}
          >
            Your AI-Powered Legal Assistant
          </div>
          <div
            style={{
              fontSize: 24,
              marginTop: 25,
              opacity: 0.85,
              fontStyle: 'italic',
            }}
          >
            Navigate legal matters with confidence
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
