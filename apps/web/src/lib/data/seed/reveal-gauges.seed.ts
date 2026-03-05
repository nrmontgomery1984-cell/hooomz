/**
 * Reveal Gauges Seed — localStorage-based.
 *
 * Seeds 4 standard reveal gauges into 'hooomz_reveal_gauges'.
 * Guard: skips if SEED-REVEAL-001 already present.
 */

const STORAGE_KEY = 'hooomz_reveal_gauges';
const SENTINEL_ID = 'SEED-REVEAL-001';

interface RevealGauge {
  id: string;
  label: string;
  value: number;
  color: string;
}

const SEED_GAUGES: RevealGauge[] = [
  { id: 'SEED-REVEAL-001', label: '1/4"', value: 0.25, color: '#3B82F6' },
  { id: 'SEED-REVEAL-002', label: '3/8"', value: 0.375, color: '#10B981' },
  { id: 'SEED-REVEAL-003', label: '1/2"', value: 0.5, color: '#F59E0B' },
  { id: 'SEED-REVEAL-004', label: '5/8"', value: 0.625, color: '#EF4444' },
];

export function seedRevealGauges(): boolean {
  if (typeof window === 'undefined') return false;

  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const existing: RevealGauge[] = JSON.parse(raw);
      if (existing.some((g) => g.id === SENTINEL_ID)) return false; // already seeded
    } catch {
      // corrupt data — overwrite
    }
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_GAUGES));
  return true;
}
