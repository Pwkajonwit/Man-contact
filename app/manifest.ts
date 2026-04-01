import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Man Contacts',
    short_name: 'Man Contacts',
    description: 'Business contact and employee directory management system.',
    start_url: '/',
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
