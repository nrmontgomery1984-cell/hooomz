'use client';

/**
 * Client-side providers wrapper
 * Separates client components from server layout
 */

import { ServicesProvider } from '@/lib/services/ServicesContext';
import { ToastProvider } from '@/components/ui/Toast';
import { QueryProvider } from '@/lib/api';
import { ThemeProvider } from '@/lib/theme';
import { QuickAddProvider } from '@/components/activity/QuickAddContext';
import { ActiveCrewProvider } from '@/lib/crew/ActiveCrewContext';
import { ViewModeProvider } from '@/lib/viewmode';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider>
      <ViewModeProvider>
        <QueryProvider>
          <ServicesProvider>
            <ActiveCrewProvider>
              <ToastProvider>
                <QuickAddProvider>{children}</QuickAddProvider>
              </ToastProvider>
            </ActiveCrewProvider>
          </ServicesProvider>
        </QueryProvider>
      </ViewModeProvider>
    </ThemeProvider>
  );
}
