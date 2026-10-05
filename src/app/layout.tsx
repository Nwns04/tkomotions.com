import type { Metadata } from 'next';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { SmoothScroll } from '@/components/layout/SmoothScroll';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://tkomotions.com'),
  title: {
    default: 'TKO Motions — Business Innovation & Digital Solutions',
    template: '%s | TKO Motions',
  },
  description: 'We identify the friction, build practical systems, and help businesses move forward.',
  icons: {
    icon: [
      { url: '/favicon.ico', type: 'image/x-icon' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  openGraph: {
    type: 'website',
    locale: 'en_NG',
    url: 'https://tkomotions.com',
    siteName: 'TKO Motions',
    title: 'TKO Motions — Business Innovation & Digital Solutions',
    description: 'We identify the friction, build practical systems, and help businesses move forward.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TKO Motions',
    description: 'Business Innovation & Digital Solutions. Innovate. Build. Move.',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Space+Grotesk:wght@400;500;600;700&display=swap" />
      </head>
      <body className="flex min-h-screen flex-col">
        <SmoothScroll>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </SmoothScroll>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'TKO Motions Ltd',
          url: 'https://tkomotions.com/',
          email: 'temitopekehinde@tkomotions.com',
          telephone: '+2347040739828',
          description: 'A Nigerian Business Innovation & Digital Solutions company building practical digital systems around real business problems.',
          address: { '@type': 'PostalAddress', addressCountry: 'NG' },
          identifier: { '@type': 'PropertyValue', propertyID: 'CAC RC', value: '8976551' },
        }) }} />
      </body>
    </html>
  );
}