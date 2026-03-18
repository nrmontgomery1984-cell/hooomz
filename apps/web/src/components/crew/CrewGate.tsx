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

  // Portal, login, and intake routes bypass crew gate
  if (pathname?.startsWith('/portal') || pathname?.startsWith('/login') || pathname?.startsWith('/intake')) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg, #F0EDE8)' }}>
        <div className="text-sm text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!hasActiveSession) {
    return <CrewSelector />;
  }

  return <>{children}</>;
}
