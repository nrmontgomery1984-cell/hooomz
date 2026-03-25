'use client';

/**
 * SOPSheetContent — Read-only SOP reference view for BottomSheet
 *
 * Shows SOP details (steps, stop conditions, lab evidence) inline
 * without navigating away from the project page.
 */

import { useMemo } from 'react';
import Link from 'next/link';
import { AlertTriangle, ExternalLink, Database, FlaskConical } from 'lucide-react';
import { getSOPById } from '@/lib/data/sops';
import { useSop, useSopByCode, useSopChecklistItems } from '@/lib/hooks/useLabsData';

interface SOPSheetContentProps {
  sopId: string;
  onOpenKnowledge?: (sourceId: string) => void;
}

export function SOPSheetContent({ sopId, onOpenKnowledge }: SOPSheetContentProps) {
  // Try database SOP (UUID or sopCode)
  const { data: dbSopById } = useSop(sopId);
  const isSopCode = sopId.startsWith('HI-SOP-');
  const { data: dbSopByCode } = useSopByCode(isSopCode ? sopId : '');
  const dbSop = dbSopById ?? dbSopByCode ?? null;
  const { data: dbChecklistItems = [] } = useSopChecklistItems(dbSop?.id ?? '');

  // Fallback to hardcoded SOP
  const hardcodedSop = getSOPById(sopId);

  // Normalize
  const sop = useMemo(() => {
    if (dbSop && dbChecklistItems.length > 0) {
      return {
        code: dbSop.sopCode || sopId,
        title: dbSop.title,
        detailId: dbSop.id,
        steps: dbChecklistItems
          .sort((a, b) => a.stepNumber - b.stepNumber)
          .map(item => ({ order: item.stepNumber, action: item.title })),
        stopConditions: [] as string[],
        criticalStandards: [] as { standard: string; source: string }[],
        isFromDatabase: true,
      };
    }
    if (hardcodedSop) {
      return {
        code: hardcodedSop.id,
        title: hardcodedSop.title,
        detailId: null,
        steps: hardcodedSop.quick_steps,
        stopConditions: hardcodedSop.stop_conditions,
        criticalStandards: hardcodedSop.critical_standards,
        isFromDatabase: false,
      };
    }
    return null;
  }, [dbSop, dbChecklistItems, hardcodedSop, sopId]);

  if (!sop) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm" style={{ color: 'var(--muted)' }}>SOP not found: {sopId}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full"
            style={{ background: 'var(--green-bg)', color: 'var(--accent)' }}
          >
            {sop.code}
          </span>
          {sop.isFromDatabase && (
            <Database size={12} style={{ color: 'var(--muted)' }} />
          )}
        </div>
        <h3 className="text-base font-semibold" style={{ color: 'var(--charcoal)' }}>
          {sop.title}
        </h3>
      </div>

      {/* Stop conditions */}
      {sop.stopConditions.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--red)' }}>
            Stop Conditions
          </p>
          {sop.stopConditions.map((condition, i) => (
            <div
              key={i}
              className="rounded-lg p-3 flex items-start gap-2"
              style={{ background: 'var(--red-bg)', borderLeft: '3px solid var(--red)' }}
            >
              <AlertTriangle size={14} style={{ color: 'var(--red)', flexShrink: 0, marginTop: 1 }} />
              <span className="text-xs leading-relaxed" style={{ color: 'var(--red)' }}>{condition}</span>
            </div>
          ))}
        </div>
      )}

      {/* Steps */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--muted)' }}>
          Steps
        </p>
        <div className="space-y-0">
          {sop.steps.map((step) => (
            <div
              key={step.order}
              className="flex items-start gap-3 py-2.5"
              style={{ borderBottom: '1px solid var(--surface-2)' }}
            >
              <span
                className="text-xs font-semibold flex-shrink-0 w-5 text-right mt-0.5"
                style={{ color: 'var(--muted)' }}
              >
                {step.order}.
              </span>
              <span className="text-xs leading-relaxed" style={{ color: 'var(--mid)' }}>
                {step.action}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Lab evidence */}
      {sop.criticalStandards.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--muted)' }}>
            Lab Evidence
          </p>
          <div className="space-y-2">
            {sop.criticalStandards.map((cs, i) => {
              const isLabTest = cs.source.startsWith('L-');
              return (
                <button
                  key={i}
                  disabled={!isLabTest || !onOpenKnowledge}
                  onClick={() => isLabTest && onOpenKnowledge?.(cs.source)}
                  className="w-full text-left rounded-lg p-3 flex items-start gap-2.5 transition-colors"
                  style={{
                    background: isLabTest ? 'var(--violet-bg)' : 'var(--surface)',
                    border: isLabTest ? '1px solid var(--violet-bg)' : '1px solid var(--surface-2)',
                    cursor: isLabTest && onOpenKnowledge ? 'pointer' : 'default',
                  }}
                >
                  <span
                    className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 mt-0.5"
                    style={{
                      background: isLabTest ? 'var(--violet)' : 'var(--border)',
                      color: isLabTest ? '#fff' : 'var(--muted)',
                    }}
                  >
                    {isLabTest ? cs.source : 'SOP'}
                  </span>
                  <span className="text-xs leading-relaxed flex-1" style={{ color: 'var(--mid)' }}>
                    {cs.standard}
                  </span>
                  {isLabTest && onOpenKnowledge && (
                    <FlaskConical size={12} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--violet)' }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Link to full SOP page */}
      {sop.detailId && (
        <Link
          href={`/labs/sops/${sop.detailId}`}
          className="inline-flex items-center gap-1 text-xs font-medium hover:underline"
          style={{ color: 'var(--accent)' }}
        >
          Open full SOP page <ExternalLink size={12} />
        </Link>
      )}
    </div>
  );
}
