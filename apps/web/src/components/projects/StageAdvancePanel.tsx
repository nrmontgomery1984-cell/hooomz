'use client';

/**
 * Stage Advance Panel — advance button + blocker list + confirm dialog
 *
 * Soft gate: blockers are warnings, can override with "Advance Anyway?"
 */

import { useState } from 'react';
import { PanelSection } from '@/components/ui/PanelSection';
import { ArrowRight, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useCanAdvanceStage, useAdvanceStage } from '@/lib/hooks/useStageGate';
import { JOB_STAGE_META } from '@hooomz/shared-contracts';
import type { JobStage } from '@hooomz/shared-contracts';

interface StageAdvancePanelProps {
  projectId: string;
  currentStage: JobStage | undefined;
}

export function StageAdvancePanel({ projectId, currentStage }: StageAdvancePanelProps) {
  const { data: gateResult, isLoading, error } = useCanAdvanceStage(projectId, currentStage);
  const advanceMutation = useAdvanceStage(projectId);
  const [showConfirm, setShowConfirm] = useState(false);

  if (isLoading) {
    return (
      <PanelSection label="Stage Advancement">
        <div style={{ padding: 12, fontSize: 11, color: 'var(--muted)' }}>Checking prerequisites…</div>
      </PanelSection>
    );
  }

  if (error) {
    return (
      <PanelSection label="Stage Advancement">
        <div style={{ padding: 12, fontSize: 11, color: 'var(--red)' }}>
          Error: {(error as Error).message}
        </div>
      </PanelSection>
    );
  }

  if (!gateResult || !gateResult.nextStage) return null;

  const nextLabel = JOB_STAGE_META[gateResult.nextStage]?.label ?? gateResult.nextStage;
  const hasBlockers = gateResult.blockers.length > 0;

  function handleAdvance() {
    if (hasBlockers && !showConfirm) {
      setShowConfirm(true);
      return;
    }
    advanceMutation.mutate(gateResult!.nextStage!);
    setShowConfirm(false);
  }

  return (
    <PanelSection label="Stage Advancement">
      <div style={{ padding: '12px' }}>
        {/* Status */}
        {hasBlockers ? (
          <div style={{ marginBottom: 10 }}>
            {gateResult.blockers.map((b, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0' }}>
                <AlertTriangle size={12} style={{ color: 'var(--amber)', flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: 'var(--mid)' }}>{b}</span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <CheckCircle2 size={12} style={{ color: 'var(--green)' }} />
            <span style={{ fontSize: 11, color: 'var(--mid)' }}>All prerequisites met</span>
          </div>
        )}

        {/* Confirm dialog */}
        {showConfirm && hasBlockers && (
          <div style={{
            padding: '10px', marginBottom: 10, borderRadius: 'var(--radius)',
            background: 'var(--amber-dim)', border: '1px solid var(--amber)',
          }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--charcoal)', marginBottom: 6 }}>
              Prerequisites incomplete
            </p>
            <p style={{ fontSize: 11, color: 'var(--mid)', marginBottom: 8 }}>
              Advance anyway? This may cause issues with incomplete prerequisites.
            </p>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={handleAdvance}
                disabled={advanceMutation.isPending}
                style={{
                  flex: 1, padding: '7px 0', borderRadius: 'var(--radius)', fontSize: 11, fontWeight: 600,
                  cursor: 'pointer', background: 'var(--amber)', color: '#fff', border: 'none',
                }}
              >
                {advanceMutation.isPending ? 'Advancing...' : 'Advance Anyway'}
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                style={{
                  padding: '7px 12px', borderRadius: 'var(--radius)', fontSize: 11, fontWeight: 600,
                  cursor: 'pointer', background: 'none', border: '1px solid var(--border)', color: 'var(--muted)',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Advance button */}
        {!showConfirm && (
          <button
            onClick={handleAdvance}
            disabled={advanceMutation.isPending}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              width: '100%', padding: '9px 0', borderRadius: 'var(--radius)',
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
              background: hasBlockers ? 'var(--surface-2)' : 'var(--blue)',
              color: hasBlockers ? 'var(--mid)' : '#fff',
              border: hasBlockers ? '1px solid var(--border)' : 'none',
            }}
          >
            <ArrowRight size={13} />
            {advanceMutation.isPending ? 'Advancing...' : `Advance to ${nextLabel}`}
          </button>
        )}
      </div>
    </PanelSection>
  );
}
