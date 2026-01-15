import type { Metadata } from 'next';
import { Navigation } from '@/components/ui/Navigation';
import { Providers } from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'Hooomz - Construction Management',
  description: 'Mobile-first construction management platform for contractors',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
  themeColor: '#0284c7',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Hooomz',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50">
        <Providers>
          <div className="flex flex-col min-h-screen">
            {/* Navigation */}
            <Navigation />

            {/* Main content */}
            <main className="flex-1 safe-bottom">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
