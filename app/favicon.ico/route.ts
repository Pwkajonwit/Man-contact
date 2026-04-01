const faviconSvg = `
<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="8" y1="6" x2="56" y2="58" gradientUnits="userSpaceOnUse">
      <stop stop-color="#A3E635"/>
      <stop offset="1" stop-color="#16A34A"/>
    </linearGradient>
  </defs>
  <rect width="64" height="64" rx="15" fill="url(#bg)"/>
  <rect x="11.5" y="15" width="41" height="34" rx="5" fill="#F8FAFC"/>
  <rect x="15.25" y="19.25" width="9.75" height="9.75" rx="3" fill="#D9F99D"/>
  <path d="M18.625 25.625C18.625 23.623 20.248 22 22.25 22C24.252 22 25.875 23.623 25.875 25.625C25.875 27.627 24.252 29.25 22.25 29.25C20.248 29.25 18.625 27.627 18.625 25.625Z" fill="#166534"/>
  <path d="M17.125 32.75C17.125 30.6789 18.8039 29 20.875 29H23.625C25.6961 29 27.375 30.6789 27.375 32.75V33.75H17.125V32.75Z" fill="#166534"/>
  <rect x="29" y="20.75" width="16.5" height="2.75" rx="1.375" fill="#0F172A" fill-opacity="0.88"/>
  <rect x="29" y="25.75" width="13.75" height="2.25" rx="1.125" fill="#64748B"/>
  <rect x="15.25" y="37.75" width="30.25" height="2.5" rx="1.25" fill="#CBD5E1"/>
  <rect x="15.25" y="42" width="22.5" height="2.5" rx="1.25" fill="#E2E8F0"/>
  <circle cx="47.125" cy="43.125" r="7" fill="#166534"/>
  <path d="M45.75 40.375L48.75 43.125L45.75 45.875" stroke="#F8FAFC" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M42 43.125H48.5" stroke="#F8FAFC" stroke-width="2.25" stroke-linecap="round"/>
</svg>
`.trim();

export function GET() {
  return new Response(faviconSvg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
