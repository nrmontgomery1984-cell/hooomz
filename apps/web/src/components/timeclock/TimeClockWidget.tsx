'use client';

/**
 * Time Clock Widget (Build 3a)
 *
 * Persistent floating widget above BottomNav.
 * Collapsed: pill with task name + running timer.
 * Expanded: today's entries, controls (Break/Switch/Done/Clock Out).
 *
 * Timer recalculates from stored timestamp — survives background/nav.
 * Position: fixed bottom-[72px] right-4 z-50 (above BottomNav z-40).
 */

import { useState, useEffect } from 'react';
import { Clock, Coffee, ArrowRight, Check, X } from 'lucide-react';
import { useActiveCrew } from '@/lib/crew/ActiveCrewContext';
import {
  useTimeClockState,
  useTodayEntries,
  useTodayTotal,
  useClockIn,
  useClockOut,
  useSwitchTask,
  useCompleteTimedTask,
  useStartBreak,
  useEndBreak,
} from '@/lib/hooks/useTimeClock';
import { useLocalTasks } from '@/lib/hooks/useLocalData';
import { usePendingBatchItems, useConfirmBatchItem, useSkipBatchItem, useConfirmAllBatch } from '@/lib/hooks/useLabsData';
import { useIdleDetection } from '@/lib/hooks/useIdleDetection';
import { TaskPicker } from './TaskPicker';
import { IdlePrompt } from './IdlePrompt';
import { BatchConfirmModal } from '@/components/labs';

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatMinutes(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = Math.round(totalMinutes % 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function TimeClockWidget() {
  const { crewMemberId, crewMemberName, projectId, hasActiveSession } = useActiveCrew();
  const { data: clockState } = useTimeClockState(crewMemberId);
  const { data: todayEntries = [] } = useTodayEntries(crewMemberId);
  const { data: todayTotal = 0 } = useTodayTotal(crewMemberId);
  const { data: tasksData } = useLocalTasks(projectId);
  const tasksList = Array.isArray(tasksData) ? tasksData : tasksData?.tasks ?? [];

  const clockIn = useClockIn();
  const clockOut = useClockOut();
  const switchTask = useSwitchTask();
  const completeTask = useCompleteTimedTask();
  const startBreak = useStartBreak();
  const endBreak = useEndBreak();

  const [expanded, setExpanded] = useState(false);
  const [showTaskPicker, setShowTaskPicker] = useState(false);
  const [showClockInPicker, setShowClockInPicker] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchTaskId, setBatchTaskId] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);

  // Batch hooks
  const { data: pendingBatchItems = [] } = usePendingBatchItems(batchTaskId || '');
  const confirmBatchItem = useConfirmBatchItem();
  const skipBatchItem = useSkipBatchItem();
  const confirmAllBatch = useConfirmAllBatch();

  const isClockedIn = clockState?.isClockedIn ?? false;
  const isOnBreak = clockState?.isOnBreak ?? false;

  // Idle detection
  const { isIdle, dismissIdle } = useIdleDetection({
    crewMemberId,
    isClockedIn,
    isOnBreak,
  });
  const currentTaskTitle = clockState?.currentTaskTitle || '';
  const clockInTime = clockState?.clockInTime;

  // Timer: recalculate from stored timestamp every second
  useEffect(() => {
    if (!isClockedIn || !clockInTime) {
      setElapsed(0);
      return;
    }

    function tick() {
      const start = new Date(clockInTime!).getTime();
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }

    tick();
    const interval = setInterval(tick, 1000);

    // Recalculate on visibility change (tab comes back to foreground)
    function onVisibility() {
      if (document.visibilityState === 'visible') tick();
    }
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [isClockedIn, clockInTime]);

  // Don't render if no crew session
  if (!hasActiveSession || !crewMemberId || !crewMemberName || !projectId) return null;

  // Not clocked in — show clock-in pill
  if (!isClockedIn) {
    return (
      <>
        <button
          onClick={() => setShowClockInPicker(true)}
          className="fixed bottom-[72px] right-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg min-h-[44px]"
          style={{ background: '#0F766E', color: '#FFFFFF' }}
        >
          <Clock size={16} />
          <span className="text-sm font-medium">Clock In</span>
        </button>

        {showClockInPicker && (
          <TaskPicker
            projectId={projectId}
            onSelect={(taskId, taskTitle) => {
              clockIn.mutate({
                crewMemberId,
                crewMemberName,
                projectId,
                taskId,
                taskTitle,
              });
              setShowClockInPicker(false);
            }}
            onClose={() => setShowClockInPicker(false)}
          />
        )}
      </>
    );
  }

  // Collapsed view — pill with task name + timer
  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="fixed bottom-[72px] right-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg min-h-[44px]"
        style={{
          background: isOnBreak ? '#F59E0B' : '#0F766E',
          color: '#FFFFFF',
        }}
      >
        {isOnBreak ? <Coffee size={16} /> : <Clock size={16} />}
        <span className="text-sm font-medium truncate max-w-[120px]">
          {isOnBreak ? 'Break' : currentTaskTitle || 'Working'}
        </span>
        <span className="text-sm font-mono tabular-nums">
          {formatElapsed(elapsed)}
        </span>
      </button>
    );
  }

  // Expanded view
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/20"
        onClick={() => setExpanded(false)}
      />

      {/* Widget card */}
      <div
        className="fixed bottom-[72px] right-4 left-4 z-50 rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: '#FFFFFF', maxWidth: '400px', marginLeft: 'auto' }}
      >
        {/* Header */}
        <div
          className="px-4 py-3 flex items-center justify-between"
          style={{ background: isOnBreak ? '#F59E0B' : '#0F766E' }}
        >
          <div className="flex items-center gap-2 text-white">
            {isOnBreak ? <Coffee size={16} /> : <Clock size={16} />}
            <span className="text-xs font-semibold uppercase tracking-wide">
              {isOnBreak ? 'On Break' : 'Clocked In'} — {crewMemberName}
            </span>
          </div>
          <button
            onClick={() => setExpanded(false)}
            className="text-white/80 hover:text-white p-1"
          >
            <X size={16} />
          </button>
        </div>

        {/* Current task + timer */}
        <div className="px-4 py-3" style={{ borderBottom: '1px solid #E5E7EB' }}>
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="text-xs" style={{ color: '#9CA3AF' }}>
                {isOnBreak ? 'Break' : 'Current Task'}
              </div>
              <div className="text-sm font-medium truncate" style={{ color: '#111827' }}>
                {isOnBreak ? 'Taking a break' : currentTaskTitle || 'No task selected'}
              </div>
            </div>
            <div
              className="text-xl font-mono tabular-nums font-semibold"
              style={{ color: isOnBreak ? '#F59E0B' : '#0F766E' }}
            >
              {formatElapsed(elapsed)}
            </div>
          </div>
        </div>

        {/* Today's entries summary */}
        {todayEntries.length > 0 && (
          <div className="px-4 py-2" style={{ borderBottom: '1px solid #E5E7EB' }}>
            <div className="text-[10px] font-medium uppercase tracking-wide mb-1" style={{ color: '#9CA3AF' }}>
              Today — {formatMinutes(todayTotal)}
            </div>
            <div className="space-y-1 max-h-[120px] overflow-y-auto">
              {todayEntries.slice(0, 5).map(entry => {
                const isRunning = !entry.clock_out;
                const mins = entry.total_hours != null
                  ? Math.round(entry.total_hours * 60)
                  : isRunning ? '...' : 0;
                const taskName = tasksList.find(t => t.id === entry.task_instance_id)?.title
                  || (entry.entryType === 'break' ? 'Break' : 'Task');

                return (
                  <div key={entry.id} className="flex items-center gap-2 text-xs">
                    <span style={{ color: isRunning ? '#0F766E' : entry.entryType === 'break' ? '#F59E0B' : '#9CA3AF' }}>
                      {isRunning ? '▶' : entry.entryType === 'break' ? '⏸' : '✓'}
                    </span>
                    <span className="flex-1 truncate" style={{ color: '#374151' }}>
                      {taskName}
                    </span>
                    <span className="font-mono tabular-nums" style={{ color: '#9CA3AF' }}>
                      {typeof mins === 'number' ? `${mins}m` : mins}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="px-4 py-3 flex gap-2">
          {isOnBreak ? (
            <button
              onClick={() => {
                endBreak.mutate({ crewMemberId });
                setExpanded(false);
              }}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-sm font-medium min-h-[48px]"
              style={{ background: '#0F766E', color: '#FFFFFF' }}
            >
              <ArrowRight size={16} />
              Resume
            </button>
          ) : (
            <>
              <button
                onClick={() => {
                  startBreak.mutate({ crewMemberId });
                }}
                className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-sm font-medium min-h-[48px]"
                style={{ background: '#FEF3C7', color: '#92400E' }}
              >
                <Coffee size={14} />
                Break
              </button>
              <button
                onClick={() => setShowTaskPicker(true)}
                className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-sm font-medium min-h-[48px]"
                style={{ background: '#F3F4F6', color: '#374151' }}
              >
                <ArrowRight size={14} />
                Switch
              </button>
              <button
                onClick={() => {
                  const prevTaskId = clockState?.currentTaskId;
                  completeTask.mutate({ crewMemberId, crewMemberName }, {
                    onSuccess: (result) => {
                      if (result.batchCheckNeeded && prevTaskId) {
                        setBatchTaskId(prevTaskId);
                        setShowBatchModal(true);
                      }
                    },
                  });
                  setExpanded(false);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-sm font-medium min-h-[48px]"
                style={{ background: '#D1FAE5', color: '#065F46' }}
              >
                <Check size={14} />
                Done
              </button>
            </>
          )}
        </div>

        {/* Clock Out */}
        <div className="px-4 pb-3">
          <button
            onClick={() => {
              clockOut.mutate({ crewMemberId, crewMemberName });
              setExpanded(false);
            }}
            className="w-full py-3 rounded-xl text-sm font-medium min-h-[48px]"
            style={{ background: '#FEE2E2', color: '#991B1B' }}
          >
            Clock Out
          </button>
        </div>
      </div>

      {/* Task picker modal */}
      {showTaskPicker && (
        <TaskPicker
          projectId={projectId}
          currentTaskId={clockState?.currentTaskId}
          onSelect={(taskId, taskTitle) => {
            const prevTaskId = clockState?.currentTaskId;
            switchTask.mutate({ crewMemberId, crewMemberName, newTaskId: taskId, newTaskTitle: taskTitle }, {
              onSuccess: (result) => {
                if (result.batchCheckNeeded && prevTaskId) {
                  setBatchTaskId(prevTaskId);
                  setShowBatchModal(true);
                }
              },
            });
            setShowTaskPicker(false);
            setExpanded(false);
          }}
          onClose={() => setShowTaskPicker(false)}
        />
      )}

      {/* Idle prompt */}
      {isIdle && isClockedIn && !isOnBreak && (
        <IdlePrompt
          taskTitle={currentTaskTitle}
          onStillWorking={dismissIdle}
          onSwitchTask={() => {
            dismissIdle();
            setShowTaskPicker(true);
            setExpanded(true);
          }}
          onBreak={() => {
            dismissIdle();
            startBreak.mutate({ crewMemberId });
          }}
          onClockOut={() => {
            dismissIdle();
            clockOut.mutate({ crewMemberId, crewMemberName });
          }}
        />
      )}

      {/* Batch confirm modal */}
      {showBatchModal && batchTaskId && (
        <BatchConfirmModal
          isOpen={showBatchModal}
          onClose={() => { setShowBatchModal(false); setBatchTaskId(null); }}
          pendingItems={pendingBatchItems}
          onConfirmItem={async (pendingBatchId, overrides) => {
            await confirmBatchItem.mutateAsync({ pendingBatchId, overrides });
          }}
          onSkipItem={async (pendingBatchId) => {
            await skipBatchItem.mutateAsync(pendingBatchId);
          }}
          onConfirmAll={async () => {
            await confirmAllBatch.mutateAsync(batchTaskId);
          }}
          isProcessing={confirmBatchItem.isPending || confirmAllBatch.isPending}
        />
      )}
    </>
  );
}
