import type { MetadataRoute } from 'next';
import { branding } from '@/config/branding';

export default function manifest(): MetadataRoute.Manifest {
  const appName = process.env.NEXT_PUBLIC_APP_NAME || 'TimeKast Factory';
  const shortName = process.env.NEXT_PUBLIC_APP_SHORT_NAME || appName;

  return {
    name: appName,
    short_name: shortName,
    description: process.env.NEXT_PUBLIC_APP_DESCRIPTION || 'Built with TimeKast Factory',
    start_url: '/',
    display: 'standalone',
    background_color: branding.backgroundColor,
    theme_color: branding.themeColor,
    icons: [
      { src: '/pwa/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/pwa/icon-512.png', sizes: '512x512', type: 'image/png' },
      {
        src: '/pwa/maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
