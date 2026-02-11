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
  draft: { bg: '#F3F4F6', text: '#6B7280', label: 'Draft' },
  published: { bg: '#D1FAE5', text: '#065F46', label: 'Published' },
  under_review: { bg: '#FEF3C7', text: '#92400E', label: 'Under Review' },
  deprecated: { bg: '#FEE2E2', text: '#991B1B', label: 'Deprecated' },
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
      <div className="min-h-screen pb-24" style={{ background: '#F3F4F6' }}>
        <div className="max-w-lg mx-auto px-4 py-12 text-center">
          <div className="w-8 h-8 border-3 rounded-full animate-spin mx-auto mb-3" style={{ borderColor: '#E5E7EB', borderTopColor: '#0F766E' }} />
          <p className="text-sm text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen pb-24" style={{ background: '#F3F4F6' }}>
        <div className="max-w-lg mx-auto px-4 py-12 text-center">
          <p className="text-sm text-gray-500">Knowledge item not found</p>
          <Link href="/labs/knowledge" className="text-sm hover:underline mt-2 inline-block" style={{ color: '#0F766E' }}>
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
    <div className="min-h-screen pb-24" style={{ background: '#F3F4F6' }}>
      {/* Header */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E5E7EB' }}>
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center gap-2 mb-1">
            <Link href="/labs" className="text-sm hover:underline" style={{ color: '#0F766E' }}>Labs</Link>
            <span className="text-xs text-gray-400">/</span>
            <Link href="/labs/knowledge" className="text-sm hover:underline" style={{ color: '#0F766E' }}>Knowledge</Link>
            <span className="text-xs text-gray-400">/</span>
          </div>
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-lg font-bold flex-1" style={{ color: '#111827' }}>
              {item.title}
            </h1>
            <ConfidenceScoreBadge score={item.confidenceScore} size="md" />
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 mt-4 space-y-4">
        {/* Summary */}
        <div className="bg-white rounded-xl p-4" style={{ border: '1px solid #E5E7EB' }}>
          <p className="text-sm leading-relaxed" style={{ color: '#374151' }}>
            {item.summary}
          </p>
          {item.details && (
            <p className="text-sm leading-relaxed mt-3 pt-3" style={{ color: '#6B7280', borderTop: '1px solid #F3F4F6' }}>
              {item.details}
            </p>
          )}
        </div>

        {/* Metadata */}
        <div className="bg-white rounded-xl p-4" style={{ border: '1px solid #E5E7EB' }}>
          <h2 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: '#9CA3AF' }}>Details</h2>
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
                <Tag size={14} className="flex-shrink-0 mt-0.5" style={{ color: '#9CA3AF' }} />
                <div className="flex flex-wrap gap-1">
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: '#F3F4F6', color: '#6B7280' }}
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
          <div className="bg-white rounded-xl p-4" style={{ border: '1px solid #E5E7EB' }}>
            <h2 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: '#9CA3AF' }}>Cost Data</h2>
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
                <div className="text-xs pt-2" style={{ color: '#6B7280', borderTop: '1px solid #F3F4F6' }}>
                  {item.costData.totalCostComparison}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Challenges */}
        <div className="bg-white rounded-xl p-4" style={{ border: '1px solid #E5E7EB' }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#9CA3AF' }}>
              Challenges {pendingChallenges.length > 0 && `(${pendingChallenges.length} pending)`}
            </h2>
            <button
              onClick={() => setShowChallengeForm(!showChallengeForm)}
              className="text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors"
              style={{
                color: '#EF4444',
                borderColor: '#FCA5A5',
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
            <div className="mb-3 p-3 rounded-lg" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
              <p className="text-xs mb-2" style={{ color: '#991B1B' }}>
                Why do you think this knowledge is incorrect or incomplete?
              </p>
              <textarea
                value={challengeReason}
                onChange={(e) => setChallengeReason(e.target.value)}
                placeholder="Describe your concern..."
                className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-300"
                style={{ borderColor: '#FECACA', minHeight: '80px' }}
                rows={3}
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleSubmitChallenge}
                  disabled={!challengeReason.trim() || fileChallenge.isPending}
                  className="px-3 py-1.5 text-xs font-medium text-white rounded-lg disabled:opacity-50"
                  style={{ background: '#EF4444', minHeight: '36px' }}
                >
                  {fileChallenge.isPending ? 'Filing...' : 'File Challenge'}
                </button>
                <button
                  onClick={() => { setShowChallengeForm(false); setChallengeReason(''); }}
                  className="px-3 py-1.5 text-xs font-medium text-gray-600 rounded-lg border border-gray-200"
                  style={{ minHeight: '36px' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {challenges.length === 0 ? (
            <p className="text-xs text-center py-3" style={{ color: '#9CA3AF' }}>
              No challenges filed. Crew members can challenge knowledge they disagree with.
            </p>
          ) : (
            <div className="space-y-2">
              {challenges.map((c) => (
                <div
                  key={c.id}
                  className="p-3 rounded-lg text-xs"
                  style={{
                    background: c.status === 'pending' ? '#FFFBEB' : '#F9FAFB',
                    border: `1px solid ${c.status === 'pending' ? '#FDE68A' : '#E5E7EB'}`,
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium" style={{ color: '#374151' }}>
                      {c.submittedBy}
                    </span>
                    <span
                      className="px-2 py-0.5 rounded-full font-medium capitalize"
                      style={{
                        background: c.status === 'pending' ? '#FEF3C7' : '#D1FAE5',
                        color: c.status === 'pending' ? '#92400E' : '#065F46',
                      }}
                    >
                      {c.status}
                    </span>
                  </div>
                  <p style={{ color: '#6B7280' }}>{c.reason}</p>
                  {c.resolution && (
                    <p className="mt-1 pt-1" style={{ color: '#374151', borderTop: '1px solid #E5E7EB' }}>
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
      {icon && <span className="flex-shrink-0" style={{ color: '#9CA3AF' }}>{icon}</span>}
      <span className="flex-shrink-0" style={{ color: '#6B7280', minWidth: '100px' }}>{label}</span>
      <span className="font-medium" style={{ color: '#111827' }}>{value}</span>
    </div>
  );
}

function CostRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span style={{ color: '#6B7280' }}>{label}</span>
      <span className="font-medium font-mono" style={{ color: '#111827' }}>{value}</span>
    </div>
  );
}
