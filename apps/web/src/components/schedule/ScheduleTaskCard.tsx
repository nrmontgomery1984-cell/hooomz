'use client';

/**
 * ScheduleTaskCard — Task block on the calendar: title, trade bar, time, status
 */

import type { CrewScheduleBlock } from '@hooomz/shared-contracts';

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  scheduled: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Scheduled' },
  in_progress: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'In Progress' },
  completed: { bg: 'bg-green-100', text: 'text-green-700', label: 'Done' },
  skipped: { bg: 'bg-gray-100', text: 'text-gray-400', label: 'Skipped' },
};

interface ScheduleTaskCardProps {
  block: CrewScheduleBlock;
  onClick?: (block: CrewScheduleBlock) => void;
  isActive?: boolean;
  crewName?: string;
}

export function ScheduleTaskCard({ block, onClick, isActive, crewName }: ScheduleTaskCardProps) {
  const status = STATUS_STYLES[block.status] || STATUS_STYLES.scheduled;

  return (
    <button
      onClick={() => onClick?.(block)}
      className={`w-full text-left rounded-lg border p-3 transition-colors ${
        isActive
          ? 'border-teal-400 bg-teal-50 shadow-sm ring-2 ring-teal-200'
          : 'border-gray-200 bg-white hover:bg-gray-50 shadow-sm'
      }`}
      style={{ minHeight: '44px' }}
    >
      <div className="flex items-start gap-2">
        {/* Trade color bar */}
        <div
          className="w-1 self-stretch rounded-full flex-shrink-0"
          style={{ backgroundColor: '#6B7280' }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-gray-900 truncate">{block.title}</span>
            <span className={`inline-flex px-1.5 py-0.5 text-[10px] font-medium rounded ${status.bg} ${status.text} flex-shrink-0`}>
              {status.label}
            </span>
          </div>

          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
            {block.startTime && (
              <span>{block.startTime}{block.endTime ? ` – ${block.endTime}` : ''}</span>
            )}
            {block.estimatedHours > 0 && (
              <span>{block.estimatedHours}h est</span>
            )}
            {block.actualHours > 0 && (
              <span className="text-teal-600 font-medium">{block.actualHours}h actual</span>
            )}
          </div>

          {(crewName || block.sopCode) && (
            <div className="flex items-center gap-2 mt-1">
              {crewName && (
                <span className="text-[10px] text-gray-500">{crewName}</span>
              )}
              {block.sopCode && (
                <span className="text-[10px] font-mono text-gray-400">{block.sopCode}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
