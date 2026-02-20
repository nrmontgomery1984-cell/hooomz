'use client';

// ============================================================================
// Crew & Training Panel — Crew certification progress per project SOPs
// ============================================================================

import Link from 'next/link';
import type { TrainingRecord } from '@hooomz/shared-contracts';
import { PanelSection } from '@/components/ui/PanelSection';

interface CrewMember {
  id: string;
  name: string;
  tier: string;
  isActive: boolean;
}

interface CrewTrainingPanelProps {
  crewMembers: CrewMember[];
  trainingRecords: TrainingRecord[];
  projectSopCodes: string[];
}

const TIER_STYLES: Record<string, { color: string; bg: string }> = {
  master:  { color: 'var(--green)',  bg: 'var(--green-dim)'  },
  lead:    { color: 'var(--blue)',   bg: 'var(--blue-dim)'   },
  proven:  { color: 'var(--amber)',  bg: 'var(--amber-dim)'  },
  learner: { color: 'var(--text-3)', bg: 'var(--surface-3)'  },
};

export function CrewTrainingPanel({
  crewMembers,
  trainingRecords,
  projectSopCodes,
}: CrewTrainingPanelProps) {
  if (crewMembers.length === 0) {
    return (
      <PanelSection label="Crew & Training">
        <div style={{ padding: '6px 12px' }}>
          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>No active crew</span>
        </div>
      </PanelSection>
    );
  }

  const totalSops = projectSopCodes.length;

  const crewSummaries = crewMembers.map((member) => {
    const memberRecords = trainingRecords.filter((r) => r.crewMemberId === member.id);
    const certifiedSops = projectSopCodes.filter((code) =>
      memberRecords.some((r) => r.sopCode === code && r.status === 'certified')
    );
    const gaps = projectSopCodes.filter((code) =>
      !memberRecords.some((r) => r.sopCode === code && r.status === 'certified')
    );
    return { ...member, certifiedCount: certifiedSops.length, gaps };
  });

  const allGaps: Array<{ sopCode: string; crewName: string }> = [];
  for (const s of crewSummaries) {
    for (const gap of s.gaps) {
      allGaps.push({ sopCode: gap, crewName: s.name });
    }
  }

  const gapCount = allGaps.length;

  return (
    <PanelSection
      label="Crew & Training"
      count={gapCount > 0 ? gapCount : undefined}
      countColor="var(--amber)"
    >
      <div style={{ padding: '4px 0' }}>
        {crewSummaries.map((member) => {
          const pct = totalSops > 0 ? Math.round((member.certifiedCount / totalSops) * 100) : 0;
          const tierStyle = TIER_STYLES[member.tier] || { color: 'var(--text-3)', bg: 'var(--surface-3)' };
          const tierColor = tierStyle.color;

          return (
            <div key={member.id} style={{ padding: '5px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: totalSops > 0 ? 4 : 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Link
                    href={`/labs/training/${member.id}`}
                    style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', textDecoration: 'none' }}
                  >
                    {member.name}
                  </Link>
                  <span
                    style={{
                      fontFamily: 'var(--font-cond)',
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      padding: '1px 5px',
                      borderRadius: 2,
                      background: tierStyle.bg,
                      color: tierColor,
                    }}
                  >
                    {member.tier}
                  </span>
                </div>
                {totalSops > 0 && (
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-2)' }}>
                    {member.certifiedCount}/{totalSops}
                  </span>
                )}
              </div>
              {totalSops > 0 && (
                <div style={{ height: 3, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${pct}%`,
                      background: pct === 100 ? 'var(--green)' : tierColor,
                      borderRadius: 2,
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}

        {/* Training gaps */}
        {allGaps.length > 0 && totalSops > 0 && (
          <div style={{ borderTop: '1px solid var(--border)', margin: '4px 0 0', padding: '5px 12px 2px' }}>
            <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--amber)' }}>
              Gaps: {allGaps.slice(0, 3).map((g) => `${g.sopCode} (${g.crewName})`).join(', ')}
              {allGaps.length > 3 && ` +${allGaps.length - 3} more`}
            </span>
          </div>
        )}
      </div>
    </PanelSection>
  );
}
