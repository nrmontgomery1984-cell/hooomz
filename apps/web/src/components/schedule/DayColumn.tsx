'use client';

/**
 * DayColumn — Single day view: stacked task cards + hours summary
 */

import type { CrewScheduleBlock } from '@hooomz/shared-contracts';
import { ScheduleTaskCard } from './ScheduleTaskCard';
import { HoursSummaryBar } from './HoursSummaryBar';
import { format, isSameDay } from 'date-fns';

interface DayColumnProps {
  date: Date;
  blocks: CrewScheduleBlock[];
  onBlockClick?: (block: CrewScheduleBlock) => void;
  activeTaskId?: string;
  isExpanded?: boolean;
  crewMap?: Record<string, string>;
}

export function DayColumn({ date, blocks, onBlockClick, activeTaskId, isExpanded = true, crewMap }: DayColumnProps) {
  const today = new Date();
  const isToday = isSameDay(date, today);
  const totalScheduled = blocks.reduce((s, b) => s + b.estimatedHours, 0);
  const totalActual = blocks.reduce((s, b) => s + b.actualHours, 0);

  if (!isExpanded) {
    return (
      <div className="text-center">
        <div className={`text-xs font-medium ${isToday ? 'text-teal-700' : 'text-gray-500'}`}>
          {format(date, 'EEE')}
        </div>
        <div className={`text-sm font-semibold ${isToday ? 'text-teal-700' : 'text-gray-900'}`}>
          {format(date, 'd')}
        </div>
        {blocks.length > 0 && (
          <div className="flex justify-center mt-1 gap-0.5">
            {blocks.slice(0, 3).map((_, i) => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-gray-400" />
            ))}
            {blocks.length > 3 && (
              <span className="text-[8px] text-gray-400">+{blocks.length - 3}</span>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Day header */}
      <div className="flex items-center justify-between px-1">
        <div>
          <span className={`text-sm font-semibold ${isToday ? 'text-teal-700' : 'text-gray-900'}`}>
            {format(date, 'EEEE, MMM d')}
          </span>
          {isToday && (
            <span className="ml-2 text-[10px] font-medium text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded">
              Today
            </span>
          )}
        </div>
        <span className="text-xs text-gray-400">{blocks.length} task{blocks.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Task cards */}
      {blocks.length === 0 ? (
        <div className="text-center py-6 text-xs text-gray-400 border border-dashed border-gray-200 rounded-lg">
          No tasks scheduled
        </div>
      ) : (
        <div className="space-y-2">
          {blocks.map((block) => (
            <ScheduleTaskCard
              key={block.id}
              block={block}
              onClick={onBlockClick}
              isActive={block.taskId === activeTaskId}
              crewName={crewMap?.[block.crewMemberId]}
            />
          ))}
        </div>
      )}

      {/* Hours summary */}
      {blocks.length > 0 && (
        <HoursSummaryBar scheduled={totalScheduled} actual={totalActual} />
      )}
    </div>
  );
}
