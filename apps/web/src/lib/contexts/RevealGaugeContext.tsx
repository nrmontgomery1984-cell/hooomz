'use client';

/**
 * RevealGaugeContext — provides reveal gauge list + active selection.
 *
 * Reads from localStorage key 'hooomz_reveal_gauges' on mount.
 * Falls back to 4 hardcoded defaults if localStorage is empty/missing.
 */

import { createContext, useState, useEffect, type ReactNode } from 'react';

export interface RevealGauge {
  id: string;
  label: string;
  value: number;   // inches
  color: string;   // hex
}

export interface RevealGaugeContextValue {
  gauges: RevealGauge[];
  activeGauge: RevealGauge;
  setActiveGauge: (g: RevealGauge) => void;
}

const STORAGE_KEY = 'hooomz_reveal_gauges';

const DEFAULT_GAUGES: RevealGauge[] = [
  { id: 'SEED-REVEAL-001', label: '1/4"',  value: 0.25,  color: '#3B82F6' },
  { id: 'SEED-REVEAL-002', label: '3/8"',  value: 0.375, color: '#10B981' },
  { id: 'SEED-REVEAL-003', label: '1/2"',  value: 0.5,   color: '#F59E0B' },
  { id: 'SEED-REVEAL-004', label: '5/8"',  value: 0.625, color: '#EF4444' },
];

function loadGauges(): RevealGauge[] {
  if (typeof window === 'undefined') return DEFAULT_GAUGES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as RevealGauge[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // corrupt — fall through
  }
  return DEFAULT_GAUGES;
}

function pickDefault(gauges: RevealGauge[]): RevealGauge {
  return gauges.find((g) => g.value === 0.375) ?? gauges[0];
}

const initialGauges = DEFAULT_GAUGES;
const initialActive = pickDefault(initialGauges);

export const RevealGaugeContext = createContext<RevealGaugeContextValue>({
  gauges: initialGauges,
  activeGauge: initialActive,
  setActiveGauge: () => {},
});

export function RevealGaugeProvider({ children }: { children: ReactNode }) {
  const [gauges, setGauges] = useState<RevealGauge[]>(DEFAULT_GAUGES);
  const [activeGauge, setActiveGauge] = useState<RevealGauge>(initialActive);

  // Load from localStorage on mount (client only)
  useEffect(() => {
    const loaded = loadGauges();
    setGauges(loaded);
    setActiveGauge(pickDefault(loaded));
  }, []);

  return (
    <RevealGaugeContext.Provider value={{ gauges, activeGauge, setActiveGauge }}>
      {children}
    </RevealGaugeContext.Provider>
  );
}
