'use client';

/**
 * SOP SCRIPT Phase View — Checklist items grouped by SCRIPT phase
 * Shield → Clear → Ready → Install → Punch → Turnover
 */

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  useSop,
  useSopByCode,
  useSopScriptPhases,
  useAssignScriptPhase,
} from '@/lib/hooks/useLabsData';
import { ScriptPhaseGroup } from '@/components/labs';
import { SCRIPT_PHASES, SCRIPT_PHASE_ORDER } from '@/lib/constants/scriptPhases';
import type { ScriptPhase, SopChecklistItemTemplate } from '@hooomz/shared-contracts';

export default function SOPScriptPage() {
  const params = useParams();
  const paramId = params.id as string;

  const { data: sopById, isLoading: byIdLoading } = useSop(paramId);
  const isSopCode = paramId.startsWith('HI-SOP-');
  const { data: sopByCode, isLoading: byCodeLoading } = useSopByCode(isSopCode ? paramId : '');
  const sop = sopById ?? sopByCode ?? null;
  const sopId = sop?.id || paramId;
  const sopLoading = isSopCode ? (byIdLoading || byCodeLoading) : byIdLoading;

  const { data: phaseGroups, isLoading: phasesLoading } = useSopScriptPhases(sopId);
  const assignPhase = useAssignScriptPhase();

  const [assigningItem, setAssigningItem] = useState<SopChecklistItemTemplate | null>(null);

  if (sopLoading || phasesLoading) {
    return (
      <div className="min-h-screen pb-24" style={{ background: '#F3F4F6' }}>
        <div className="max-w-lg mx-auto px-4 py-12 text-center">
          <div className="w-8 h-8 border-3 rounded-full animate-spin mx-auto mb-3" style={{ borderColor: '#E5E7EB', borderTopColor: '#0F766E' }} />
          <p className="text-sm text-gray-400">Loading SCRIPT view...</p>
        </div>
      </div>
    );
  }

  if (!sop) {
    return (
      <div className="min-h-screen pb-24" style={{ background: '#F3F4F6' }}>
        <div className="max-w-lg mx-auto px-4 py-12 text-center">
          <p className="text-sm text-gray-500">SOP not found: {paramId}</p>
          <Link href="/labs/sops" className="text-sm text-teal-700 hover:underline mt-2 inline-block">
            Back to SOPs
          </Link>
        </div>
      </div>
    );
  }

  const handleAssign = async (phase: ScriptPhase | null) => {
    if (!assigningItem) return;
    await assignPhase.mutateAsync({ itemId: assigningItem.id, phase, sopId });
    setAssigningItem(null);
  };

  // Count stats
  const totalItems = phaseGroups
    ? Object.values(phaseGroups).flat().length
    : 0;
  const assignedItems = phaseGroups
    ? totalItems - (phaseGroups.unassigned?.length || 0)
    : 0;

  return (
    <div className="min-h-screen pb-24" style={{ background: '#F3F4F6' }}>
      {/* Header */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E5E7EB' }}>
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center gap-2 mb-1">
            <Link href="/labs" className="text-sm text-teal-700 hover:underline">Labs</Link>
            <span className="text-xs text-gray-400">/</span>
            <Link href="/labs/sops" className="text-sm text-teal-700 hover:underline">SOPs</Link>
            <span className="text-xs text-gray-400">/</span>
            <Link href={`/labs/sops/${sopId}`} className="text-sm text-teal-700 hover:underline">{sop.sopCode}</Link>
            <span className="text-xs text-gray-400">/</span>
          </div>
          <h1 className="text-xl font-bold" style={{ color: '#111827' }}>
            SCRIPT View — {sop.title}
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {assignedItems}/{totalItems} steps assigned to phases
          </p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 mt-4 space-y-2">
        {/* Phase legend */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {SCRIPT_PHASE_ORDER.map((phase) => {
            const config = SCRIPT_PHASES[phase];
            const count = phaseGroups?.[phase]?.length || 0;
            return (
              <div
                key={phase}
                className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-white border border-gray-200 text-xs flex-shrink-0"
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: config.color }} />
                <span className="text-gray-700">{config.label}</span>
                <span className="text-gray-400">{count}</span>
              </div>
            );
          })}
        </div>

        {/* Phase groups */}
        {phaseGroups && (
          <>
            {SCRIPT_PHASE_ORDER.map((phase) => (
              <ScriptPhaseGroup
                key={phase}
                phase={phase}
                items={phaseGroups[phase] || []}
                onItemClick={(item) => setAssigningItem(item)}
              />
            ))}
            <ScriptPhaseGroup
              phase="unassigned"
              items={phaseGroups.unassigned || []}
              onItemClick={(item) => setAssigningItem(item)}
            />
          </>
        )}
      </div>

      {/* Phase assignment modal */}
      {assigningItem && (
        <div className="fixed inset-0 bg-black/30 flex items-end justify-center z-50">
          <div className="bg-white rounded-t-2xl w-full max-w-lg p-4 pb-8 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900">Assign SCRIPT Phase</h3>
              <button
                onClick={() => setAssigningItem(null)}
                className="text-gray-400 hover:text-gray-600 text-lg"
              >
                ×
              </button>
            </div>
            <p className="text-xs text-gray-500 mb-4 line-clamp-2">
              Step {assigningItem.stepNumber}: {assigningItem.title}
            </p>
            <div className="space-y-2">
              {SCRIPT_PHASE_ORDER.map((phase) => {
                const config = SCRIPT_PHASES[phase];
                const isCurrent = assigningItem.scriptPhase === phase;
                return (
                  <button
                    key={phase}
                    onClick={() => handleAssign(phase)}
                    disabled={assignPhase.isPending}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg border transition-colors text-left ${
                      isCurrent ? 'border-teal-300 bg-teal-50' : 'border-gray-200 hover:bg-gray-50'
                    }`}
                    style={{ minHeight: '44px' }}
                  >
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: config.color }} />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-800">{config.label}</span>
                      <span className="text-xs text-gray-500 ml-2">{config.description}</span>
                    </div>
                    {isCurrent && <span className="text-xs text-teal-600">Current</span>}
                  </button>
                );
              })}
              <button
                onClick={() => handleAssign(null)}
                disabled={assignPhase.isPending}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-left"
                style={{ minHeight: '44px' }}
              >
                <span className="w-3 h-3 rounded-full flex-shrink-0 bg-gray-300" />
                <span className="text-sm text-gray-600">Unassign</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
