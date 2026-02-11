'use client';

/**
 * Lead Pipeline — /leads
 *
 * Cards grouped by stage (New, Quoted, Converted, Passed).
 * Stage headers with counts. Passed/Converted collapsed by default.
 * Actions: Call, Create Estimate, Pass, Restore, View Project.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageErrorBoundary } from '@/components/ui/PageErrorBoundary';
import {
  Plus,
  Phone,
  FileText,
  XCircle,
  RotateCcw,
  ArrowRight,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import {
  useLeadPipeline,
  useCreateProjectFromLead,
  usePassLead,
  useRestoreLead,
} from '@/lib/hooks/useLeadData';
import type { LeadRecord, LeadStage } from '@/lib/hooks/useLeadData';

// ============================================================================
// Constants
// ============================================================================

const STAGE_ORDER: LeadStage[] = ['new', 'quoted', 'converted', 'passed'];

const STAGE_LABELS: Record<LeadStage, string> = {
  new: 'New',
  quoted: 'Quoted',
  converted: 'Converted',
  passed: 'Passed',
};

const SOURCE_LABELS: Record<string, string> = {
  'home-show': 'Home Show',
  referral: 'Referral',
  website: 'Website',
  social: 'Social Media',
  other: 'Other',
  unknown: 'Unknown',
};

const INTEREST_LABELS: Record<string, string> = {
  flooring: 'Flooring',
  paint: 'Paint',
  trim: 'Trim/Doors',
  'full-reno': 'Full Interior',
  kitchen: 'Kitchen',
  bathroom: 'Bathroom',
  basement: 'Basement',
  other: 'Other',
};

// ============================================================================
// Page
// ============================================================================

export default function LeadPipelinePage() {
  const router = useRouter();
  const pipeline = useLeadPipeline();
  const [stageFilter, setStageFilter] = useState<LeadStage | 'all'>('all');
  const [collapsedStages, setCollapsedStages] = useState<Set<LeadStage>>(
    new Set(['converted', 'passed'])
  );

  const toggleCollapse = (stage: LeadStage) => {
    setCollapsedStages((prev) => {
      const next = new Set(prev);
      if (next.has(stage)) {
        next.delete(stage);
      } else {
        next.add(stage);
      }
      return next;
    });
  };

  // Filter leads by stage
  const filteredLeads =
    stageFilter === 'all'
      ? pipeline.leads
      : pipeline.leads.filter((l) => l.stage === stageFilter);

  // Group by stage
  const grouped = STAGE_ORDER.map((stage) => ({
    stage,
    leads: filteredLeads.filter((l) => l.stage === stage),
  })).filter((g) => g.leads.length > 0);

  if (pipeline.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F3F4F6' }}>
        <div className="text-center">
          <div
            className="w-12 h-12 border-4 rounded-full animate-spin mx-auto mb-4"
            style={{ borderColor: '#E5E7EB', borderTopColor: '#0F766E' }}
          />
          <p style={{ color: '#6B7280' }}>Loading pipeline...</p>
        </div>
      </div>
    );
  }

  return (
    <PageErrorBoundary>
    <div className="min-h-screen pb-24" style={{ background: '#F3F4F6' }}>
      {/* Header */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E5E7EB' }}>
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold" style={{ color: '#111827' }}>
            Lead Pipeline
          </h1>
          <button
            onClick={() => router.push('/leads/new')}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl"
            style={{ background: '#0F766E' }}
          >
            <Plus size={20} color="#FFFFFF" strokeWidth={2} />
          </button>
        </div>

        {/* Filter pills */}
        <div className="max-w-lg mx-auto px-4 pb-3">
          <div className="flex gap-2 overflow-x-auto">
            <FilterPill
              label="All"
              count={pipeline.leads.length}
              active={stageFilter === 'all'}
              onClick={() => setStageFilter('all')}
            />
            {STAGE_ORDER.map((stage) => {
              const count = pipeline.counts[stage];
              if (count === 0 && stage !== 'new') return null;
              return (
                <FilterPill
                  key={stage}
                  label={STAGE_LABELS[stage]}
                  count={count}
                  active={stageFilter === stage}
                  onClick={() => setStageFilter(stage)}
                />
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4">
        {/* Empty state */}
        {filteredLeads.length === 0 && (
          <div className="mt-8 text-center">
            <div
              className="w-16 h-16 mx-auto mb-4 rounded-xl flex items-center justify-center"
              style={{ background: '#F0FDFA' }}
            >
              <FileText size={28} style={{ color: '#0F766E' }} strokeWidth={1.5} />
            </div>
            <p className="text-sm font-medium mb-1" style={{ color: '#111827' }}>
              No leads yet
            </p>
            <p className="text-xs mb-4" style={{ color: '#9CA3AF' }}>
              Capture your first lead at a home show or from a referral
            </p>
            <button
              onClick={() => router.push('/leads/new')}
              className="min-h-[48px] px-6 rounded-xl font-medium text-white"
              style={{ background: '#0F766E' }}
            >
              Capture a Lead
            </button>
          </div>
        )}

        {/* Stage groups */}
        {grouped.map(({ stage, leads }) => (
          <div key={stage} className="mt-5">
            {/* Stage header */}
            <button
              onClick={() => toggleCollapse(stage)}
              className="flex items-center gap-2 mb-3 min-h-[32px]"
            >
              {collapsedStages.has(stage) ? (
                <ChevronRight size={16} style={{ color: '#9CA3AF' }} />
              ) : (
                <ChevronDown size={16} style={{ color: '#9CA3AF' }} />
              )}
              <h2
                className="text-sm font-medium uppercase tracking-wide"
                style={{ color: '#6B7280' }}
              >
                {STAGE_LABELS[stage]}
              </h2>
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: '#E5E7EB', color: '#6B7280' }}
              >
                {leads.length}
              </span>
            </button>

            {/* Cards */}
            {!collapsedStages.has(stage) && (
              <div className="space-y-3">
                {leads.map((lead) => (
                  <LeadCard key={lead.customer.id} lead={lead} />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
    </PageErrorBoundary>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

function FilterPill({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="min-h-[36px] px-3 rounded-lg text-sm font-medium whitespace-nowrap transition-colors"
      style={{
        background: active ? '#0F766E' : '#F3F4F6',
        color: active ? '#FFFFFF' : '#6B7280',
      }}
    >
      {label} {count > 0 && `(${count})`}
    </button>
  );
}

function LeadCard({ lead }: { lead: LeadRecord }) {
  const router = useRouter();
  const createProject = useCreateProjectFromLead();
  const passLead = usePassLead();
  const restoreLead = useRestoreLead();

  const { customer, stage, interests, source, linkedProject } = lead;
  const fullName = `${customer.firstName} ${customer.lastName}`.trim();
  const interestLabels = interests
    .map((i) => INTEREST_LABELS[i] || i)
    .join(', ');
  const sourceLabel = SOURCE_LABELS[source] || source;
  const createdAt = new Date(customer.metadata.createdAt);
  const timeLabel = formatRelativeDate(createdAt);

  const handleCreateEstimate = async () => {
    if (createProject.isPending) return;
    try {
      await createProject.mutateAsync(lead);
      router.push('/estimates/select-project');
    } catch {
      // Error handled by mutation state
    }
  };

  const handlePass = () => {
    if (passLead.isPending) return;
    passLead.mutate(customer.id);
  };

  const handleRestore = () => {
    if (restoreLead.isPending) return;
    restoreLead.mutate(customer.id);
  };

  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: '#FFFFFF',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        border: stage === 'passed' ? '1px solid #E5E7EB' : 'none',
        opacity: stage === 'passed' ? 0.7 : 1,
      }}
    >
      {/* Top row: name + phone */}
      <div className="flex items-start justify-between mb-1">
        <h3 className="text-sm font-semibold" style={{ color: '#111827' }}>
          {fullName}
        </h3>
        <a
          href={`tel:${customer.phone}`}
          className="text-sm font-medium flex-shrink-0"
          style={{ color: '#0F766E' }}
        >
          {customer.phone}
        </a>
      </div>

      {/* Interests + source */}
      <p className="text-xs mb-1" style={{ color: '#6B7280' }}>
        {interestLabels}
        {sourceLabel && ` \u00B7 ${sourceLabel}`}
      </p>

      {/* Linked project info */}
      {linkedProject && (
        <p className="text-xs mb-1" style={{ color: '#9CA3AF' }}>
          Project: {linkedProject.name} \u00B7{' '}
          {linkedProject.status.replace(/-/g, ' ')}
        </p>
      )}

      {/* Notes */}
      {customer.notes && (
        <p
          className="text-xs italic mb-1 truncate"
          style={{ color: '#9CA3AF' }}
        >
          &ldquo;{customer.notes}&rdquo;
        </p>
      )}

      {/* Timestamp */}
      <p className="text-xs mb-3" style={{ color: '#D1D5DB' }}>
        {timeLabel}
      </p>

      {/* Actions */}
      <div className="flex gap-2">
        {/* Call — always shown */}
        <a
          href={`tel:${customer.phone}`}
          className="min-h-[36px] px-3 flex items-center gap-1.5 rounded-lg text-xs font-medium"
          style={{ background: '#F3F4F6', color: '#374151' }}
        >
          <Phone size={14} /> Call
        </a>

        {stage === 'new' && (
          <>
            <button
              onClick={handleCreateEstimate}
              disabled={createProject.isPending}
              className="min-h-[36px] px-3 flex items-center gap-1.5 rounded-lg text-xs font-medium"
              style={{ background: '#F0FDFA', color: '#0F766E' }}
            >
              <FileText size={14} />{' '}
              {createProject.isPending ? 'Creating...' : 'Create Estimate'}
            </button>
            <button
              onClick={handlePass}
              disabled={passLead.isPending}
              className="min-h-[36px] px-3 flex items-center gap-1.5 rounded-lg text-xs font-medium"
              style={{ background: '#FEF2F2', color: '#EF4444' }}
            >
              <XCircle size={14} /> Pass
            </button>
          </>
        )}

        {(stage === 'quoted' || stage === 'converted') && linkedProject && (
          <button
            onClick={() => router.push(`/projects/${linkedProject.id}`)}
            className="min-h-[36px] px-3 flex items-center gap-1.5 rounded-lg text-xs font-medium"
            style={{ background: '#F0FDFA', color: '#0F766E' }}
          >
            View Project <ArrowRight size={14} />
          </button>
        )}

        {stage === 'passed' && (
          <button
            onClick={handleRestore}
            disabled={restoreLead.isPending}
            className="min-h-[36px] px-3 flex items-center gap-1.5 rounded-lg text-xs font-medium"
            style={{ background: '#F3F4F6', color: '#374151' }}
          >
            <RotateCcw size={14} /> Restore
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Helpers
// ============================================================================

function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}
