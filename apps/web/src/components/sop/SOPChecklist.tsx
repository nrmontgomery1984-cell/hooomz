'use client';

/**
 * SOP Checklist Component (Build 3b: bridged to IndexedDB SOPs)
 *
 * Shows the linked SOP steps for a task with:
 * - Numbered steps with checkboxes (persisted to IndexedDB)
 * - STOP conditions as red warning cards
 * - Lab-Tested badges (purple pills) on critical standards
 * - Progress bar showing completion
 *
 * Bridge logic: tries IndexedDB SOP first (database SOPs managed at /labs/sops),
 * falls back to hardcoded static SOPs in lib/data/sops.ts.
 *
 * Design spec: mobile-first, 48px touch targets, Inter font
 */

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Camera, ChevronDown, ChevronUp, AlertTriangle, Database, ExternalLink } from 'lucide-react';
import { getSOPById } from '@/lib/data/sops';
import { useSOPProgress, isStepCompleted } from '@/lib/hooks/useLocalData';
import { useSOPTriggerIntegration } from '@/lib/hooks/useSOPTriggerIntegration';
import { useConfirmObservation, useSop, useSopChecklistItems } from '@/lib/hooks/useLabsData';
import { useActiveCrew } from '@/lib/crew/ActiveCrewContext';
import { ObservationConfirmCard } from '@/components/labs';

interface SOPChecklistProps {
  taskId: string;
  sopId: string;
  /** Pass projectId to enable Build 2 observation triggers */
  projectId?: string;
  /** Opens SOP detail in a BottomSheet instead of navigating */
  onOpenSOP?: (sopId: string) => void;
  /** Opens knowledge item in a BottomSheet instead of navigating */
  onOpenKnowledge?: (sourceId: string) => void;
}

/** Normalized step for rendering — works with both hardcoded and database SOPs */
interface NormalizedStep {
  order: number;
  action: string;
  generatesObservation?: boolean;
}

/** Normalized SOP data for rendering */
interface NormalizedSOP {
  title: string;
  /** ID usable for linking to /labs/sops/[id] — only available for database SOPs */
  detailId: string | null;
  steps: NormalizedStep[];
  stopConditions: string[];
  criticalStandards: { standard: string; source: string }[];
  isFromDatabase: boolean;
}

export function SOPChecklist({ taskId, sopId, projectId, onOpenSOP, onOpenKnowledge }: SOPChecklistProps) {
  const { crewMemberId } = useActiveCrew();

  // Try database SOP first (Build 3b bridge)
  const { data: dbSop } = useSop(sopId);
  const { data: dbChecklistItems = [] } = useSopChecklistItems(dbSop?.id ?? '');

  // Fall back to hardcoded SOP
  const hardcodedSop = getSOPById(sopId);

  // Normalize into common rendering format
  const sop = useMemo((): NormalizedSOP | null => {
    if (dbSop && dbChecklistItems.length > 0) {
      // Database SOP found — use it
      return {
        title: dbSop.title,
        detailId: dbSop.id,
        steps: dbChecklistItems
          .sort((a, b) => a.stepNumber - b.stepNumber)
          .map(item => ({
            order: item.stepNumber,
            action: item.title,
            generatesObservation: item.generatesObservation,
          })),
        stopConditions: [],  // Database SOPs don't have stop_conditions yet
        criticalStandards: [], // Future: could derive from knowledge items
        isFromDatabase: true,
      };
    }

    if (hardcodedSop) {
      // Fallback to hardcoded SOP
      return {
        title: hardcodedSop.title,
        detailId: null, // Hardcoded SOPs don't have a detail page yet
        steps: hardcodedSop.quick_steps.map(step => ({
          order: step.order,
          action: step.action,
        })),
        stopConditions: hardcodedSop.stop_conditions,
        criticalStandards: hardcodedSop.critical_standards,
        isFromDatabase: false,
      };
    }

    return null;
  }, [dbSop, dbChecklistItems, hardcodedSop]);

  const { data: progress } = useSOPProgress(taskId, sopId);
  const { toggleStep, triggerResult, activeDraft, clearTriggerResult } = useSOPTriggerIntegration({
    taskId, sopId, projectId,
  });
  const confirmObservation = useConfirmObservation();
  const [expanded, setExpanded] = useState(false);

  if (!sop) return null;

  const completedSteps = progress?.completedSteps || [];
  const totalSteps = sop.steps.length;
  const completedCount = completedSteps.length;
  const progressPct = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;

  // Collapsed: show summary bar only
  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="w-full mt-3 rounded-xl p-3 flex items-center justify-between min-h-[44px]"
        style={{ background: '#F3F4F6', border: '1px solid #E5E7EB' }}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold" style={{ color: '#111827' }}>SOP</span>
          <span className="text-xs" style={{ color: '#6B7280' }}>{sop.title}</span>
          {sop.isFromDatabase && (
            <Database size={10} style={{ color: '#9CA3AF' }} />
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium" style={{ color: completedCount === totalSteps ? '#10B981' : '#6B7280' }}>
            {completedCount}/{totalSteps}
          </span>
          <ChevronDown size={14} style={{ color: '#9CA3AF' }} />
        </div>
      </button>
    );
  }

  return (
    <div
      className="mt-3 rounded-xl overflow-hidden"
      style={{ border: '1px solid #E5E7EB', borderLeft: '3px solid #0F766E' }}
    >
      {/* Header */}
      <div
        className="w-full p-3 flex items-center justify-between min-h-[44px]"
        style={{ background: '#F9FAFB' }}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-xs font-semibold" style={{ color: '#111827' }}>SOP</span>
          {onOpenSOP ? (
            <button
              className="text-xs flex items-center gap-1 hover:underline text-left"
              style={{ color: '#0F766E' }}
              onClick={(e) => { e.stopPropagation(); onOpenSOP(sopId); }}
            >
              {sop.title}
              <ExternalLink size={10} />
            </button>
          ) : sop.detailId ? (
            <Link
              href={`/labs/sops/${sop.detailId}`}
              className="text-xs flex items-center gap-1 hover:underline"
              style={{ color: '#0F766E' }}
              onClick={(e) => e.stopPropagation()}
            >
              {sop.title}
              <ExternalLink size={10} />
            </Link>
          ) : (
            <span className="text-xs" style={{ color: '#6B7280' }}>{sop.title}</span>
          )}
          {sop.isFromDatabase && (
            <Database size={10} style={{ color: '#9CA3AF' }} />
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs font-medium" style={{ color: completedCount === totalSteps ? '#10B981' : '#6B7280' }}>
            {completedCount}/{totalSteps}
          </span>
          <button onClick={() => setExpanded(false)} className="p-1 -m-1">
            <ChevronUp size={14} style={{ color: '#9CA3AF' }} />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-3">
        <div className="w-full h-1 rounded-full" style={{ background: '#E5E7EB' }}>
          <div
            className="h-1 rounded-full transition-all"
            style={{
              width: `${progressPct}%`,
              background: completedCount === totalSteps ? '#10B981' : '#0F766E',
            }}
          />
        </div>
      </div>

      {/* STOP conditions */}
      {sop.stopConditions.length > 0 && (
        <div className="px-3 pt-3 space-y-2">
          {sop.stopConditions.map((condition, i) => (
            <div
              key={i}
              className="rounded-lg p-2.5 flex items-start gap-2"
              style={{ background: '#FEF2F2', borderLeft: '3px solid #EF4444' }}
            >
              <AlertTriangle size={14} style={{ color: '#EF4444', flexShrink: 0, marginTop: 1 }} />
              <span className="text-xs" style={{ color: '#991B1B' }}>{condition}</span>
            </div>
          ))}
        </div>
      )}

      {/* Steps */}
      <div className="px-3 py-2">
        {sop.steps.map((step) => {
          const isChecked = isStepCompleted(completedSteps, step.order);
          return (
            <StepRow
              key={step.order}
              order={step.order}
              action={step.action}
              isChecked={isChecked}
              generatesObservation={step.generatesObservation}
              onToggle={() => toggleStep(step.order)}
            />
          );
        })}
      </div>

      {/* Inline observation confirm card (Build 2: on_check triggers) */}
      {triggerResult?.action === 'immediate_confirm' && activeDraft && projectId && crewMemberId && (
        <div className="px-3 py-2">
          <ObservationConfirmCard
            draft={activeDraft}
            isPending={confirmObservation.isPending}
            onConfirm={(params) => {
              confirmObservation.mutate({
                draft: activeDraft,
                taskId,
                projectId,
                crewMemberId,
                ...params,
              }, {
                onSuccess: () => clearTriggerResult(),
              });
            }}
            onSkip={clearTriggerResult}
          />
        </div>
      )}

      {/* Critical standards / Lab badges */}
      {sop.criticalStandards.length > 0 && (
        <div className="px-3 pb-3 space-y-1.5">
          <div className="text-[10px] font-medium uppercase tracking-wide" style={{ color: '#9CA3AF' }}>
            Lab Evidence
          </div>
          {sop.criticalStandards.map((cs, i) => (
            <LabBadge key={i} standard={cs.standard} source={cs.source} onOpenKnowledge={onOpenKnowledge} />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

function StepRow({
  order,
  action,
  isChecked,
  generatesObservation,
  onToggle,
}: {
  order: number;
  action: string;
  isChecked: boolean;
  generatesObservation?: boolean;
  onToggle: () => void;
}) {
  // Check if action text contains photo-related hints
  const hasPhoto = /photo|document|capture/i.test(action);
  // Check if step references a lab test
  const hasLabRef = /L-2026|lab/i.test(action);

  return (
    <button
      onClick={onToggle}
      className="w-full flex items-start gap-3 py-2.5 min-h-[44px] text-left"
      style={{ borderBottom: '1px solid #F3F4F6' }}
    >
      {/* Checkbox */}
      <div
        className="flex-shrink-0 w-5 h-5 rounded mt-0.5 flex items-center justify-center"
        style={{
          border: isChecked ? 'none' : '2px solid #D1D5DB',
          background: isChecked ? '#0F766E' : 'transparent',
        }}
      >
        {isChecked && (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>

      {/* Step text */}
      <div className="flex-1 min-w-0">
        <span
          className="text-xs leading-relaxed"
          style={{
            color: isChecked ? '#9CA3AF' : '#111827',
            textDecoration: isChecked ? 'line-through' : 'none',
          }}
        >
          <span className="font-medium" style={{ color: isChecked ? '#9CA3AF' : '#6B7280' }}>
            {order}.
          </span>{' '}
          {action}
        </span>
      </div>

      {/* Badges */}
      <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
        {generatesObservation && (
          <span
            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{ background: '#0F766E' }}
            title="Generates observation"
          />
        )}
        {hasPhoto && (
          <Camera size={12} style={{ color: '#9CA3AF' }} />
        )}
        {hasLabRef && (
          <span
            className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
            style={{ background: '#7C3AED', color: '#FFFFFF' }}
          >
            LAB
          </span>
        )}
      </div>
    </button>
  );
}

function LabBadge({
  standard,
  source,
  onOpenKnowledge,
}: {
  standard: string;
  source: string;
  onOpenKnowledge?: (sourceId: string) => void;
}) {
  const isLabTest = source.startsWith('L-');

  const content = (
    <>
      <span
        className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 mt-0.5"
        style={{
          background: isLabTest ? '#7C3AED' : '#E5E7EB',
          color: isLabTest ? '#FFFFFF' : '#6B7280',
        }}
      >
        {isLabTest ? source : 'SOP'}
      </span>
      <span className="text-xs" style={{ color: isLabTest ? '#0F766E' : '#374151' }}>
        {standard}
      </span>
      {isLabTest && onOpenKnowledge && (
        <ExternalLink size={10} className="flex-shrink-0 mt-0.5" style={{ color: '#9CA3AF' }} />
      )}
    </>
  );

  if (isLabTest && onOpenKnowledge) {
    return (
      <button
        onClick={() => onOpenKnowledge(source)}
        className="flex items-start gap-2 py-1.5 w-full text-left hover:underline"
      >
        {content}
      </button>
    );
  }

  return (
    <div className="flex items-start gap-2 py-1">
      {content}
    </div>
  );
}
