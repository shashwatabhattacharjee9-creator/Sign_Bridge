import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SignBridge | Edge-Native Offline ISL Recognition',
  description:
    '100% Local, Zero-Cloud Real-Time Indian Sign Language (ISL) Recognition and Two-Way Translation Engine.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#000000',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-black text-white flex flex-col selection:bg-white selection:text-black antialiased">
        {children}
      </body>
    </html>
  );
}
