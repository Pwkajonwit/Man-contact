import { ImageResponse } from 'next/og';

export const size = {
  width: 180,
  height: 180,
};

export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #A3E635 0%, #16A34A 100%)',
        }}
      >
        <div
          style={{
            width: 180,
            height: 180,
            display: 'flex',
            position: 'relative',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: 32,
              top: 42,
              width: 116,
              height: 96,
              borderRadius: 16,
              background: '#F8FAFC',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 42,
              top: 54,
              width: 28,
              height: 28,
              borderRadius: 8,
              background: '#D9F99D',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 51,
              top: 60,
              width: 10,
              height: 10,
              borderRadius: 999,
              background: '#166534',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 47,
              top: 72,
              width: 18,
              height: 10,
              borderTopLeftRadius: 10,
              borderTopRightRadius: 10,
              borderBottomLeftRadius: 3,
              borderBottomRightRadius: 3,
              background: '#166534',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 81,
              top: 58,
              width: 46,
              height: 8,
              borderRadius: 999,
              background: 'rgba(15, 23, 42, 0.88)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 81,
              top: 74,
              width: 38,
              height: 6,
              borderRadius: 999,
              background: '#64748B',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 42,
              top: 106,
              width: 86,
              height: 7,
              borderRadius: 999,
              background: '#CBD5E1',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 42,
              top: 119,
              width: 64,
              height: 7,
              borderRadius: 999,
              background: '#E2E8F0',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 117,
              top: 100,
              width: 40,
              height: 40,
              borderRadius: 999,
              background: '#166534',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 95,
              top: 118,
              width: 24,
              height: 4,
              borderRadius: 999,
              background: '#F8FAFC',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 127,
              top: 110,
              width: 14,
              height: 4,
              borderRadius: 999,
              background: '#F8FAFC',
              transform: 'rotate(45deg)',
              transformOrigin: 'right center',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 127,
              top: 122,
              width: 14,
              height: 4,
              borderRadius: 999,
              background: '#F8FAFC',
              transform: 'rotate(-45deg)',
              transformOrigin: 'right center',
            }}
          />
        </div>
      </div>
    ),
    size
  );
}
