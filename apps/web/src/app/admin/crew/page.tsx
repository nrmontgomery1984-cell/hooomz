'use client';

/**
 * Crew Management — View crew members and training status
 */

import Link from 'next/link';
import { PageErrorBoundary } from '@/components/ui/PageErrorBoundary';
import { UsersRound, ChevronRight, GraduationCap } from 'lucide-react';
import { useActiveCrewMembers, useTrainingRecords } from '@/lib/hooks/useCrewData';
import { SECTION_COLORS } from '@/lib/viewmode';

const ADMIN_COLOR = SECTION_COLORS.admin;

const TIER_LABELS: Record<string, { label: string; color: string }> = {
  learner: { label: 'Learner', color: 'var(--text-3)' },
  proven: { label: 'Proven', color: 'var(--blue)' },
  lead: { label: 'Lead', color: 'var(--amber)' },
  master: { label: 'Master', color: 'var(--green)' },
};

export default function CrewPage() {
  const { data: crewMembers = [], isLoading: crewLoading } = useActiveCrewMembers();
  const { data: trainingRecords = [], isLoading: trLoading } = useTrainingRecords();

  const isLoading = crewLoading || trLoading;

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 32, height: 32, border: '2px solid var(--border)', borderTopColor: ADMIN_COLOR, borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 8px' }} />
          <p style={{ fontSize: 11, color: 'var(--text-3)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <PageErrorBoundary>
      <div style={{ minHeight: '100vh', paddingBottom: 96, background: 'var(--bg)' }}>

        {/* Header */}
        <div style={{ background: 'var(--surface-1)', borderBottom: '1px solid var(--border)' }}>
          <div className="max-w-lg md:max-w-full mx-auto px-4 md:px-6 py-3 md:py-4">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: ADMIN_COLOR }} />
              <h1 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-cond)', letterSpacing: '0.02em' }}>
                Crew Management
              </h1>
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>Team members and certifications</p>
          </div>
        </div>

        <div className="max-w-lg md:max-w-full mx-auto px-4 md:px-6">

          {/* Crew List */}
          <div style={{ marginTop: 16 }}>
            <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
              {crewMembers.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center' }}>
                  <UsersRound size={20} style={{ color: 'var(--text-3)', margin: '0 auto 8px' }} />
                  <p style={{ fontSize: 12, color: 'var(--text-3)' }}>No crew members found</p>
                </div>
              ) : (
                crewMembers.map((crew, i) => {
                  const records = trainingRecords.filter((t) => t.crewMemberId === crew.id);
                  const certified = records.filter((t) => t.status === 'certified').length;
                  const tier = TIER_LABELS[crew.tier] || TIER_LABELS.learner;
                  const initials = crew.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2);

                  return (
                    <Link
                      key={crew.id}
                      href={`/labs/training/${crew.id}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '12px 16px',
                        borderBottom: i < crewMembers.length - 1 ? '1px solid var(--border)' : 'none',
                        textDecoration: 'none',
                        minHeight: 56,
                      }}
                    >
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: ADMIN_COLOR,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: 'var(--font-cond)', fontSize: 12, fontWeight: 700, color: 'white',
                        flexShrink: 0,
                      }}>
                        {initials}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{crew.name}</span>
                          <span style={{
                            fontFamily: 'var(--font-cond)', fontSize: 9, fontWeight: 700,
                            letterSpacing: '0.06em', textTransform: 'uppercase',
                            padding: '1px 5px', borderRadius: 2,
                            color: tier.color,
                            background: `${tier.color}15`,
                          }}>
                            {tier.label}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                          <GraduationCap size={11} style={{ color: 'var(--text-3)' }} />
                          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
                            {certified}/{records.length} certifications
                          </span>
                          {crew.wageRate > 0 && (
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)', marginLeft: 8 }}>
                              ${crew.wageRate}/hr
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight size={14} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </PageErrorBoundary>
  );
}
