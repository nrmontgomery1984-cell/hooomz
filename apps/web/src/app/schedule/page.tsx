'use client';

/**
 * Schedule Page — Weekly calendar view with crew schedule blocks
 */

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { startOfWeek, addWeeks, format, addDays, isSameDay } from 'date-fns';
import { useActiveCrew } from '@/lib/crew/ActiveCrewContext';
import { useWeekSchedule, useTeamWeekSchedule, useUnscheduledTasks, useScheduleTask } from '@/lib/hooks/useSchedule';
import { useCrewMembers } from '@/lib/hooks/useCrewData';
import { WeekStrip, DayColumn, UnscheduledTaskList, ScheduleBottomSheet, TaskDetailSheet } from '@/components/schedule';
import type { Task, CrewScheduleBlock } from '@hooomz/shared-contracts';

type ViewMode = 'my' | 'team';

export default function SchedulePage() {
  const { crewMemberId, crewMemberName } = useActiveCrew();
  const [viewMode, setViewMode] = useState<ViewMode>('my');
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [schedulingTask, setSchedulingTask] = useState<Task | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<CrewScheduleBlock | null>(null);
  const [filterCrewId, setFilterCrewId] = useState<string | null>(null);

  const weekStartStr = format(weekStart, 'yyyy-MM-dd');

  // Data
  const { data: myBlocks = [], isLoading: myLoading } = useWeekSchedule(
    crewMemberId ?? '',
    weekStartStr,
  );
  const { data: teamBlocks = [], isLoading: teamLoading } = useTeamWeekSchedule(weekStartStr);
  const { data: unscheduled = [] } = useUnscheduledTasks();
  const { data: crewMembers = [] } = useCrewMembers();
  const scheduleTask = useScheduleTask();

  const allBlocks = viewMode === 'my' ? myBlocks : teamBlocks;
  const isLoading = viewMode === 'my' ? myLoading : teamLoading;

  // Crew name lookup map
  const crewMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const c of crewMembers) m[c.id] = c.name;
    return m;
  }, [crewMembers]);

  // Apply crew filter (team view only)
  const blocks = useMemo(() => {
    if (viewMode !== 'team' || !filterCrewId) return allBlocks;
    return allBlocks.filter((b) => b.crewMemberId === filterCrewId);
  }, [allBlocks, viewMode, filterCrewId]);

  // Group blocks by date
  const blocksByDate = useMemo(() => {
    const map: Record<string, CrewScheduleBlock[]> = {};
    for (const block of blocks) {
      if (!map[block.date]) map[block.date] = [];
      map[block.date].push(block);
    }
    return map;
  }, [blocks]);

  // Build 7 days
  const monday = startOfWeek(weekStart, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));

  const handlePrevWeek = () => setWeekStart(addWeeks(weekStart, -1));
  const handleNextWeek = () => setWeekStart(addWeeks(weekStart, 1));
  const handleToday = () => {
    const today = new Date();
    setWeekStart(startOfWeek(today, { weekStartsOn: 1 }));
    setSelectedDate(today);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pb-24" style={{ background: '#F3F4F6' }}>
        <div className="max-w-lg mx-auto px-4 py-12 text-center">
          <div className="w-8 h-8 border-3 rounded-full animate-spin mx-auto mb-3" style={{ borderColor: '#E5E7EB', borderTopColor: '#0F766E' }} />
          <p className="text-sm text-gray-400">Loading schedule...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: '#F3F4F6' }}>
      {/* Header */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E5E7EB' }}>
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold" style={{ color: '#111827' }}>Schedule</h1>
              <p className="text-xs text-gray-500">
                {viewMode === 'my' ? (crewMemberName ?? 'Select crew member') : 'All crew'}
              </p>
            </div>
            {/* View toggle */}
            <div className="flex border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('my')}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  viewMode === 'my' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-50'
                }`}
                style={{ minHeight: '36px' }}
              >
                My
              </button>
              <button
                onClick={() => setViewMode('team')}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  viewMode === 'team' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-50'
                }`}
                style={{ minHeight: '36px' }}
              >
                Team
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Crew filter pills — team view only */}
      {viewMode === 'team' && crewMembers.length > 0 && (
        <div className="overflow-x-auto" style={{ background: '#FFFFFF', borderBottom: '1px solid #E5E7EB' }}>
          <div className="max-w-lg mx-auto px-4 py-2 flex gap-2">
            <button
              onClick={() => setFilterCrewId(null)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filterCrewId === null
                  ? 'text-white'
                  : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
              }`}
              style={filterCrewId === null ? { backgroundColor: '#0F766E', minHeight: '36px' } : { minHeight: '36px' }}
            >
              All
            </button>
            {crewMembers.map((m) => (
              <button
                key={m.id}
                onClick={() => setFilterCrewId(filterCrewId === m.id ? null : m.id)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  filterCrewId === m.id
                    ? 'text-white'
                    : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
                }`}
                style={filterCrewId === m.id ? { backgroundColor: '#0F766E', minHeight: '36px' } : { minHeight: '36px' }}
              >
                {m.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Week strip */}
      <WeekStrip
        weekStart={weekStart}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        onPrevWeek={handlePrevWeek}
        onNextWeek={handleNextWeek}
        onToday={handleToday}
      />

      {/* Day content */}
      <div className="max-w-lg mx-auto px-4 mt-4 space-y-4">
        {/* Mobile: show selected day expanded */}
        <DayColumn
          date={selectedDate}
          blocks={blocksByDate[format(selectedDate, 'yyyy-MM-dd')] || []}
          onBlockClick={(block) => setSelectedBlock(block)}
          activeTaskId={selectedBlock?.taskId}
          crewMap={crewMap}
        />

        {/* Other days mini preview */}
        <div className="grid grid-cols-6 gap-1">
          {days
            .filter((d) => !isSameDay(d, selectedDate))
            .map((day) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDate(day)}
                  className="p-1 rounded hover:bg-white transition-colors"
                >
                  <DayColumn
                    date={day}
                    blocks={blocksByDate[dateStr] || []}
                    isExpanded={false}
                  />
                </button>
              );
            })}
        </div>

        {/* Unscheduled tasks */}
        <UnscheduledTaskList
          tasks={unscheduled}
          onTaskClick={(task) => setSchedulingTask(task)}
        />

        {/* Quick links */}
        <div className="flex gap-2">
          <Link
            href={`/schedule/day/${format(selectedDate, 'yyyy-MM-dd')}`}
            className="flex-1 text-center py-2 text-sm font-medium text-teal-700 border border-teal-200 rounded-lg hover:bg-teal-50 transition-colors"
            style={{ minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            Day Detail
          </Link>
          <Link
            href="/schedule/assign"
            className="flex-1 text-center py-2 text-sm font-medium text-teal-700 border border-teal-200 rounded-lg hover:bg-teal-50 transition-colors"
            style={{ minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            Bulk Assign
          </Link>
        </div>
      </div>

      {/* Schedule bottom sheet */}
      {schedulingTask && (
        <ScheduleBottomSheet
          task={schedulingTask}
          crewMembers={crewMembers}
          defaultDate={format(selectedDate, 'yyyy-MM-dd')}
          isPending={scheduleTask.isPending}
          onSchedule={(params) => {
            scheduleTask.mutate(params, {
              onSuccess: () => setSchedulingTask(null),
            });
          }}
          onClose={() => setSchedulingTask(null)}
        />
      )}

      {/* Task detail sheet with notes */}
      {selectedBlock && (
        <TaskDetailSheet
          block={selectedBlock}
          crewMembers={crewMembers}
          crewMap={crewMap}
          onClose={() => setSelectedBlock(null)}
        />
      )}
    </div>
  );
}
