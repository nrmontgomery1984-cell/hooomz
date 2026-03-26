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
  const confidenceColorStyle = {
    high: 'var(--green)',
    medium: 'var(--yellow)',
    low: 'var(--muted)',
  }[parsedEvent.confidence];

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 animate-in slide-in-from-bottom duration-300">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/20 -z-10"
        onClick={onDiscard}
      />

      {/* Card */}
      <div className="rounded-t-2xl shadow-xl max-h-[80vh] overflow-y-auto" style={{background:'var(--surface)'}}>
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full" style={{background:'var(--border-s)'}} />
        </div>

        {/* Header */}
        <div className="px-4 pb-3 border-b" style={{borderColor:'var(--border)'}}>
          <h2 className="text-lg font-semibold" style={{color:'var(--charcoal)'}}>
            Confirm Activity
          </h2>
          <p className="text-sm" style={{color:'var(--muted)'}}>
            Review and edit before saving
          </p>
        </div>

        {/* Content */}
        <div className="px-4 py-4 space-y-4">
          {/* Original transcript */}
          <div className="rounded-lg p-3" style={{background:'var(--surface)'}}>
            <p className="text-xs mb-1" style={{color:'var(--muted)'}}>You said:</p>
            <p className="text-sm italic" style={{color:'var(--mid)'}}>
              &ldquo;{parsedEvent.transcript}&rdquo;
            </p>
            <p className="text-xs mt-1" style={{color: confidenceColorStyle}}>
              {parsedEvent.confidence === 'high'
                ? 'Detected with high confidence'
                : parsedEvent.confidence === 'medium'
                  ? 'Detected with medium confidence'
                  : 'Interpreted as field note'}
            </p>
          </div>

          {/* Event Type Selector */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{color:'var(--mid)'}}>
              Event Type
            </label>
            <div className="relative">
              <button
                onClick={() => setIsEventTypeOpen(!isEventTypeOpen)}
                className="
                  w-full flex items-center justify-between
                  min-h-[48px] px-4
                  border rounded-lg
                  text-left
                  hover:border-[var(--accent)] transition-colors
                "
                style={{background:'var(--surface)', borderColor:'var(--border)', color:'var(--charcoal)'}}
              >
                <span>{getEventTypeLabel(parsedEvent.event_type)}</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className={`w-5 h-5 transition-transform ${
                    isEventTypeOpen ? 'rotate-180' : ''
                  }`}
                  style={{color:'var(--muted)'}}
                >
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              {isEventTypeOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 border rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto" style={{background:'var(--surface)', borderColor:'var(--border)'}}>
                  {eventTypeOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleEventTypeChange(option.value)}
                      className={`
                        w-full text-left px-4 py-3 min-h-[48px]
                        transition-colors
                        ${
                          option.value === parsedEvent.event_type
                            ? 'bg-[var(--accent-bg)] text-[var(--accent)] font-medium'
                            : ''
                        }
                      `}
                      style={{color: option.value === parsedEvent.event_type ? undefined : 'var(--mid)'}}
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
              <label className="block text-sm font-medium mb-2" style={{color:'var(--mid)'}}>
                Select Task
              </label>
              <select
                value={selectedTaskId || ''}
                onChange={(e) => onTaskSelect?.(e.target.value)}
                className="
                  w-full min-h-[48px] px-4
                  border rounded-lg
                  focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]
                "
                style={{background:'var(--surface)', borderColor:'var(--border)', color:'var(--charcoal)'}}
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
            <label className="block text-sm font-medium mb-2" style={{color:'var(--mid)'}}>
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
                border rounded-lg
                focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]
                resize-none
              "
              style={{background:'var(--surface)', borderColor:'var(--border)', color:'var(--charcoal)'}}
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
              font-medium
              rounded-lg
              active:scale-98
              transition-all
            "
            style={{background:'var(--surface-2)', color:'var(--mid)'}}
          >
            Discard
          </button>
          <button
            onClick={onConfirm}
            disabled={showTaskSelector && !selectedTaskId}
            className="
              flex-1 min-h-[48px] px-4
              bg-[var(--accent)] text-white font-medium
              rounded-lg
              hover:bg-[var(--accent)]/90 active:scale-98
              disabled:cursor-not-allowed disabled:opacity-50
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
