'use client';

/**
 * SCRIPT Phase Group — Phase header with colored icon + grouped checklist items
 * Used in the SCRIPT-phase SOP viewer
 */

import React from 'react';
import type { SopChecklistItemTemplate, ScriptPhase } from '@hooomz/shared-contracts';
import { SCRIPT_PHASES } from '../../lib/constants/scriptPhases';

interface ScriptPhaseGroupProps {
  phase: ScriptPhase | 'unassigned';
  items: SopChecklistItemTemplate[];
  onItemClick?: (item: SopChecklistItemTemplate) => void;
  className?: string;
}

export function ScriptPhaseGroup({ phase, items, onItemClick, className = '' }: ScriptPhaseGroupProps) {
  const phaseConfig = phase !== 'unassigned' ? SCRIPT_PHASES[phase] : null;
  const label = phaseConfig?.label || 'Unassigned';
  const color = phaseConfig?.color || '#9CA3AF';
  const icon = phaseConfig?.icon || '○';
  const description = phaseConfig?.description || 'Steps not yet assigned to a SCRIPT phase';

  if (items.length === 0) return null;

  return (
    <div className={`mb-4 ${className}`}>
      {/* Phase header */}
      <div className="flex items-center gap-2 mb-2 px-1">
        <span
          className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
          style={{ backgroundColor: color }}
        >
          {icon}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-gray-900">{label}</h3>
            <span className="text-xs text-gray-400">{items.length} step{items.length !== 1 ? 's' : ''}</span>
          </div>
          <p className="text-xs text-gray-500 truncate">{description}</p>
        </div>
      </div>

      {/* Checklist items */}
      <div className="space-y-1 ml-8">
        {items.map((item) => (
          <div
            key={item.id}
            className={`flex items-start gap-2 px-3 py-2 rounded-lg border border-gray-100 bg-white text-sm ${onItemClick ? 'cursor-pointer hover:bg-gray-50 transition-colors' : ''}`}
            onClick={onItemClick ? () => onItemClick(item) : undefined}
            role={onItemClick ? 'button' : undefined}
            tabIndex={onItemClick ? 0 : undefined}
          >
            <span className="text-xs font-mono text-gray-400 mt-0.5 flex-shrink-0">
              {item.stepNumber}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-gray-800">{item.title}</p>
              {item.isCritical && (
                <span className="inline-flex px-1.5 py-0.5 text-xs font-medium rounded bg-red-50 text-red-600 mt-1">
                  Critical
                </span>
              )}
            </div>
            {item.requiresPhoto && (
              <span className="text-gray-400 text-xs flex-shrink-0" title="Requires photo">
                📷
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
