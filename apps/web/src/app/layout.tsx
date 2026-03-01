import type { Metadata } from 'next';
import { Providers } from './providers';
import { BottomNav } from '@/components/navigation/BottomNav';
import { Sidebar } from '@/components/navigation/Sidebar';
import { QuickAddSheet } from '@/components/activity/QuickAddSheet';
import { CrewGate } from '@/components/crew/CrewGate';

import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration';
import { MobileModuleNav } from '@/components/navigation/MobileModuleNav';
import './globals.css';

export const metadata: Metadata = {
  title: 'Hooomz',
  description: 'Construction management for small contractors',
  manifest: '/manifest.json',
  themeColor: '#2563EB',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Hooomz',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/apple-touch-icon.svg" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body style={{ backgroundColor: 'var(--bg)' }}>
        <Providers>
          <ServiceWorkerRegistration />
          <ErrorBoundary>
            <CrewGate>
              <div className="flex min-h-screen">
                <Sidebar />
                <main className="flex-1 min-h-screen min-w-0">
                  <MobileModuleNav />
                  {children}
                </main>
              </div>
              <BottomNav />

              <QuickAddSheet />
            </CrewGate>
          </ErrorBoundary>
        </Providers>
      </body>
    </html>
  );
}
