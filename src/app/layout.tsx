import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Helios | AI Infrastructure Cost & Energy Intelligence',
  description: 'Decision-grade AI infrastructure cost & energy intelligence platform. Analyze, model, and reduce the cost and energy footprint of your AI and data infrastructure.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
