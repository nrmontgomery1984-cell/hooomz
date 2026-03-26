'use client';

/**
 * Client-side providers wrapper
 * Separates client components from server layout
 */

import { AuthProvider } from '@/context/AuthContext';
import { ServicesProvider } from '@/lib/services/ServicesContext';
import { ToastProvider } from '@/components/ui/Toast';
import { QueryProvider } from '@/lib/api';
import { ThemeProvider } from '@/lib/theme';
import { QuickAddProvider } from '@/components/activity/QuickAddContext';
import { ActiveCrewProvider } from '@/lib/crew/ActiveCrewContext';
import { ViewModeProvider } from '@/lib/viewmode';
import { SyncRefreshListener } from '@/lib/sync/SyncRefreshListener';
import { RevealGaugeProvider } from '@/lib/contexts/RevealGaugeContext';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <AuthProvider>
      <ThemeProvider>
        <ViewModeProvider>
          <QueryProvider>
            <SyncRefreshListener />
            <ServicesProvider>
              <ActiveCrewProvider>
                <ToastProvider>
                  <RevealGaugeProvider>
                    <QuickAddProvider>{children}</QuickAddProvider>
                  </RevealGaugeProvider>
                </ToastProvider>
              </ActiveCrewProvider>
            </ServicesProvider>
          </QueryProvider>
        </ViewModeProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
