'use client';

/**
 * VoiceConfirmationCard
 *
 * Shows parsed event from voice input.
 * Editable fields (event type, notes).
 * Task selector if event_type is task.*
 * Confirm / Discard buttons.
 *
 * Touch targets: 48px+ (work gloves friendly)
 *
 * Decision Filter Check:
 * - #6 Mobile/Field: Editable before confirm, easy to fix mistakes
 * - #1 Activity Log: Creates events with input_method: 'voice'
 */

import { useState, useCallback, useEffect } from 'react';
import {
  type ParsedVoiceEvent,
  getEventTypeLabel,
  getEventTypeOptions,
} from '@/lib/voice';

interface VoiceConfirmationCardProps {
  /** The parsed event to confirm */
  parsedEvent: ParsedVoiceEvent;
  /** Callback to update the event */
  onUpdate: (updates: Partial<ParsedVoiceEvent>) => void;
  /** Callback to confirm and create the event */
  onConfirm: () => void;
  /** Callback to discard */
  onDiscard: () => void;
  /** Available tasks for selection (if needed) */
  tasks?: Array<{ id: string; title: string }>;
  /** Currently selected task ID */
  selectedTaskId?: string;
  /** Callback when task is selected */
  onTaskSelect?: (taskId: string) => void;
}

export function VoiceConfirmationCard({
  parsedEvent,
  onUpdate,
  onConfirm,
  onDiscard,
  tasks = [],
  selectedTaskId,
  onTaskSelect,
}: VoiceConfirmationCardProps) {
  const [isEventTypeOpen, setIsEventTypeOpen] = useState(false);
  const [notes, setNotes] = useState('');

  // Initialize notes from event_data
  useEffect(() => {
    const eventNotes =
      (parsedEvent.event_data.notes as string) ||
      (parsedEvent.event_data.content as string) ||
      (parsedEvent.event_data.reason as string) ||
      parsedEvent.transcript;
    setNotes(eventNotes);
  }, [parsedEvent]);

  const handleEventTypeChange = useCallback(
    (newType: string) => {
      onUpdate({ event_type: newType });
      setIsEventTypeOpen(false);
    },
    [onUpdate]
  );

  const handleNotesChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newNotes = e.target.value;
      setNotes(newNotes);

      // Update the appropriate field based on event type
      const dataKey = parsedEvent.event_type.includes('blocked')
        ? 'reason'
        : parsedEvent.event_type === 'field_note.created'
          ? 'content'
          : 'notes';

      onUpdate({
        event_data: {
          ...parsedEvent.event_data,
          [dataKey]: newNotes,
        },
      });
    },
    [parsedEvent.event_type, parsedEvent.event_data, onUpdate]
  );

  const eventTypeOptions = getEventTypeOptions();
  const showTaskSelector =
    parsedEvent.needsTaskSelector && tasks.length > 0;

  // Get confidence color
  const confidenceColor = {
    high: 'text-green-600',
    medium: 'text-amber-600',
    low: 'text-slate-500',
  }[parsedEvent.confidence];

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 animate-in slide-in-from-bottom duration-300">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/20 -z-10"
        onClick={onDiscard}
      />

      {/* Card */}
      <div className="bg-white rounded-t-2xl shadow-xl max-h-[80vh] overflow-y-auto">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-slate-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-4 pb-3 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800">
            Confirm Activity
          </h2>
          <p className="text-sm text-slate-500">
            Review and edit before saving
          </p>
        </div>

        {/* Content */}
        <div className="px-4 py-4 space-y-4">
          {/* Original transcript */}
          <div className="bg-slate-50 rounded-lg p-3">
            <p className="text-xs text-slate-500 mb-1">You said:</p>
            <p className="text-sm text-slate-700 italic">
              &ldquo;{parsedEvent.transcript}&rdquo;
            </p>
            <p className={`text-xs mt-1 ${confidenceColor}`}>
              {parsedEvent.confidence === 'high'
                ? 'Detected with high confidence'
                : parsedEvent.confidence === 'medium'
                  ? 'Detected with medium confidence'
                  : 'Interpreted as field note'}
            </p>
          </div>

          {/* Event Type Selector */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Event Type
            </label>
            <div className="relative">
              <button
                onClick={() => setIsEventTypeOpen(!isEventTypeOpen)}
                className="
                  w-full flex items-center justify-between
                  min-h-[48px] px-4
                  bg-white border border-slate-200 rounded-lg
                  text-left text-slate-800
                  hover:border-teal/50 transition-colors
                "
              >
                <span>{getEventTypeLabel(parsedEvent.event_type)}</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className={`w-5 h-5 text-slate-400 transition-transform ${
                    isEventTypeOpen ? 'rotate-180' : ''
                  }`}
                >
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              {isEventTypeOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
                  {eventTypeOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleEventTypeChange(option.value)}
                      className={`
                        w-full text-left px-4 py-3 min-h-[48px]
                        hover:bg-slate-50 transition-colors
                        ${
                          option.value === parsedEvent.event_type
                            ? 'bg-teal/10 text-teal font-medium'
                            : 'text-slate-700'
                        }
                      `}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Task Selector (if needed) */}
          {showTaskSelector && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Select Task
              </label>
              <select
                value={selectedTaskId || ''}
                onChange={(e) => onTaskSelect?.(e.target.value)}
                className="
                  w-full min-h-[48px] px-4
                  bg-white border border-slate-200 rounded-lg
                  text-slate-800
                  focus:border-teal focus:ring-1 focus:ring-teal
                "
              >
                <option value="">Select a task...</option>
                {tasks.map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Notes/Content Field */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {parsedEvent.event_type.includes('blocked')
                ? 'Reason'
                : parsedEvent.event_type === 'field_note.created'
                  ? 'Note Content'
                  : 'Notes'}
            </label>
            <textarea
              value={notes}
              onChange={handleNotesChange}
              rows={3}
              className="
                w-full px-4 py-3
                bg-white border border-slate-200 rounded-lg
                text-slate-800 placeholder-slate-400
                focus:border-teal focus:ring-1 focus:ring-teal
                resize-none
              "
              placeholder={
                parsedEvent.event_type.includes('blocked')
                  ? 'What is blocking this task?'
                  : 'Add any additional notes...'
              }
            />
          </div>

          {/* Camera prompt for photos */}
          {parsedEvent.openCamera && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-sm text-amber-800 flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    fillRule="evenodd"
                    d="M1 8a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 018.07 3h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0016.07 6H17a2 2 0 012 2v7a2 2 0 01-2 2H3a2 2 0 01-2-2V8zm13.5 3a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM10 14a3 3 0 100-6 3 3 0 000 6z"
                    clipRule="evenodd"
                  />
                </svg>
                Camera will open after confirm
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-4 pb-6 pt-2 flex gap-3">
          <button
            onClick={onDiscard}
            className="
              flex-1 min-h-[48px] px-4
              bg-slate-100 text-slate-700 font-medium
              rounded-lg
              hover:bg-slate-200 active:scale-98
              transition-all
            "
          >
            Discard
          </button>
          <button
            onClick={onConfirm}
            disabled={showTaskSelector && !selectedTaskId}
            className="
              flex-1 min-h-[48px] px-4
              bg-teal text-white font-medium
              rounded-lg
              hover:bg-teal/90 active:scale-98
              disabled:bg-slate-300 disabled:cursor-not-allowed
              transition-all
            "
          >
            Confirm
          </button>
        </div>

        {/* Bottom safe area */}
        <div className="h-6" />
      </div>
    </div>
  );
}

export default VoiceConfirmationCard;
