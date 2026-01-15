'use client';

/**
 * Client-side providers wrapper
 * Separates client components from server layout
 */

import { ServicesProvider } from '@/lib/services/ServicesContext';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return <ServicesProvider>{children}</ServicesProvider>;
}
