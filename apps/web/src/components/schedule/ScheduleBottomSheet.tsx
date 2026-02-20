'use client';

/**
 * ScheduleBottomSheet — Bottom sheet for scheduling a task: date picker, crew selector, time
 */

import { useState } from 'react';
import type { Task, CrewMember } from '@hooomz/shared-contracts';
import { format } from 'date-fns';

interface ScheduleBottomSheetProps {
  task: Task;
  crewMembers: CrewMember[];
  onSchedule: (params: {
    taskId: string;
    crewMemberId: string;
    date: string;
    startTime?: string;
    estimatedHours?: number;
  }) => void;
  onClose: () => void;
  isPending?: boolean;
  defaultDate?: string;
}

export function ScheduleBottomSheet({
  task,
  crewMembers,
  onSchedule,
  onClose,
  isPending,
  defaultDate,
}: ScheduleBottomSheetProps) {
  const [date, setDate] = useState(defaultDate ?? format(new Date(), 'yyyy-MM-dd'));
  const [crewId, setCrewId] = useState(crewMembers[0]?.id ?? '');
  const [startTime, setStartTime] = useState('08:00');
  const [hours, setHours] = useState(1);

  const handleSubmit = () => {
    if (!crewId || !date) return;
    onSchedule({
      taskId: task.id,
      crewMemberId: crewId,
      date,
      startTime,
      estimatedHours: hours,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-end justify-center z-50">
      <div className="bg-white rounded-t-2xl w-full max-w-lg p-4 pb-8 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900">Schedule Task</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-lg"
          >
            &times;
          </button>
        </div>

        {/* Task title */}
        <div className="bg-gray-50 rounded-lg px-3 py-2 mb-4">
          <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
          <p className="text-xs text-gray-500">Project: {task.projectId}</p>
        </div>

        {/* Date */}
        <label className="block mb-3">
          <span className="text-xs font-medium text-gray-600 block mb-1">Date</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            style={{ minHeight: '44px' }}
          />
        </label>

        {/* Crew member */}
        <label className="block mb-3">
          <span className="text-xs font-medium text-gray-600 block mb-1">Crew Member</span>
          <select
            value={crewId}
            onChange={(e) => setCrewId(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            style={{ minHeight: '44px' }}
          >
            {crewMembers.map((m) => (
              <option key={m.id} value={m.id}>{m.name} ({m.tier})</option>
            ))}
          </select>
        </label>

        {/* Start time + hours */}
        <div className="flex gap-3 mb-4">
          <label className="flex-1">
            <span className="text-xs font-medium text-gray-600 block mb-1">Start Time</span>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              style={{ minHeight: '44px' }}
            />
          </label>
          <label className="w-24">
            <span className="text-xs font-medium text-gray-600 block mb-1">Hours</span>
            <input
              type="number"
              min={0.5}
              max={12}
              step={0.5}
              value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              style={{ minHeight: '44px' }}
            />
          </label>
        </div>

        {/* Actions */}
        <button
          onClick={handleSubmit}
          disabled={isPending || !crewId || !date}
          className="w-full py-3 text-sm font-medium text-white rounded-lg disabled:opacity-50"
          style={{ backgroundColor: '#0F766E', minHeight: '44px' }}
        >
          {isPending ? 'Scheduling...' : 'Schedule'}
        </button>
      </div>
    </div>
  );
}
