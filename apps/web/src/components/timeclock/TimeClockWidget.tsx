'use client';

/**
 * Time Clock Widget (Build 3a)
 *
 * Persistent floating widget above BottomNav.
 * Collapsed: pill with task name + running timer.
 * Expanded: today's entries, controls (Break/Switch/Done/Clock Out).
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

  // Active state color
  const activeColor = isOnBreak ? 'var(--amber)' : 'var(--blue)';

  // Not clocked in — show clock-in pill
  if (!isClockedIn) {
    return (
      <>
        <button
          onClick={() => setShowClockInPicker(true)}
          className="fixed bottom-[72px] right-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg min-h-[44px]"
          style={{ background: 'var(--blue)', color: '#FFFFFF' }}
        >
          <Clock size={16} />
          <span className="text-sm font-medium">Clock In</span>
        </button>

        {showClockInPicker && (
          <TaskPicker
            projectId={projectId}
            onSelect={(taskId, taskTitle) => {
              clockIn.mutate({ crewMemberId, crewMemberName, projectId, taskId, taskTitle });
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
        style={{ background: activeColor, color: '#FFFFFF' }}
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
      <div className="fixed inset-0 z-50 bg-black/20" onClick={() => setExpanded(false)} />

      {/* Widget card */}
      <div
        className="fixed bottom-[72px] right-4 left-4 z-50 rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: 'var(--surface-1)', maxWidth: '400px', marginLeft: 'auto', border: '1px solid var(--border)' }}
      >
        {/* Header */}
        <div
          className="px-4 py-3 flex items-center justify-between"
          style={{ background: activeColor }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#FFFFFF' }}>
            {isOnBreak ? <Coffee size={16} /> : <Clock size={16} />}
            <span style={{ fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-cond)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              {isOnBreak ? 'On Break' : 'Clocked In'} — {crewMemberName}
            </span>
          </div>
          <button onClick={() => setExpanded(false)} style={{ color: 'rgba(255,255,255,0.8)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <X size={16} />
          </button>
        </div>

        {/* Current task + timer */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--font-cond)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {isOnBreak ? 'Break' : 'Current Task'}
              </div>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {isOnBreak ? 'Taking a break' : currentTaskTitle || 'No task selected'}
              </div>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 600, color: activeColor }}>
              {formatElapsed(elapsed)}
            </div>
          </div>
        </div>

        {/* Today's entries summary */}
        {todayEntries.length > 0 && (
          <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: 9, fontWeight: 700, fontFamily: 'var(--font-cond)', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 4 }}>
              Today — {formatMinutes(todayTotal)}
            </div>
            <div style={{ maxHeight: 120, overflowY: 'auto' }}>
              {todayEntries.slice(0, 5).map((entry) => {
                const isRunning = !entry.clock_out;
                const mins = entry.total_hours != null
                  ? Math.round(entry.total_hours * 60)
                  : isRunning ? '...' : 0;
                const taskName = tasksList.find((t) => t.id === entry.task_instance_id)?.title
                  || (entry.entryType === 'break' ? 'Break' : 'Task');

                return (
                  <div key={entry.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, marginBottom: 2 }}>
                    <span style={{ color: isRunning ? 'var(--blue)' : entry.entryType === 'break' ? 'var(--amber)' : 'var(--text-3)', flexShrink: 0 }}>
                      {isRunning ? '▶' : entry.entryType === 'break' ? '⏸' : '✓'}
                    </span>
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text)' }}>
                      {taskName}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)', flexShrink: 0 }}>
                      {typeof mins === 'number' ? `${mins}m` : mins}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Controls */}
        <div style={{ padding: '10px 16px', display: 'flex', gap: 8 }}>
          {isOnBreak ? (
            <button
              onClick={() => { endBreak.mutate({ crewMemberId }); setExpanded(false); }}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 0', borderRadius: 8, fontSize: 13, fontWeight: 600, background: 'var(--blue)', color: '#FFFFFF', border: 'none', cursor: 'pointer', minHeight: 44 }}
            >
              <ArrowRight size={16} />
              Resume
            </button>
          ) : (
            <>
              <button
                onClick={() => { startBreak.mutate({ crewMemberId }); }}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 0', borderRadius: 8, fontSize: 13, fontWeight: 600, background: 'var(--amber-dim)', color: 'var(--amber)', border: 'none', cursor: 'pointer', minHeight: 44 }}
              >
                <Coffee size={14} />
                Break
              </button>
              <button
                onClick={() => setShowTaskPicker(true)}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 0', borderRadius: 8, fontSize: 13, fontWeight: 600, background: 'var(--surface-3)', color: 'var(--text-2)', border: 'none', cursor: 'pointer', minHeight: 44 }}
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
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 0', borderRadius: 8, fontSize: 13, fontWeight: 600, background: 'var(--green-dim)', color: 'var(--green)', border: 'none', cursor: 'pointer', minHeight: 44 }}
              >
                <Check size={14} />
                Done
              </button>
            </>
          )}
        </div>

        {/* Clock Out */}
        <div style={{ padding: '0 16px 12px' }}>
          <button
            onClick={() => { clockOut.mutate({ crewMemberId, crewMemberName }); setExpanded(false); }}
            style={{ width: '100%', padding: '10px 0', borderRadius: 8, fontSize: 13, fontWeight: 600, background: 'var(--red-dim)', color: 'var(--red)', border: 'none', cursor: 'pointer', minHeight: 44 }}
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
          onSwitchTask={() => { dismissIdle(); setShowTaskPicker(true); setExpanded(true); }}
          onBreak={() => { dismissIdle(); startBreak.mutate({ crewMemberId }); }}
          onClockOut={() => { dismissIdle(); clockOut.mutate({ crewMemberId, crewMemberName }); }}
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
