import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import { Providers } from '@/components/providers/Providers';
import { branding } from '@/config/branding';
import { SerwistProvider } from './serwist';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
});

export const viewport: Viewport = {
  themeColor: branding.themeColor,
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    template: `${process.env.NEXT_PUBLIC_APP_NAME || 'AgendaInteligente'} | %s`,
    default: process.env.NEXT_PUBLIC_APP_NAME || 'AgendaInteligente',
  },
  description:
    process.env.NEXT_PUBLIC_APP_DESCRIPTION ||
    'Agenda con asistente IA — la app que no te deja mentirte sobre tu tiempo.',
  openGraph: {
    title: process.env.NEXT_PUBLIC_APP_NAME || 'AgendaInteligente',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: process.env.NEXT_PUBLIC_APP_NAME || 'AgendaInteligente',
  },
  icons: {
    icon: '/icon.png', // Transparent favicon for browser tab
    apple: { url: '/pwa/apple-touch-icon.png', sizes: '180x180' }, // Opaque icon for iOS
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // lang="es" — Factory default for Spanish-first projects. Change per project.
    <html lang="es" className="dark" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <SerwistProvider swUrl="/serwist/sw.js">
          <Providers>{children}</Providers>
          <Toaster />
        </SerwistProvider>
      </body>
    </html>
  );
}
