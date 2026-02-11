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
  learner: { bg: '#FEF3C7', text: '#92400E' },
  proven: { bg: '#D1FAE5', text: '#065F46' },
  lead: { bg: '#DBEAFE', text: '#1E40AF' },
  master: { bg: '#F3E8FF', text: '#6B21A8' },
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
    <div className="min-h-screen pb-24" style={{ background: '#F3F4F6' }}>
      {/* Header */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E5E7EB' }}>
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center gap-2 mb-1">
            <Link href="/labs" className="text-sm hover:underline" style={{ color: '#0F766E' }}>Labs</Link>
            <span className="text-xs text-gray-400">/</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield size={20} style={{ color: '#0F766E' }} />
            <h1 className="text-xl font-bold" style={{ color: '#111827' }}>Training</h1>
          </div>
          <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>
            Crew certification status across {totalSops} SOPs
          </p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 mt-4 space-y-3">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-3 rounded-full animate-spin mx-auto mb-3" style={{ borderColor: '#E5E7EB', borderTopColor: '#0F766E' }} />
            <p className="text-sm text-gray-400">Loading training data...</p>
          </div>
        ) : crewMembers.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-400">No crew members found</p>
            <Link href="/labs/seed" className="text-xs mt-2 inline-block hover:underline" style={{ color: '#0F766E' }}>
              Seed data to get started
            </Link>
          </div>
        ) : (
          <>
            {/* Summary bar */}
            <div className="bg-white rounded-xl p-4" style={{ border: '1px solid #E5E7EB' }}>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold" style={{ color: '#10B981' }}>
                    {trainingRecords.filter((r) => r.status === 'certified').length}
                  </div>
                  <div className="text-xs" style={{ color: '#6B7280' }}>Certified</div>
                </div>
                <div>
                  <div className="text-lg font-bold" style={{ color: '#F59E0B' }}>
                    {trainingRecords.filter((r) => r.status === 'review_ready').length}
                  </div>
                  <div className="text-xs" style={{ color: '#6B7280' }}>Review Ready</div>
                </div>
                <div>
                  <div className="text-lg font-bold" style={{ color: '#3B82F6' }}>
                    {trainingRecords.filter((r) => r.status === 'in_progress').length}
                  </div>
                  <div className="text-xs" style={{ color: '#6B7280' }}>In Progress</div>
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
        style={{ border: '1px solid #E5E7EB' }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold"
              style={{ background: '#E5E7EB', color: '#374151' }}
            >
              {member.name.charAt(0)}
            </div>
            <div>
              <div className="text-sm font-semibold" style={{ color: '#111827' }}>{member.name}</div>
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: '#6B7280' }}>{member.role}</span>
                <span
                  className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                  style={{ background: tierColors.bg, color: tierColors.text }}
                >
                  {TIER_LABELS[member.tier]}
                </span>
              </div>
            </div>
          </div>
          <ChevronRight size={16} style={{ color: '#9CA3AF' }} />
        </div>

        {/* Progress bar */}
        <div className="mb-2">
          <div className="flex justify-between text-xs mb-1">
            <span style={{ color: '#6B7280' }}>
              {stats.certified}/{totalSops} SOPs certified
            </span>
            <span className="font-medium" style={{ color: certPct >= 80 ? '#10B981' : certPct >= 50 ? '#F59E0B' : '#6B7280' }}>
              {certPct}%
            </span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: '#F3F4F6' }}>
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${certPct}%`,
                background: certPct >= 80 ? '#10B981' : certPct >= 50 ? '#F59E0B' : '#3B82F6',
                minWidth: certPct > 0 ? '4px' : '0',
              }}
            />
          </div>
        </div>

        {/* Status pills */}
        <div className="flex gap-2">
          {stats.reviewReady > 0 && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: '#FEF3C7', color: '#92400E' }}>
              {stats.reviewReady} review ready
            </span>
          )}
          {stats.inProgress > 0 && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: '#DBEAFE', color: '#1E40AF' }}>
              {stats.inProgress} in progress
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
