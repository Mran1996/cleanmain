import { ImageResponse } from 'next/og';

// Apple icon metadata
export const size = {
  width: 180,
  height: 180,
};
export const contentType = 'image/png';

// Apple icon generation
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 80,
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          borderRadius: 40,
          fontWeight: 'bold',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        AL
      </div>
    ),
    {
      ...size,
    }
  );
}
