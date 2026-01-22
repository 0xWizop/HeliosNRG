import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from '@/components/Providers';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Helios | AI Infrastructure Cost & Energy Intelligence',
    template: '%s | Helios',
  },
  description: 'Decision-grade AI infrastructure cost & energy intelligence platform. Analyze, model, and reduce the cost and energy footprint of your AI and data infrastructure.',
  openGraph: {
    type: 'website',
    siteName: 'Helios',
    title: 'Helios | AI Infrastructure Cost & Energy Intelligence',
    description: 'Decision-grade AI infrastructure cost & energy intelligence platform. Analyze, model, and reduce the cost and energy footprint of your AI and data infrastructure.',
    url: siteUrl,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Helios | AI Infrastructure Cost & Energy Intelligence',
    description: 'Decision-grade AI infrastructure cost & energy intelligence platform. Analyze, model, and reduce the cost and energy footprint of your AI and data infrastructure.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-neutral-950 text-neutral-300 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
