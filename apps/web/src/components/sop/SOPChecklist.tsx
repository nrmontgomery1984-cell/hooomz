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
 * Bridge logic:
 *   1. Labs SOP (useSop — for SOPs created via /labs/sops with UUID IDs)
 *   2. Standards SOP (useStandardSOPByCode — HI-SOP-* codes from /standards/sops)
 *   3. Hardcoded static SOPs in lib/data/sops.ts (legacy fallback)
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
import { useStandardSOPByCode } from '@/lib/hooks/useStandardSOPs';
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
  detailId: string | null;
  /** Route prefix for detail page — defaults to /labs/sops, override for Standards SOPs */
  detailRoute?: '/standards/sops' | '/labs/sops';
  steps: NormalizedStep[];
  stopConditions: string[];
  criticalStandards: { standard: string; source: string }[];
  isFromDatabase: boolean;
}

export function SOPChecklist({ taskId, sopId, projectId, onOpenSOP, onOpenKnowledge }: SOPChecklistProps) {
  const { crewMemberId } = useActiveCrew();

  // Try Labs SOP first (database SOPs created via /labs/sops with UUID IDs)
  const { data: dbSop } = useSop(sopId);
  const { data: dbChecklistItems = [] } = useSopChecklistItems(dbSop?.id ?? '');

  // Try Standards SOP (HI-SOP-* codes from /standards/sops)
  const { data: standardSop } = useStandardSOPByCode(sopId);

  // Fall back to hardcoded SOP
  const hardcodedSop = getSOPById(sopId);

  // Normalize into common rendering format
  const sop = useMemo((): NormalizedSOP | null => {
    if (dbSop && dbChecklistItems.length > 0) {
      // Labs DB SOP found — use it
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
        stopConditions: [],
        criticalStandards: [],
        isFromDatabase: true,
      };
    }

    if (standardSop) {
      // Standards SOP (HI-SOP-* codes) — flatten procedures into steps
      const steps: NormalizedStep[] = [];
      let order = 1;
      for (const proc of standardSop.procedures) {
        if (proc.steps && proc.steps.length > 0) {
          for (const step of proc.steps) {
            steps.push({ order: order++, action: step });
          }
        }
      }
      // If no procedure steps, fall back to checklist checkbox fields
      if (steps.length === 0) {
        for (const section of standardSop.checklist.sections) {
          for (const field of section.fields) {
            if (field.type === 'checkbox') {
              steps.push({ order: order++, action: field.label });
            }
          }
        }
      }
      return {
        title: standardSop.title,
        detailId: standardSop.id,
        detailRoute: '/standards/sops',
        steps,
        stopConditions: standardSop.criticalStandards
          .filter(cs => cs.category === 'stop-condition')
          .map(cs => cs.description),
        criticalStandards: standardSop.criticalStandards
          .filter(cs => cs.category !== 'stop-condition')
          .map(cs => ({ standard: cs.description, source: cs.code })),
        isFromDatabase: true,
      };
    }

    if (hardcodedSop) {
      // Fallback to hardcoded SOP
      return {
        title: hardcodedSop.title,
        detailId: null,
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
  }, [dbSop, dbChecklistItems, standardSop, hardcodedSop]);

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
        className="w-full mt-2 rounded-xl p-2.5 flex items-center justify-between min-h-[38px]"
        style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold" style={{ color: 'var(--charcoal)' }}>SOP</span>
          <span className="text-xs" style={{ color: 'var(--muted)' }}>{sop.title}</span>
          {sop.isFromDatabase && (
            <Database size={10} style={{ color: 'var(--muted)' }} />
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium" style={{ color: completedCount === totalSteps ? 'var(--green)' : 'var(--muted)' }}>
            {completedCount}/{totalSteps}
          </span>
          <ChevronDown size={14} style={{ color: 'var(--muted)' }} />
        </div>
      </button>
    );
  }

  return (
    <div
      className="mt-2 rounded-xl overflow-hidden"
      style={{ border: '1px solid var(--border)', borderLeft: '3px solid var(--accent)' }}
    >
      {/* Header */}
      <div
        className="w-full p-2.5 flex items-center justify-between min-h-[38px]"
        style={{ background: 'var(--surface)' }}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-xs font-semibold" style={{ color: 'var(--charcoal)' }}>SOP</span>
          {onOpenSOP ? (
            <button
              className="text-xs flex items-center gap-1 hover:underline text-left"
              style={{ color: 'var(--accent)' }}
              onClick={(e) => { e.stopPropagation(); onOpenSOP(sopId); }}
            >
              {sop.title}
              <ExternalLink size={10} />
            </button>
          ) : sop.detailId ? (
            <Link
              href={`${sop.detailRoute ?? '/labs/sops'}/${sop.detailId}`}
              className="text-xs flex items-center gap-1 hover:underline"
              style={{ color: 'var(--accent)' }}
              onClick={(e) => e.stopPropagation()}
            >
              {sop.title}
              <ExternalLink size={10} />
            </Link>
          ) : (
            <span className="text-xs" style={{ color: 'var(--muted)' }}>{sop.title}</span>
          )}
          {sop.isFromDatabase && (
            <Database size={10} style={{ color: 'var(--muted)' }} />
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs font-medium" style={{ color: completedCount === totalSteps ? 'var(--green)' : 'var(--muted)' }}>
            {completedCount}/{totalSteps}
          </span>
          <button onClick={() => setExpanded(false)} className="p-1 -m-1">
            <ChevronUp size={14} style={{ color: 'var(--muted)' }} />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-2.5">
        <div className="w-full h-1 rounded-full" style={{ background: 'var(--border)' }}>
          <div
            className="h-1 rounded-full transition-all"
            style={{
              width: `${progressPct}%`,
              background: completedCount === totalSteps ? 'var(--green)' : 'var(--accent)',
            }}
          />
        </div>
      </div>

      {/* STOP conditions */}
      {sop.stopConditions.length > 0 && (
        <div className="px-2.5 pt-2.5 space-y-1.5">
          {sop.stopConditions.map((condition, i) => (
            <div
              key={i}
              className="rounded-lg p-2 flex items-start gap-2"
              style={{ background: 'var(--red-bg)', borderLeft: '3px solid var(--red)' }}
            >
              <AlertTriangle size={14} style={{ color: 'var(--red)', flexShrink: 0, marginTop: 1 }} />
              <span className="text-xs" style={{ color: 'var(--red)' }}>{condition}</span>
            </div>
          ))}
        </div>
      )}

      {/* Steps */}
      <div className="px-2.5 py-1.5">
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
        <div className="px-2.5 py-1.5">
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
        <div className="px-2.5 pb-2.5 space-y-1">
          <div className="text-[10px] font-medium uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
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
      className="w-full flex items-start gap-2.5 py-2 min-h-[36px] text-left"
      style={{ borderBottom: '1px solid var(--surface-2)' }}
    >
      {/* Checkbox */}
      <div
        className="flex-shrink-0 w-5 h-5 rounded mt-0.5 flex items-center justify-center"
        style={{
          border: isChecked ? 'none' : '2px solid var(--border)',
          background: isChecked ? 'var(--accent)' : 'transparent',
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
            color: isChecked ? 'var(--muted)' : 'var(--charcoal)',
            textDecoration: isChecked ? 'line-through' : 'none',
          }}
        >
          <span className="font-medium" style={{ color: isChecked ? 'var(--muted)' : 'var(--muted)' }}>
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
            style={{ background: 'var(--accent)' }}
            title="Generates observation"
          />
        )}
        {hasPhoto && (
          <Camera size={12} style={{ color: 'var(--muted)' }} />
        )}
        {hasLabRef && (
          <span
            className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
            style={{ background: 'var(--violet)', color: '#fff' }}
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
          background: isLabTest ? 'var(--violet)' : 'var(--border)',
          color: isLabTest ? '#fff' : 'var(--muted)',
        }}
      >
        {isLabTest ? source : 'SOP'}
      </span>
      <span className="text-xs" style={{ color: isLabTest ? 'var(--accent)' : 'var(--mid)' }}>
        {standard}
      </span>
      {isLabTest && onOpenKnowledge && (
        <ExternalLink size={10} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--muted)' }} />
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
