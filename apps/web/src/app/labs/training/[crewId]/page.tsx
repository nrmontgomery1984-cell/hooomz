'use client';

/**
 * Crew Training Detail Page (Build 3c)
 *
 * Shows per-SOP training progression for a single crew member.
 * Lists all SOPs with completion count, review status, certification status.
 * Includes certification modal (manual signoff) and review recording.
 */

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { CheckCircle2, AlertTriangle, X } from 'lucide-react';
import { useCrewMember, useCrewTrainingRecords, useCertifyCrew, useRecordReviewAttempt } from '@/lib/hooks/useCrewData';
import { useSops } from '@/lib/hooks/useLabsData';
import { useActiveCrew } from '@/lib/crew/ActiveCrewContext';
import type { CrewTier, TrainingRecord, Sop, TrainingStatus } from '@hooomz/shared-contracts';

const TIER_LABELS: Record<CrewTier, string> = {
  learner: 'Learner',
  proven: 'Proven',
  lead: 'Lead',
  master: 'Master',
};

const STATUS_CONFIG: Record<TrainingStatus, { bg: string; text: string; label: string }> = {
  in_progress: { bg: '#DBEAFE', text: '#1E40AF', label: 'In Progress' },
  review_ready: { bg: '#FEF3C7', text: '#92400E', label: 'Review Ready' },
  certified: { bg: '#D1FAE5', text: '#065F46', label: 'Certified' },
};

export default function CrewTrainingDetailPage() {
  const params = useParams();
  const crewId = params.crewId as string;
  const { crewMemberId: activeCrewId } = useActiveCrew();

  const { data: member, isLoading: memberLoading } = useCrewMember(crewId);
  const { data: records = [], isLoading: recordsLoading } = useCrewTrainingRecords(crewId);
  const { data: sops = [] } = useSops();

  const [certifyingSop, setCertifyingSop] = useState<{ sopId: string; sopCode: string } | null>(null);
  const [reviewingSop, setReviewingSop] = useState<{ sopId: string; sopCode: string; record: TrainingRecord } | null>(null);

  const isLoading = memberLoading || recordsLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen pb-24" style={{ background: '#F3F4F6' }}>
        <div className="max-w-lg mx-auto px-4 py-12 text-center">
          <div className="w-8 h-8 border-3 rounded-full animate-spin mx-auto mb-3" style={{ borderColor: '#E5E7EB', borderTopColor: '#0F766E' }} />
          <p className="text-sm text-gray-400">Loading training data...</p>
        </div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="min-h-screen pb-24" style={{ background: '#F3F4F6' }}>
        <div className="max-w-lg mx-auto px-4 py-12 text-center">
          <p className="text-sm text-gray-500">Crew member not found</p>
          <Link href="/labs/training" className="text-sm hover:underline mt-2 inline-block" style={{ color: '#0F766E' }}>
            Back to Training
          </Link>
        </div>
      </div>
    );
  }

  // Build a map of sopId → record for quick lookup
  const recordMap = new Map(records.map((r) => [r.sopId, r]));

  const certified = records.filter((r) => r.status === 'certified').length;
  const totalSops = sops.length;
  const certPct = totalSops > 0 ? Math.round((certified / totalSops) * 100) : 0;

  return (
    <div className="min-h-screen pb-24" style={{ background: '#F3F4F6' }}>
      {/* Header */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E5E7EB' }}>
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center gap-2 mb-1">
            <Link href="/labs" className="text-sm hover:underline" style={{ color: '#0F766E' }}>Labs</Link>
            <span className="text-xs text-gray-400">/</span>
            <Link href="/labs/training" className="text-sm hover:underline" style={{ color: '#0F766E' }}>Training</Link>
            <span className="text-xs text-gray-400">/</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold" style={{ background: '#E5E7EB', color: '#374151' }}>
              {member.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-lg font-bold" style={{ color: '#111827' }}>{member.name}</h1>
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: '#6B7280' }}>{member.role}</span>
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full" style={{ background: '#F3E8FF', color: '#6B21A8' }}>
                  {TIER_LABELS[member.tier]}
                </span>
              </div>
            </div>
          </div>

          {/* Overall progress */}
          <div className="mt-3">
            <div className="flex justify-between text-xs mb-1">
              <span style={{ color: '#6B7280' }}>{certified}/{totalSops} SOPs certified</span>
              <span className="font-medium" style={{ color: certPct >= 80 ? '#10B981' : '#6B7280' }}>{certPct}%</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: '#F3F4F6' }}>
              <div className="h-full rounded-full" style={{ width: `${certPct}%`, background: '#10B981', minWidth: certPct > 0 ? '4px' : '0' }} />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 mt-4 space-y-2">
        {sops.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-400">No SOPs found. Seed data first.</p>
          </div>
        ) : (
          sops.map((sop) => {
            const record = recordMap.get(sop.id);
            return (
              <SopTrainingRow
                key={sop.id}
                sop={sop}
                record={record || null}
                isOwner={activeCrewId === 'crew_nathan'}
                onCertify={() => setCertifyingSop({ sopId: sop.id, sopCode: sop.sopCode })}
                onReview={() => record && setReviewingSop({ sopId: sop.id, sopCode: sop.sopCode, record })}
              />
            );
          })
        )}
      </div>

      {/* Certification Modal */}
      {certifyingSop && (
        <CertificationModal
          crewId={crewId}
          crewName={member.name}
          sopId={certifyingSop.sopId}
          sopCode={certifyingSop.sopCode}
          record={recordMap.get(certifyingSop.sopId) || null}
          onClose={() => setCertifyingSop(null)}
        />
      )}

      {/* Review Recording Modal */}
      {reviewingSop && (
        <ReviewModal
          crewId={crewId}
          crewName={member.name}
          sopId={reviewingSop.sopId}
          sopCode={reviewingSop.sopCode}
          record={reviewingSop.record}
          onClose={() => setReviewingSop(null)}
        />
      )}
    </div>
  );
}

function SopTrainingRow({
  sop,
  record,
  isOwner,
  onCertify,
  onReview,
}: {
  sop: Sop;
  record: TrainingRecord | null;
  isOwner: boolean;
  onCertify: () => void;
  onReview: () => void;
}) {
  const status = record?.status;
  const statusConfig = status ? STATUS_CONFIG[status] : null;
  const completions = record?.supervisedCompletions.length || 0;
  const required = sop.requiredSupervisedCompletions || 3;

  return (
    <div className="bg-white rounded-xl p-3" style={{ border: '1px solid #E5E7EB' }}>
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-medium" style={{ color: '#6B7280' }}>{sop.sopCode}</span>
            {statusConfig && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full" style={{ background: statusConfig.bg, color: statusConfig.text }}>
                {statusConfig.label}
              </span>
            )}
          </div>
          <div className="text-sm font-medium truncate" style={{ color: '#111827' }}>{sop.title}</div>
          <div className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
            {completions}/{required} supervised completions
            {record && record.reviewAttempts.length > 0 && (
              <> | {record.reviewAttempts.length} review{record.reviewAttempts.length !== 1 ? 's' : ''}</>
            )}
          </div>
        </div>

        {/* Action buttons (only for owner/supervisor) */}
        {isOwner && (
          <div className="flex gap-1 ml-2 flex-shrink-0">
            {status === 'review_ready' && (
              <button
                onClick={onReview}
                className="text-[10px] font-medium px-2 py-1 rounded-lg"
                style={{ background: '#FEF3C7', color: '#92400E', minHeight: '28px' }}
              >
                Review
              </button>
            )}
            {status !== 'certified' && (
              <button
                onClick={onCertify}
                className="text-[10px] font-medium px-2 py-1 rounded-lg"
                style={{ background: '#D1FAE5', color: '#065F46', minHeight: '28px' }}
              >
                Certify
              </button>
            )}
            {status === 'certified' && (
              <CheckCircle2 size={16} style={{ color: '#10B981' }} />
            )}
          </div>
        )}
      </div>

      {/* Completions progress bar */}
      {completions > 0 && status !== 'certified' && (
        <div className="mt-2">
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#F3F4F6' }}>
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.min(100, (completions / required) * 100)}%`,
                background: completions >= required ? '#F59E0B' : '#3B82F6',
                minWidth: '4px',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function CertificationModal({
  crewId,
  crewName,
  sopId,
  sopCode,
  record,
  onClose,
}: {
  crewId: string;
  crewName: string;
  sopId: string;
  sopCode: string;
  record: TrainingRecord | null;
  onClose: () => void;
}) {
  const certify = useCertifyCrew();
  const { crewMemberId } = useActiveCrew();

  const completions = record?.supervisedCompletions.length || 0;
  const hasPassedReview = record?.reviewAttempts.some((a) => a.passed) || false;

  const handleCertify = async () => {
    await certify.mutateAsync({
      crewMemberId: crewId,
      sopId,
      certifiedBy: crewMemberId || 'crew_nathan',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-xl p-5 mx-4 max-w-sm w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold" style={{ color: '#111827' }}>
            Certify: {sopCode}
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
            <X size={16} style={{ color: '#6B7280' }} />
          </button>
        </div>

        <p className="text-xs mb-4" style={{ color: '#6B7280' }}>
          Certify <strong>{crewName}</strong> for {sopCode}?
          This is a manual signoff — certification is never automatic.
        </p>

        {/* Pre-check warnings */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-xs">
            {completions >= 3 ? (
              <CheckCircle2 size={14} style={{ color: '#10B981' }} />
            ) : (
              <AlertTriangle size={14} style={{ color: '#F59E0B' }} />
            )}
            <span style={{ color: completions >= 3 ? '#065F46' : '#92400E' }}>
              {completions}/3 supervised completions
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            {hasPassedReview ? (
              <CheckCircle2 size={14} style={{ color: '#10B981' }} />
            ) : (
              <AlertTriangle size={14} style={{ color: '#F59E0B' }} />
            )}
            <span style={{ color: hasPassedReview ? '#065F46' : '#92400E' }}>
              {hasPassedReview ? 'Review passed' : 'No passing review yet'}
            </span>
          </div>
        </div>

        {(!hasPassedReview || completions < 3) && (
          <div className="text-xs p-2 rounded-lg mb-4" style={{ background: '#FEF3C7', color: '#92400E' }}>
            Warning: Not all requirements are met. You can still certify (manual override).
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleCertify}
            disabled={certify.isPending}
            className="flex-1 py-2.5 text-sm font-semibold text-white rounded-xl disabled:opacity-50"
            style={{ background: '#10B981', minHeight: '44px' }}
          >
            {certify.isPending ? 'Certifying...' : 'Certify'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium rounded-xl border"
            style={{ borderColor: '#E5E7EB', color: '#6B7280', minHeight: '44px' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function ReviewModal({
  crewId,
  crewName,
  sopId,
  sopCode,
  record,
  onClose,
}: {
  crewId: string;
  crewName: string;
  sopId: string;
  sopCode: string;
  record: TrainingRecord;
  onClose: () => void;
}) {
  const recordReview = useRecordReviewAttempt();
  const { crewMemberId } = useActiveCrew();
  const [score, setScore] = useState('');
  const [notes, setNotes] = useState('');

  const threshold = 80; // From integration spec Agreement E
  const scoreNum = parseInt(score, 10);
  const isValid = !isNaN(scoreNum) && scoreNum >= 0 && scoreNum <= 100;
  const wouldPass = isValid && scoreNum >= threshold;

  const handleSubmit = async () => {
    if (!isValid) return;
    await recordReview.mutateAsync({
      crewMemberId: crewId,
      sopId,
      attempt: {
        date: new Date().toISOString(),
        score: scoreNum,
        passed: wouldPass,
        reviewedBy: crewMemberId || 'crew_nathan',
        notes: notes.trim() || null,
      },
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-xl p-5 mx-4 max-w-sm w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold" style={{ color: '#111827' }}>
            Review: {crewName} — {sopCode}
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
            <X size={16} style={{ color: '#6B7280' }} />
          </button>
        </div>

        <p className="text-xs mb-3" style={{ color: '#6B7280' }}>
          Attempt #{record.reviewAttempts.length + 1}. Pass threshold: {threshold}%.
        </p>

        <div className="space-y-3 mb-4">
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: '#374151' }}>Score (%)</label>
            <input
              type="number"
              value={score}
              onChange={(e) => setScore(e.target.value)}
              min={0}
              max={100}
              placeholder="0-100"
              className="w-full px-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2"
              style={{ borderColor: '#E5E7EB', minHeight: '44px' }}
            />
            {isValid && (
              <div className="text-xs mt-1" style={{ color: wouldPass ? '#10B981' : '#EF4444' }}>
                {wouldPass ? 'Pass' : 'Fail'} ({scoreNum}% vs {threshold}% threshold)
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: '#374151' }}>Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any observations about the review..."
              rows={2}
              className="w-full px-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2"
              style={{ borderColor: '#E5E7EB' }}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSubmit}
            disabled={!isValid || recordReview.isPending}
            className="flex-1 py-2.5 text-sm font-semibold text-white rounded-xl disabled:opacity-50"
            style={{ background: '#0F766E', minHeight: '44px' }}
          >
            {recordReview.isPending ? 'Recording...' : 'Record Review'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium rounded-xl border"
            style={{ borderColor: '#E5E7EB', color: '#6B7280', minHeight: '44px' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
