'use client';

/**
 * Idle Prompt (Build 3a)
 *
 * Modal overlay when idle for 15 minutes.
 * "Still working on {task}?"
 * Options: Still Working, Switch Task, On Break, Done for Day.
 * 48px buttons, amber border for attention.
 */

import { Coffee, ArrowRight, LogOut } from 'lucide-react';

interface IdlePromptProps {
  taskTitle: string;
  onStillWorking: () => void;
  onSwitchTask: () => void;
  onBreak: () => void;
  onClockOut: () => void;
}

export function IdlePrompt({
  taskTitle,
  onStillWorking,
  onSwitchTask,
  onBreak,
  onClockOut,
}: IdlePromptProps) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Card */}
      <div
        className="relative w-full max-w-sm rounded-2xl overflow-hidden"
        style={{ background: '#FFFFFF', border: '2px solid #F59E0B' }}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-3 text-center">
          <div className="text-2xl mb-2">👋</div>
          <h3 className="text-base font-semibold" style={{ color: '#111827' }}>
            Still working on {taskTitle || 'this task'}?
          </h3>
          <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>
            No activity for 15 minutes.
          </p>
        </div>

        {/* Buttons */}
        <div className="px-5 pb-5 space-y-2">
          <button
            onClick={onStillWorking}
            className="w-full py-3 rounded-xl text-sm font-medium min-h-[48px]"
            style={{ background: '#0F766E', color: '#FFFFFF' }}
          >
            Yes, still working
          </button>

          <button
            onClick={onSwitchTask}
            className="w-full py-3 rounded-xl text-sm font-medium min-h-[48px] flex items-center justify-center gap-2"
            style={{ background: '#F3F4F6', color: '#374151' }}
          >
            <ArrowRight size={14} />
            Switch task
          </button>

          <button
            onClick={onBreak}
            className="w-full py-3 rounded-xl text-sm font-medium min-h-[48px] flex items-center justify-center gap-2"
            style={{ background: '#FEF3C7', color: '#92400E' }}
          >
            <Coffee size={14} />
            On break
          </button>

          <button
            onClick={onClockOut}
            className="w-full py-3 rounded-xl text-sm font-medium min-h-[48px] flex items-center justify-center gap-2"
            style={{ background: '#FEE2E2', color: '#991B1B' }}
          >
            <LogOut size={14} />
            Done for the day
          </button>
        </div>
      </div>
    </div>
  );
}
