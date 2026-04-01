import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Man Contacts',
    short_name: 'Contacts',
    description: 'contact and employee.',
    id: '/home',
    start_url: '/home',
    scope: '/',
    display: 'standalone',
    background_color: '#f3f4f6',
    theme_color: '#16A34A',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
      {
        src: '/apple-icon',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  };
}
