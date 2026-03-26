'use client';

/**
 * Schedule Day Detail — Expanded view for one day with all tasks and hours breakdown
 */

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { useActiveCrew } from '@/lib/crew/ActiveCrewContext';
import { useWeekSchedule, useUnscheduledTasks, useScheduleTask } from '@/lib/hooks/useSchedule';
import { useCrewMembers } from '@/lib/hooks/useCrewData';
import { ScheduleTaskCard, HoursSummaryBar, ScheduleBottomSheet } from '@/components/schedule';
import type { Task, CrewScheduleBlock } from '@hooomz/shared-contracts';

export default function ScheduleDayPage() {
  const params = useParams();
  const dateStr = params.date as string;
  const date = useMemo(() => parseISO(dateStr), [dateStr]);

  const { crewMemberId } = useActiveCrew();
  const { data: blocks = [], isLoading } = useWeekSchedule(crewMemberId ?? '', dateStr);
  const { data: unscheduled = [] } = useUnscheduledTasks();
  const { data: crewMembers = [] } = useCrewMembers();
  const scheduleTask = useScheduleTask();
  const [schedulingTask, setSchedulingTask] = useState<Task | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<CrewScheduleBlock | null>(null);

  // Filter to just this day
  const dayBlocks = useMemo(() => blocks.filter(b => b.date === dateStr), [blocks, dateStr]);
  const totalScheduled = dayBlocks.reduce((s, b) => s + b.estimatedHours, 0);
  const totalActual = dayBlocks.reduce((s, b) => s + b.actualHours, 0);

  if (isLoading) {
    return (
      <div className="min-h-screen pb-24" style={{ background: 'var(--surface-2)' }}>
        <div className="max-w-lg mx-auto px-4 py-12 text-center">
          <div className="w-8 h-8 border-3 rounded-full animate-spin mx-auto mb-3" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--accent)' }} />
          <p className="text-sm" style={{ color: 'var(--muted)' }}>Loading day...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--surface-2)' }}>
      {/* Header */}
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center gap-2 mb-1">
            <Link href="/schedule" className="text-sm hover:underline" style={{ color: 'var(--accent)' }}>Schedule</Link>
            <span className="text-xs" style={{ color: 'var(--muted)' }}>/</span>
          </div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--charcoal)' }}>
            {format(date, 'EEEE, MMMM d, yyyy')}
          </h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
            {dayBlocks.length} task{dayBlocks.length !== 1 ? 's' : ''} &middot; {totalScheduled}h scheduled
          </p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 mt-4 space-y-4">
        {/* Hours summary */}
        {dayBlocks.length > 0 && (
          <div className="rounded-xl border p-4 shadow-sm" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <h2 className="text-sm font-semibold mb-2" style={{ color: 'var(--charcoal)' }}>Hours</h2>
            <HoursSummaryBar scheduled={totalScheduled} actual={totalActual} />
          </div>
        )}

        {/* Task list */}
        {dayBlocks.length === 0 ? (
          <div className="rounded-xl border p-8 text-center shadow-sm" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>No tasks scheduled for this day.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {dayBlocks.map((block) => (
              <ScheduleTaskCard
                key={block.id}
                block={block}
                onClick={setSelectedBlock}
              />
            ))}
          </div>
        )}

        {/* Unscheduled tasks to assign to this day */}
        {unscheduled.length > 0 && (
          <div className="rounded-xl border p-4 shadow-sm" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <h2 className="text-sm font-semibold mb-2" style={{ color: 'var(--charcoal)' }}>Assign to This Day</h2>
            <div className="space-y-1">
              {unscheduled.slice(0, 5).map((task) => (
                <button
                  key={task.id}
                  onClick={() => setSchedulingTask(task)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-left"
                  style={{ minHeight: '44px' }}
                >
                  <span className="text-sm truncate" style={{ color: 'var(--mid)' }}>{task.title}</span>
                  <span className="text-xs font-medium flex-shrink-0 ml-2" style={{ color: 'var(--accent)' }}>+ Add</span>
                </button>
              ))}
              {unscheduled.length > 5 && (
                <Link
                  href="/schedule/assign"
                  className="block text-center py-2 text-xs hover:underline"
                  style={{ color: 'var(--accent)' }}
                >
                  View all {unscheduled.length} unscheduled
                </Link>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Block detail modal */}
      {selectedBlock && (
        <div className="fixed inset-0 bg-black/30 flex items-end justify-center z-50">
          <div className="rounded-t-2xl w-full max-w-lg p-4 pb-8 shadow-xl" style={{ background: 'var(--surface)' }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold" style={{ color: 'var(--charcoal)' }}>Task Details</h3>
              <button onClick={() => setSelectedBlock(null)} className="text-lg" style={{ color: 'var(--muted)' }}>&times;</button>
            </div>
            <div className="space-y-2 text-sm">
              <p className="font-medium" style={{ color: 'var(--charcoal)' }}>{selectedBlock.title}</p>
              <div className="flex justify-between">
                <span style={{ color: 'var(--muted)' }}>Status</span>
                <span className="capitalize" style={{ color: 'var(--charcoal)' }}>{selectedBlock.status.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--muted)' }}>Crew</span>
                <span style={{ color: 'var(--charcoal)' }}>{selectedBlock.crewMemberId}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--muted)' }}>Time</span>
                <span style={{ color: 'var(--charcoal)' }}>{selectedBlock.startTime ?? 'All day'}{selectedBlock.endTime ? ` – ${selectedBlock.endTime}` : ''}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--muted)' }}>Hours</span>
                <span style={{ color: 'var(--charcoal)' }}>{selectedBlock.estimatedHours}h est / {selectedBlock.actualHours}h actual</span>
              </div>
              {selectedBlock.sopCode && (
                <div className="flex justify-between">
                  <span style={{ color: 'var(--muted)' }}>SOP</span>
                  <span className="font-mono" style={{ color: 'var(--charcoal)' }}>{selectedBlock.sopCode}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Schedule bottom sheet */}
      {schedulingTask && (
        <ScheduleBottomSheet
          task={schedulingTask}
          crewMembers={crewMembers}
          defaultDate={dateStr}
          isPending={scheduleTask.isPending}
          onSchedule={(params) => {
            scheduleTask.mutate(params, {
              onSuccess: () => setSchedulingTask(null),
            });
          }}
          onClose={() => setSchedulingTask(null)}
        />
      )}
    </div>
  );
}
