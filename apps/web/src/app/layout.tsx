import type { Metadata } from 'next';
import { Providers } from './providers';
import { BottomNav } from '@/components/navigation/BottomNav';
import { Sidebar } from '@/components/navigation/Sidebar';
import { QuickAddSheet } from '@/components/activity/QuickAddSheet';
import { DevTools } from '@/components/dev/DevTools';
import { CrewGate } from '@/components/crew/CrewGate';
import { TimeClockWidget } from '@/components/timeclock/TimeClockWidget';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import './globals.css';

export const metadata: Metadata = {
  title: 'Hooomz',
  description: 'Construction management for small contractors',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body style={{ backgroundColor: 'var(--theme-background)' }}>
        <Providers>
          <ErrorBoundary>
            <CrewGate>
              <div className="flex min-h-screen">
                <Sidebar />
                <main className="flex-1 min-h-screen min-w-0">
                  {children}
                </main>
              </div>
              <BottomNav />
              <TimeClockWidget />
              <QuickAddSheet />
              <DevTools />
            </CrewGate>
          </ErrorBoundary>
        </Providers>
      </body>
    </html>
  );
}
