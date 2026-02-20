'use client';

/**
 * Bulk Schedule Assign Page — Select project, see unscheduled tasks, assign crew + dates
 */

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { useUnscheduledTasks, useBulkSchedule } from '@/lib/hooks/useSchedule';
import { useCrewMembers } from '@/lib/hooks/useCrewData';
import { useServicesContext } from '@/lib/services/ServicesContext';
import { useQuery } from '@tanstack/react-query';

interface PendingAssignment {
  taskId: string;
  taskTitle: string;
  crewMemberId: string;
  date: string;
  estimatedHours: number;
}

export default function ScheduleAssignPage() {
  const { services } = useServicesContext();
  const { data: projectsResult } = useQuery({
    queryKey: ['projects', 'all'],
    queryFn: () => services!.projects.findAll(),
    enabled: !!services,
  });
  const allProjects = projectsResult?.projects ?? [];

  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const { data: unscheduled = [], isLoading } = useUnscheduledTasks(selectedProjectId || undefined);
  const { data: crewMembers = [] } = useCrewMembers();
  const bulkSchedule = useBulkSchedule();

  const [assignments, setAssignments] = useState<PendingAssignment[]>([]);
  const [batchDate, setBatchDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [batchCrewId, setBatchCrewId] = useState('');
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());

  const toggleTask = (taskId: string) => {
    setSelectedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  };

  const handleBatchAssign = () => {
    if (selectedTasks.size === 0 || !batchCrewId || !batchDate) return;

    const newAssignments: PendingAssignment[] = [];
    for (const task of unscheduled) {
      if (selectedTasks.has(task.id)) {
        newAssignments.push({
          taskId: task.id,
          taskTitle: task.title,
          crewMemberId: batchCrewId,
          date: batchDate,
          estimatedHours: 1,
        });
      }
    }
    setAssignments((prev) => [...prev, ...newAssignments]);
    setSelectedTasks(new Set());
  };

  const removeAssignment = (taskId: string) => {
    setAssignments((prev) => prev.filter((a) => a.taskId !== taskId));
  };

  const handleSubmit = () => {
    if (assignments.length === 0) return;
    bulkSchedule.mutate(
      assignments.map(a => ({
        taskId: a.taskId,
        crewMemberId: a.crewMemberId,
        date: a.date,
        estimatedHours: a.estimatedHours,
      })),
      {
        onSuccess: () => {
          setAssignments([]);
        },
      }
    );
  };

  // Tasks not yet in pending assignments
  const availableTasks = useMemo(() => {
    const assignedIds = new Set(assignments.map(a => a.taskId));
    return unscheduled.filter(t => !assignedIds.has(t.id));
  }, [unscheduled, assignments]);

  return (
    <div className="min-h-screen pb-24" style={{ background: '#F3F4F6' }}>
      {/* Header */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E5E7EB' }}>
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center gap-2 mb-1">
            <Link href="/schedule" className="text-sm text-teal-700 hover:underline">Schedule</Link>
            <span className="text-xs text-gray-400">/</span>
          </div>
          <h1 className="text-xl font-bold" style={{ color: '#111827' }}>Bulk Assign</h1>
          <p className="text-xs text-gray-500 mt-0.5">Select tasks, pick crew + date, assign all at once</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 mt-4 space-y-4">
        {/* Project filter */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <label className="block">
            <span className="text-xs font-medium text-gray-600 block mb-1">Filter by Project</span>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
              style={{ minHeight: '44px' }}
            >
              <option value="">All Projects</option>
              {allProjects.map((p) => (
                <option key={p.id} value={p.id}>{p.name || p.id}</option>
              ))}
            </select>
          </label>
        </div>

        {/* Batch controls */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Batch Settings</h2>
          <div className="flex gap-3 mb-3">
            <label className="flex-1">
              <span className="text-xs font-medium text-gray-600 block mb-1">Date</span>
              <input
                type="date"
                value={batchDate}
                onChange={(e) => setBatchDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                style={{ minHeight: '44px' }}
              />
            </label>
            <label className="flex-1">
              <span className="text-xs font-medium text-gray-600 block mb-1">Crew</span>
              <select
                value={batchCrewId}
                onChange={(e) => setBatchCrewId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                style={{ minHeight: '44px' }}
              >
                <option value="">Select...</option>
                {crewMembers.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </label>
          </div>
          <button
            onClick={handleBatchAssign}
            disabled={selectedTasks.size === 0 || !batchCrewId || !batchDate}
            className="w-full py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-colors"
            style={{ minHeight: '44px' }}
          >
            Add {selectedTasks.size} task{selectedTasks.size !== 1 ? 's' : ''} to queue
          </button>
        </div>

        {/* Unscheduled task picker */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">
              Unscheduled Tasks
              <span className="ml-2 text-xs font-normal text-gray-400">{availableTasks.length}</span>
            </h2>
          </div>
          {isLoading ? (
            <div className="py-8 text-center text-xs text-gray-400">Loading...</div>
          ) : availableTasks.length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-400">No unscheduled tasks</div>
          ) : (
            <div className="max-h-64 overflow-y-auto">
              {availableTasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => toggleTask(task.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left border-t border-gray-50 transition-colors ${
                    selectedTasks.has(task.id) ? 'bg-teal-50' : 'hover:bg-gray-50'
                  }`}
                  style={{ minHeight: '44px' }}
                >
                  <div className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center ${
                    selectedTasks.has(task.id) ? 'border-teal-600 bg-teal-600' : 'border-gray-300'
                  }`}>
                    {selectedTasks.has(task.id) && (
                      <span className="text-white text-[10px]">✓</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-900 truncate">{task.title}</p>
                    <p className="text-[10px] text-gray-400">{task.projectId}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Pending assignments queue */}
        {assignments.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">
                Assignment Queue
                <span className="ml-2 text-xs font-normal text-gray-400">{assignments.length}</span>
              </h2>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {assignments.map((a) => (
                <div key={a.taskId} className="flex items-center justify-between px-4 py-2 border-t border-gray-50">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-900 truncate">{a.taskTitle}</p>
                    <p className="text-[10px] text-gray-400">{a.crewMemberId} &middot; {a.date}</p>
                  </div>
                  <button
                    onClick={() => removeAssignment(a.taskId)}
                    className="text-gray-400 hover:text-red-500 text-xs ml-2"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-gray-100">
              <button
                onClick={handleSubmit}
                disabled={bulkSchedule.isPending}
                className="w-full py-3 text-sm font-medium text-white rounded-lg disabled:opacity-50"
                style={{ backgroundColor: '#0F766E', minHeight: '44px' }}
              >
                {bulkSchedule.isPending
                  ? 'Scheduling...'
                  : `Schedule ${assignments.length} Task${assignments.length !== 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
