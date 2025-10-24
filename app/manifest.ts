import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Ask AI Legal™ - AI-Powered Legal Assistant',
    short_name: 'Ask AI Legal™',
    description: 'Empowering access to justice with AI. Your AI-powered legal assistant, helping you navigate legal matters with confidence.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#10b981',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/favicon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any maskable',
      },
      {
        src: '/logo/logo.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
    categories: ['legal', 'productivity', 'business'],
    lang: 'en-US',
    dir: 'ltr',
    prefer_related_applications: false,
  };
}
