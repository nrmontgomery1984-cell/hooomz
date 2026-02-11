'use client';

/**
 * Lead Pipeline — /leads
 *
 * Cards grouped by stage (New, Quoted, Converted, Passed).
 * Stage headers with colored dots + counts. Passed/Converted collapsed by default.
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

const STAGE_COLORS: Record<LeadStage, string> = {
  new: '#8B5CF6',
  quoted: '#3B82F6',
  converted: '#0F766E',
  passed: '#9CA3AF',
};

const STAGE_BG: Record<LeadStage, string> = {
  new: '#F5F3FF',
  quoted: '#EFF6FF',
  converted: '#F0FDFA',
  passed: '#F9FAFB',
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
            className="w-10 h-10 border-3 rounded-full animate-spin mx-auto mb-3"
            style={{ borderColor: '#E5E7EB', borderTopColor: '#0F766E' }}
          />
          <p className="text-xs" style={{ color: '#9CA3AF' }}>Loading pipeline...</p>
        </div>
      </div>
    );
  }

  return (
    <PageErrorBoundary>
    <div className="min-h-screen pb-24" style={{ background: '#F3F4F6' }}>
      {/* Header */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E5E7EB' }}>
        <div className="max-w-lg md:max-w-4xl mx-auto px-4 md:px-8 py-3 md:py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg md:text-xl font-bold" style={{ color: '#111827' }}>
              Lead Pipeline
            </h1>
            <p className="text-[11px] mt-0.5" style={{ color: '#9CA3AF' }}>
              {pipeline.leads.length} lead{pipeline.leads.length !== 1 ? 's' : ''} in pipeline
            </p>
          </div>
          <button
            onClick={() => router.push('/leads/new')}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl"
            style={{ background: '#0F766E' }}
          >
            <Plus size={18} color="#FFFFFF" strokeWidth={2} />
          </button>
        </div>

        {/* Stage summary strip */}
        <div className="max-w-lg md:max-w-4xl mx-auto px-4 md:px-8 pb-3">
          <div className="flex gap-2 overflow-x-auto">
            <FilterPill
              label="All"
              count={pipeline.leads.length}
              active={stageFilter === 'all'}
              color="#374151"
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
                  color={STAGE_COLORS[stage]}
                  onClick={() => setStageFilter(stage)}
                />
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-lg md:max-w-4xl mx-auto px-4 md:px-8">
        {/* Empty state */}
        {filteredLeads.length === 0 && (
          <div className="mt-8 text-center">
            <div
              className="w-14 h-14 mx-auto mb-3 rounded-xl flex items-center justify-center"
              style={{ background: '#F0FDFA' }}
            >
              <FileText size={24} style={{ color: '#0F766E' }} strokeWidth={1.5} />
            </div>
            <p className="text-sm font-medium mb-1" style={{ color: '#111827' }}>
              No leads yet
            </p>
            <p className="text-xs mb-4" style={{ color: '#9CA3AF' }}>
              Capture your first lead at a home show or from a referral
            </p>
            <button
              onClick={() => router.push('/leads/new')}
              className="min-h-[44px] px-5 rounded-xl font-medium text-sm text-white"
              style={{ background: '#0F766E' }}
            >
              Capture a Lead
            </button>
          </div>
        )}

        {/* Pipeline visualization bar */}
        {pipeline.leads.length > 0 && stageFilter === 'all' && (
          <div className="mt-4 mb-2">
            <div className="flex rounded-lg overflow-hidden h-2">
              {STAGE_ORDER.map((stage) => {
                const count = pipeline.counts[stage];
                if (count === 0) return null;
                const pct = (count / pipeline.leads.length) * 100;
                return (
                  <div
                    key={stage}
                    style={{ width: `${pct}%`, background: STAGE_COLORS[stage], minWidth: '4px' }}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Stage groups */}
        {grouped.map(({ stage, leads }) => (
          <div key={stage} className="mt-4">
            {/* Stage header */}
            <button
              onClick={() => toggleCollapse(stage)}
              className="flex items-center gap-2 mb-2 min-h-[28px]"
            >
              {collapsedStages.has(stage) ? (
                <ChevronRight size={14} style={{ color: '#9CA3AF' }} />
              ) : (
                <ChevronDown size={14} style={{ color: '#9CA3AF' }} />
              )}
              <div
                className="w-2 h-2 rounded-full"
                style={{ background: STAGE_COLORS[stage] }}
              />
              <h2
                className="text-[11px] font-semibold uppercase tracking-wider"
                style={{ color: '#6B7280' }}
              >
                {STAGE_LABELS[stage]}
              </h2>
              <span
                className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                style={{ background: STAGE_BG[stage], color: STAGE_COLORS[stage] }}
              >
                {leads.length}
              </span>
            </button>

            {/* Cards */}
            {!collapsedStages.has(stage) && (
              <div className="space-y-2">
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
  color,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="min-h-[32px] px-3 rounded-lg text-xs font-medium whitespace-nowrap transition-colors"
      style={{
        background: active ? color : '#F3F4F6',
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
  const stageColor = STAGE_COLORS[stage];

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
      className="rounded-xl p-3 transition-all duration-150 hover:shadow-md hover:-translate-y-px"
      style={{
        background: '#FFFFFF',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        borderLeft: `3px solid ${stageColor}`,
        opacity: stage === 'passed' ? 0.65 : 1,
      }}
    >
      {/* Top row: name + stage pill + phone */}
      <div className="flex items-center justify-between mb-0.5">
        <div className="flex items-center gap-2 min-w-0">
          <h3 className="text-[13px] font-semibold truncate" style={{ color: '#111827' }}>
            {fullName}
          </h3>
          <span
            className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full uppercase tracking-wide flex-shrink-0"
            style={{ background: STAGE_BG[stage], color: stageColor }}
          >
            {STAGE_LABELS[stage]}
          </span>
        </div>
        <a
          href={`tel:${customer.phone}`}
          className="text-xs font-medium flex-shrink-0 ml-2"
          style={{ color: '#0F766E' }}
        >
          {customer.phone}
        </a>
      </div>

      {/* Interests + source + time */}
      <p className="text-[11px] mb-0.5" style={{ color: '#6B7280' }}>
        {interestLabels}
        {sourceLabel && ` \u00B7 ${sourceLabel}`}
        <span style={{ color: '#D1D5DB' }}> \u00B7 {timeLabel}</span>
      </p>

      {/* Linked project info */}
      {linkedProject && (
        <p className="text-[11px] mb-0.5" style={{ color: '#9CA3AF' }}>
          Project: {linkedProject.name} \u00B7{' '}
          {linkedProject.status.replace(/-/g, ' ')}
        </p>
      )}

      {/* Notes */}
      {customer.notes && (
        <p
          className="text-[11px] italic mb-0.5 truncate"
          style={{ color: '#9CA3AF' }}
        >
          &ldquo;{customer.notes}&rdquo;
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-1.5 mt-2">
        <a
          href={`tel:${customer.phone}`}
          className="min-h-[32px] px-2.5 flex items-center gap-1 rounded-lg text-[11px] font-medium"
          style={{ background: '#F3F4F6', color: '#374151' }}
        >
          <Phone size={12} /> Call
        </a>

        {stage === 'new' && (
          <>
            <button
              onClick={handleCreateEstimate}
              disabled={createProject.isPending}
              className="min-h-[32px] px-2.5 flex items-center gap-1 rounded-lg text-[11px] font-medium"
              style={{ background: '#F0FDFA', color: '#0F766E' }}
            >
              <FileText size={12} />{' '}
              {createProject.isPending ? 'Creating...' : 'Estimate'}
            </button>
            <button
              onClick={handlePass}
              disabled={passLead.isPending}
              className="min-h-[32px] px-2.5 flex items-center gap-1 rounded-lg text-[11px] font-medium"
              style={{ background: '#FEF2F2', color: '#EF4444' }}
            >
              <XCircle size={12} /> Pass
            </button>
          </>
        )}

        {(stage === 'quoted' || stage === 'converted') && linkedProject && (
          <button
            onClick={() => router.push(`/projects/${linkedProject.id}`)}
            className="min-h-[32px] px-2.5 flex items-center gap-1 rounded-lg text-[11px] font-medium"
            style={{ background: '#F0FDFA', color: '#0F766E' }}
          >
            View Project <ArrowRight size={12} />
          </button>
        )}

        {stage === 'passed' && (
          <button
            onClick={handleRestore}
            disabled={restoreLead.isPending}
            className="min-h-[32px] px-2.5 flex items-center gap-1 rounded-lg text-[11px] font-medium"
            style={{ background: '#F3F4F6', color: '#374151' }}
          >
            <RotateCcw size={12} /> Restore
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
