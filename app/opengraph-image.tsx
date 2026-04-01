import { ImageResponse } from 'next/og';

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '56px 64px',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #f8fafc 0%, #ecfccb 45%, #dcfce7 100%)',
          color: '#0f172a',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -100,
            right: -80,
            width: 380,
            height: 380,
            borderRadius: 9999,
            background: 'rgba(22, 163, 74, 0.10)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -120,
            left: -80,
            width: 320,
            height: 320,
            borderRadius: 9999,
            background: 'rgba(163, 230, 53, 0.18)',
          }}
        />

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            maxWidth: 620,
            zIndex: 1,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 18,
              marginBottom: 28,
            }}
          >
            <div
              style={{
                width: 74,
                height: 74,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 22,
                background: 'linear-gradient(135deg, #A3E635 0%, #16A34A 100%)',
                color: '#ffffff',
                fontSize: 32,
                fontWeight: 900,
              }}
            >
              MC
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div style={{ fontSize: 34, fontWeight: 900, letterSpacing: -1 }}>
                Man Contacts
              </div>
              <div style={{ fontSize: 18, color: '#166534', fontWeight: 700 }}>
                Contact Directory
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              fontSize: 62,
              lineHeight: 1.04,
              fontWeight: 900,
              letterSpacing: -2,
            }}
          >
            <div style={{ display: 'flex' }}>แชร์รายชื่อผู้ติดต่อ</div>
            <div style={{ display: 'flex' }}>พร้อมข้อมูลสำคัญ</div>
          </div>

          <div
            style={{
              marginTop: 22,
              fontSize: 28,
              lineHeight: 1.35,
              color: '#475569',
              fontWeight: 600,
              display: 'flex',
              maxWidth: 580,
            }}
          >
            โทร แชร์ เปิดแผนที่ และเข้าถึงหน้าข้อมูลลูกค้าได้ทันทีจากลิงก์เดียว
          </div>
        </div>

        <div
          style={{
            width: 360,
            height: 360,
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1,
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 88,
              background: 'linear-gradient(135deg, #A3E635 0%, #16A34A 100%)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 60,
              top: 72,
              width: 230,
              height: 190,
              borderRadius: 30,
              background: '#F8FAFC',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 82,
              top: 96,
              width: 54,
              height: 54,
              borderRadius: 16,
              background: '#D9F99D',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 101,
              top: 110,
              width: 18,
              height: 18,
              borderRadius: 999,
              background: '#166534',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 94,
              top: 133,
              width: 32,
              height: 18,
              borderTopLeftRadius: 18,
              borderTopRightRadius: 18,
              borderBottomLeftRadius: 5,
              borderBottomRightRadius: 5,
              background: '#166534',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 158,
              top: 106,
              width: 90,
              height: 14,
              borderRadius: 999,
              background: 'rgba(15, 23, 42, 0.88)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 158,
              top: 132,
              width: 74,
              height: 11,
              borderRadius: 999,
              background: '#64748B',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 82,
              top: 190,
              width: 166,
              height: 12,
              borderRadius: 999,
              background: '#CBD5E1',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 82,
              top: 212,
              width: 124,
              height: 12,
              borderRadius: 999,
              background: '#E2E8F0',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 228,
              top: 188,
              width: 76,
              height: 76,
              borderRadius: 999,
              background: '#166534',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 186,
              top: 220,
              width: 60,
              height: 8,
              borderRadius: 999,
              background: '#F8FAFC',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 242,
              top: 208,
              width: 26,
              height: 8,
              borderRadius: 999,
              background: '#F8FAFC',
              transform: 'rotate(45deg)',
              transformOrigin: 'right center',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 242,
              top: 230,
              width: 26,
              height: 8,
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
