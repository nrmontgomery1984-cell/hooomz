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
  { status: 'proposed', label: 'Proposed', color: 'var(--muted)' },
  { status: 'voting', label: 'Voting', color: 'var(--violet)' },
  { status: 'planned', label: 'Planned', color: 'var(--blue)' },
  { status: 'in-progress', label: 'In Progress', color: 'var(--yellow)' },
  { status: 'complete', label: 'Complete', color: 'var(--green)' },
  { status: 'published', label: 'Published', color: 'var(--accent)' },
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
              <h3 className="text-sm font-semibold text-[var(--mid)]">{label}</h3>
              <span className="text-xs text-[var(--muted)]">{tests.length}</span>
            </div>

            {/* Column body */}
            <div className="space-y-2 min-h-[100px] bg-[var(--surface)] rounded-xl p-2">
              {tests.length === 0 ? (
                <p className="text-xs text-[var(--muted)] text-center py-6">No tests</p>
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
