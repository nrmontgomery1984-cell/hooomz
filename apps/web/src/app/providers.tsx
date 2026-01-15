'use client';

/**
 * Client-side providers wrapper
 * Separates client components from server layout
 */

import { ServicesProvider } from '@/lib/services/ServicesContext';
import { ToastProvider } from '@/components/ui/Toast';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ServicesProvider>
      <ToastProvider>{children}</ToastProvider>
    </ServicesProvider>
  );
}
