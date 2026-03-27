import type { Metadata, Viewport } from 'next';
import { Providers } from './providers';
import { BottomNav } from '@/components/navigation/BottomNav';
import { Sidebar } from '@/components/navigation/Sidebar';
import { QuickAddSheet } from '@/components/activity/QuickAddSheet';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration';
import { MobileModuleNav } from '@/components/navigation/MobileModuleNav';
import './globals.css';

export const viewport: Viewport = {
  themeColor: '#6B6560',
};

export const metadata: Metadata = {
  title: 'Hooomz',
  description: 'Construction management for small contractors',
  manifest: '/manifest.json',
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
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('hooomz-theme');if(t==='dark'){document.documentElement.setAttribute('data-theme','dark');document.documentElement.classList.add('dark')}}catch(e){}})()` }} />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Figtree:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body style={{ backgroundColor: 'var(--bg)', fontFamily: 'var(--font-body)' }}>
        <Providers>
          <ServiceWorkerRegistration />
          <ErrorBoundary>
            <div className="flex min-h-screen">
              <Sidebar />
              <main className="flex-1 min-h-screen min-w-0" style={{ background: 'var(--bg)', fontFamily: 'var(--font-body)' }}>
                <MobileModuleNav />
                <ProtectedRoute>{children}</ProtectedRoute>
              </main>
            </div>
            <BottomNav />
            <QuickAddSheet />
          </ErrorBoundary>
        </Providers>
      </body>
    </html>
  );
}
