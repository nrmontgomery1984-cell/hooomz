'use client';

/**
 * Crew Gate Component (Build 3a)
 *
 * Checks for an active crew session. If none exists, renders CrewSelector.
 * Wraps app content to ensure crew identity is always available.
 */

import { usePathname } from 'next/navigation';
import { useActiveCrew } from '@/lib/crew/ActiveCrewContext';
import { CrewSelector } from './CrewSelector';

interface CrewGateProps {
  children: React.ReactNode;
}

export function CrewGate({ children }: CrewGateProps) {
  const pathname = usePathname();
  const { hasActiveSession, isLoading } = useActiveCrew();

  // Portal routes bypass crew gate — no crew session needed for homeowner view
  if (pathname?.startsWith('/portal')) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F3F4F6' }}>
        <div className="text-sm text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!hasActiveSession) {
    return <CrewSelector />;
  }

  return <>{children}</>;
}
