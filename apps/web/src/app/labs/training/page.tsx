'use client';

/**
 * Training Dashboard Page (Build 3c)
 *
 * Shows all crew members with their training status across SOPs.
 * Per-crew summary: certified count, in-progress, review-ready.
 * Links to per-crew detail view.
 */

import Link from 'next/link';
import { Shield, ChevronRight } from 'lucide-react';
import { useActiveCrewMembers } from '@/lib/hooks/useCrewData';
import { useTrainingRecords } from '@/lib/hooks/useCrewData';
import { useSops } from '@/lib/hooks/useLabsData';
import type { CrewMember, TrainingRecord, CrewTier } from '@hooomz/shared-contracts';

const TIER_LABELS: Record<CrewTier, string> = {
  learner: 'Learner',
  proven: 'Proven',
  lead: 'Lead',
  master: 'Master',
};

const TIER_COLORS: Record<CrewTier, { bg: string; text: string }> = {
  learner: { bg: 'var(--yellow-bg)', text: 'var(--yellow)' },
  proven: { bg: 'var(--green-bg)', text: 'var(--green)' },
  lead: { bg: 'var(--blue-bg)', text: 'var(--blue)' },
  master: { bg: 'var(--violet-bg)', text: 'var(--violet)' },
};

function getCrewTrainingStats(crewId: string, records: TrainingRecord[]) {
  const crewRecords = records.filter((r) => r.crewMemberId === crewId);
  return {
    total: crewRecords.length,
    certified: crewRecords.filter((r) => r.status === 'certified').length,
    reviewReady: crewRecords.filter((r) => r.status === 'review_ready').length,
    inProgress: crewRecords.filter((r) => r.status === 'in_progress').length,
  };
}

export default function TrainingDashboardPage() {
  const { data: crewMembers = [], isLoading: crewLoading } = useActiveCrewMembers();
  const { data: trainingRecords = [], isLoading: trainingLoading } = useTrainingRecords();
  const { data: sops = [] } = useSops();

  const isLoading = crewLoading || trainingLoading;
  const totalSops = sops.length;

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--surface-2)' }}>
      {/* Header */}
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center gap-2 mb-1">
            <Link href="/labs" className="text-sm hover:underline" style={{ color: 'var(--accent)' }}>Labs</Link>
            <span className="text-xs text-[var(--muted)]">/</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield size={20} style={{ color: 'var(--accent)' }} />
            <h1 className="text-xl font-bold" style={{ color: 'var(--charcoal)' }}>Training</h1>
          </div>
          <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
            Crew certification status across {totalSops} SOPs
          </p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 mt-4 space-y-3">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-3 rounded-full animate-spin mx-auto mb-3" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--accent)' }} />
            <p className="text-sm text-[var(--muted)]">Loading training data...</p>
          </div>
        ) : crewMembers.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-[var(--muted)]">No crew members found</p>
            <Link href="/labs/seed" className="text-xs mt-2 inline-block hover:underline" style={{ color: 'var(--accent)' }}>
              Seed data to get started
            </Link>
          </div>
        ) : (
          <>
            {/* Summary bar */}
            <div className="bg-white rounded-xl p-4" style={{ border: '1px solid var(--border)' }}>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold" style={{ color: 'var(--green)' }}>
                    {trainingRecords.filter((r) => r.status === 'certified').length}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--muted)' }}>Certified</div>
                </div>
                <div>
                  <div className="text-lg font-bold" style={{ color: 'var(--yellow)' }}>
                    {trainingRecords.filter((r) => r.status === 'review_ready').length}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--muted)' }}>Review Ready</div>
                </div>
                <div>
                  <div className="text-lg font-bold" style={{ color: 'var(--blue)' }}>
                    {trainingRecords.filter((r) => r.status === 'in_progress').length}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--muted)' }}>In Progress</div>
                </div>
              </div>
            </div>

            {/* Crew member cards */}
            {crewMembers.map((member) => (
              <CrewTrainingCard
                key={member.id}
                member={member}
                stats={getCrewTrainingStats(member.id, trainingRecords)}
                totalSops={totalSops}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}

function CrewTrainingCard({
  member,
  stats,
  totalSops,
}: {
  member: CrewMember;
  stats: { total: number; certified: number; reviewReady: number; inProgress: number };
  totalSops: number;
}) {
  const tierColors = TIER_COLORS[member.tier];
  const certPct = totalSops > 0 ? Math.round((stats.certified / totalSops) * 100) : 0;

  return (
    <Link href={`/labs/training/${member.id}`}>
      <div
        className="bg-white rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer"
        style={{ border: '1px solid var(--border)' }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold"
              style={{ background: 'var(--border)', color: 'var(--mid)' }}
            >
              {member.name.charAt(0)}
            </div>
            <div>
              <div className="text-sm font-semibold" style={{ color: 'var(--charcoal)' }}>{member.name}</div>
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: 'var(--muted)' }}>{member.role}</span>
                <span
                  className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                  style={{ background: tierColors.bg, color: tierColors.text }}
                >
                  {TIER_LABELS[member.tier]}
                </span>
              </div>
            </div>
          </div>
          <ChevronRight size={16} style={{ color: 'var(--muted)' }} />
        </div>

        {/* Progress bar */}
        <div className="mb-2">
          <div className="flex justify-between text-xs mb-1">
            <span style={{ color: 'var(--muted)' }}>
              {stats.certified}/{totalSops} SOPs certified
            </span>
            <span className="font-medium" style={{ color: certPct >= 80 ? 'var(--green)' : certPct >= 50 ? 'var(--yellow)' : 'var(--muted)' }}>
              {certPct}%
            </span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${certPct}%`,
                background: certPct >= 80 ? 'var(--green)' : certPct >= 50 ? 'var(--yellow)' : 'var(--blue)',
                minWidth: certPct > 0 ? '4px' : '0',
              }}
            />
          </div>
        </div>

        {/* Status pills */}
        <div className="flex gap-2">
          {stats.reviewReady > 0 && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: 'var(--yellow-bg)', color: 'var(--yellow)' }}>
              {stats.reviewReady} review ready
            </span>
          )}
          {stats.inProgress > 0 && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: 'var(--blue-bg)', color: 'var(--blue)' }}>
              {stats.inProgress} in progress
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
