'use client';

/**
 * Test Pipeline View — Kanban-style columns grouped by test status
 */

import React from 'react';
import type { LabsTest, LabsTestStatus } from '@hooomz/shared-contracts';
import { TestCard } from './TestCard';

interface TestPipelineViewProps {
  pipeline: Record<LabsTestStatus, LabsTest[]>;
  onTestClick?: (test: LabsTest) => void;
  className?: string;
}

const COLUMNS: { status: LabsTestStatus; label: string; color: string }[] = [
  { status: 'proposed', label: 'Proposed', color: '#9CA3AF' },
  { status: 'voting', label: 'Voting', color: '#8B5CF6' },
  { status: 'planned', label: 'Planned', color: '#3B82F6' },
  { status: 'in-progress', label: 'In Progress', color: '#F59E0B' },
  { status: 'complete', label: 'Complete', color: '#10B981' },
  { status: 'published', label: 'Published', color: '#0F766E' },
];

export function TestPipelineView({ pipeline, onTestClick, className = '' }: TestPipelineViewProps) {
  return (
    <div className={`flex gap-4 overflow-x-auto pb-4 ${className}`}>
      {COLUMNS.map(({ status, label, color }) => {
        const tests = pipeline[status] || [];
        return (
          <div key={status} className="flex-shrink-0 w-72">
            {/* Column header */}
            <div className="flex items-center gap-2 mb-3 px-1">
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: color }}
              />
              <h3 className="text-sm font-semibold text-gray-700">{label}</h3>
              <span className="text-xs text-gray-400">{tests.length}</span>
            </div>

            {/* Column body */}
            <div className="space-y-2 min-h-[100px] bg-gray-50 rounded-xl p-2">
              {tests.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-6">No tests</p>
              ) : (
                tests.map((test) => (
                  <TestCard
                    key={test.id}
                    test={test}
                    onClick={onTestClick ? () => onTestClick(test) : undefined}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
