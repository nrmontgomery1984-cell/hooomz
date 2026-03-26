'use client';

/**
 * Knowledge Item Detail Page
 *
 * Shows full details for a single knowledge item:
 * - Title, summary, confidence score
 * - Metadata (type, category, status, dates)
 * - Cost data (if available)
 * - Related items (products, techniques, tools)
 * - Challenges filed against this item
 */

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AlertTriangle, Beaker, Tag, Calendar, TrendingUp } from 'lucide-react';
import { useLabsKnowledgeItem, useLabsChallengesForItem, useFileChallenge } from '@/lib/hooks/useLabsData';
import { ConfidenceScoreBadge } from '@/components/labs/ConfidenceScoreBadge';
import type { KnowledgeChallenge } from '@hooomz/shared-contracts';

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  draft: { bg: 'var(--bg)', text: 'var(--mid)', label: 'Draft' },
  published: { bg: 'var(--green-bg)', text: 'var(--green)', label: 'Published' },
  under_review: { bg: 'var(--yellow-bg)', text: 'var(--yellow)', label: 'Under Review' },
  deprecated: { bg: 'var(--red-bg)', text: 'var(--red)', label: 'Deprecated' },
};

const TYPE_LABELS: Record<string, string> = {
  product: 'Product',
  material: 'Material',
  technique: 'Technique',
  action: 'Action',
  procedure: 'Procedure',
  timing: 'Timing',
  combination: 'Combination',
  tool_method: 'Tool / Method',
  environmental_rule: 'Environmental Rule',
  specification: 'Specification',
};

export default function KnowledgeDetailPage() {
  const params = useParams();
  const itemId = params.id as string;

  const { data: item, isLoading } = useLabsKnowledgeItem(itemId);
  const { data: challenges = [] } = useLabsChallengesForItem(itemId);
  const fileChallenge = useFileChallenge();

  const [showChallengeForm, setShowChallengeForm] = useState(false);
  const [challengeReason, setChallengeReason] = useState('');

  if (isLoading) {
    return (
      <div className="min-h-screen pb-24" style={{ background: 'var(--bg)' }}>
        <div className="max-w-lg mx-auto px-4 py-12 text-center">
          <div className="w-8 h-8 border-3 rounded-full animate-spin mx-auto mb-3" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--blue)' }} />
          <p className="text-sm" style={{ color: 'var(--muted)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen pb-24" style={{ background: 'var(--bg)' }}>
        <div className="max-w-lg mx-auto px-4 py-12 text-center">
          <p className="text-sm" style={{ color: 'var(--mid)' }}>Knowledge item not found</p>
          <Link href="/labs/knowledge" className="text-sm hover:underline mt-2 inline-block" style={{ color: 'var(--blue)' }}>
            Back to Knowledge Base
          </Link>
        </div>
      </div>
    );
  }

  const status = STATUS_STYLES[item.status] || STATUS_STYLES.draft;
  const typeLabel = TYPE_LABELS[item.knowledgeType] || item.knowledgeType;
  const pendingChallenges = challenges.filter((c) => c.status === 'pending');

  const handleSubmitChallenge = async () => {
    if (!challengeReason.trim()) return;
    await fileChallenge.mutateAsync({
      knowledgeItemId: itemId,
      submittedBy: 'crew_nathan',
      reason: challengeReason.trim(),
      description: challengeReason.trim(),
      status: 'pending',
    } as Omit<KnowledgeChallenge, 'id' | 'metadata'>);
    setChallengeReason('');
    setShowChallengeForm(false);
  };

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center gap-2 mb-1">
            <Link href="/labs" className="text-sm hover:underline" style={{ color: 'var(--blue)' }}>Labs</Link>
            <span className="text-xs" style={{ color: 'var(--muted)' }}>/</span>
            <Link href="/labs/knowledge" className="text-sm hover:underline" style={{ color: 'var(--blue)' }}>Knowledge</Link>
            <span className="text-xs" style={{ color: 'var(--muted)' }}>/</span>
          </div>
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-lg font-bold flex-1" style={{ color: 'var(--charcoal)' }}>
              {item.title}
            </h1>
            <ConfidenceScoreBadge score={item.confidenceScore} size="md" />
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 mt-4 space-y-4">
        {/* Summary */}
        <div className="rounded-xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--mid)' }}>
            {item.summary}
          </p>
          {item.details && (
            <p className="text-sm leading-relaxed mt-3 pt-3" style={{ color: 'var(--mid)', borderTop: '1px solid var(--bg)' }}>
              {item.details}
            </p>
          )}
        </div>

        {/* Metadata */}
        <div className="rounded-xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <h2 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--muted)' }}>Details</h2>
          <div className="space-y-2.5">
            <MetaRow icon={<Beaker size={14} />} label="Type" value={typeLabel} />
            <MetaRow icon={<Tag size={14} />} label="Category" value={item.category} />
            <MetaRow
              label="Status"
              icon={<div className="w-2 h-2 rounded-full" style={{ background: status.text }} />}
              value={
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{ background: status.bg, color: status.text }}
                >
                  {status.label}
                </span>
              }
            />
            <MetaRow
              icon={<TrendingUp size={14} />}
              label="Evidence"
              value={`${item.observationCount} observations, ${item.experimentCount} experiments`}
            />
            {item.crewAgreementRate !== undefined && (
              <MetaRow label="Crew Agreement" value={`${item.crewAgreementRate}%`} />
            )}
            {item.successRate !== undefined && (
              <MetaRow label="Success Rate" value={`${item.successRate}%`} />
            )}
            {item.lastReviewDate && (
              <MetaRow
                icon={<Calendar size={14} />}
                label="Last Review"
                value={new Date(item.lastReviewDate).toLocaleDateString()}
              />
            )}
            {item.tags && item.tags.length > 0 && (
              <div className="flex items-start gap-3 pt-1">
                <Tag size={14} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--muted)' }} />
                <div className="flex flex-wrap gap-1">
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: 'var(--bg)', color: 'var(--mid)' }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Cost Data */}
        {item.costData && (
          <div className="rounded-xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <h2 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--muted)' }}>Cost Data</h2>
            <div className="space-y-2">
              {item.costData.avgMaterialCostPerUnit !== undefined && (
                <CostRow label="Avg Material Cost/Unit" value={`$${item.costData.avgMaterialCostPerUnit.toFixed(2)}`} />
              )}
              {item.costData.avgLaborMinutes !== undefined && (
                <CostRow label="Avg Labor" value={`${item.costData.avgLaborMinutes} min`} />
              )}
              {item.costData.avgWastePercentage !== undefined && (
                <CostRow label="Avg Waste" value={`${item.costData.avgWastePercentage}%`} />
              )}
              {item.costData.actualCoverageVsSpec !== undefined && (
                <CostRow label="Coverage vs Spec" value={`${item.costData.actualCoverageVsSpec}%`} />
              )}
              {item.costData.callbackCostAvg !== undefined && (
                <CostRow label="Avg Callback Cost" value={`$${item.costData.callbackCostAvg.toFixed(2)}`} />
              )}
              {item.costData.totalCostComparison && (
                <div className="text-xs pt-2" style={{ color: 'var(--mid)', borderTop: '1px solid var(--bg)' }}>
                  {item.costData.totalCostComparison}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Challenges */}
        <div className="rounded-xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
              Challenges {pendingChallenges.length > 0 && `(${pendingChallenges.length} pending)`}
            </h2>
            <button
              onClick={() => setShowChallengeForm(!showChallengeForm)}
              className="text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors"
              style={{
                color: 'var(--red)',
                borderColor: 'var(--red-bg)',
                minHeight: '36px',
              }}
            >
              <span className="flex items-center gap-1">
                <AlertTriangle size={12} />
                Challenge
              </span>
            </button>
          </div>

          {showChallengeForm && (
            <div className="mb-3 p-3 rounded-lg" style={{ background: 'var(--red-bg)', border: '1px solid var(--red-bg)' }}>
              <p className="text-xs mb-2" style={{ color: 'var(--red)' }}>
                Why do you think this knowledge is incorrect or incomplete?
              </p>
              <textarea
                value={challengeReason}
                onChange={(e) => setChallengeReason(e.target.value)}
                placeholder="Describe your concern..."
                className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-300"
                style={{ borderColor: 'var(--red-bg)', minHeight: '80px' }}
                rows={3}
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleSubmitChallenge}
                  disabled={!challengeReason.trim() || fileChallenge.isPending}
                  className="px-3 py-1.5 text-xs font-medium text-white rounded-lg disabled:opacity-50"
                  style={{ background: 'var(--red)', minHeight: '36px' }}
                >
                  {fileChallenge.isPending ? 'Filing...' : 'File Challenge'}
                </button>
                <button
                  onClick={() => { setShowChallengeForm(false); setChallengeReason(''); }}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg"
                  style={{ minHeight: '36px', color: 'var(--mid)', border: '1px solid var(--border)' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {challenges.length === 0 ? (
            <p className="text-xs text-center py-3" style={{ color: 'var(--muted)' }}>
              No challenges filed. Crew members can challenge knowledge they disagree with.
            </p>
          ) : (
            <div className="space-y-2">
              {challenges.map((c) => (
                <div
                  key={c.id}
                  className="p-3 rounded-lg text-xs"
                  style={{
                    background: c.status === 'pending' ? 'var(--yellow-bg)' : 'var(--surface-2)',
                    border: `1px solid ${c.status === 'pending' ? 'var(--yellow-bg)' : 'var(--border)'}`,
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium" style={{ color: 'var(--mid)' }}>
                      {c.submittedBy}
                    </span>
                    <span
                      className="px-2 py-0.5 rounded-full font-medium capitalize"
                      style={{
                        background: c.status === 'pending' ? 'var(--yellow-bg)' : 'var(--green-bg)',
                        color: c.status === 'pending' ? 'var(--yellow)' : 'var(--green)',
                      }}
                    >
                      {c.status}
                    </span>
                  </div>
                  <p style={{ color: 'var(--mid)' }}>{c.reason}</p>
                  {c.resolution && (
                    <p className="mt-1 pt-1" style={{ color: 'var(--mid)', borderTop: '1px solid var(--border)' }}>
                      Resolution: {c.resolution}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MetaRow({ icon, label, value }: { icon?: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      {icon && <span className="flex-shrink-0" style={{ color: 'var(--muted)' }}>{icon}</span>}
      <span className="flex-shrink-0" style={{ color: 'var(--mid)', minWidth: '100px' }}>{label}</span>
      <span className="font-medium" style={{ color: 'var(--charcoal)' }}>{value}</span>
    </div>
  );
}

function CostRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span style={{ color: 'var(--mid)' }}>{label}</span>
      <span className="font-medium font-mono" style={{ color: 'var(--charcoal)' }}>{value}</span>
    </div>
  );
}
