/**
 * Voice Parser - MVP keyword matching for voice input
 *
 * Parses natural language voice input into activity events.
 * This is the MVP implementation using simple keyword matching.
 * Future versions may use LLM for more sophisticated parsing.
 *
 * Decision Filter Check:
 * - #5 Mental Model: Matches how contractors naturally speak
 * - #6 Mobile/Field: Works one-handed, speak naturally
 * - #1 Activity Log: Creates events for the spine
 */

/**
 * Partial activity event from voice parsing
 * Some fields need to be filled in by the UI (project_id, entity_id)
 */
export interface ParsedVoiceEvent {
  event_type: string;
  event_data: Record<string, unknown>;
  /** Whether a task selector should be shown */
  needsTaskSelector?: boolean;
  /** Whether the camera should open for photo */
  openCamera?: boolean;
  /** Original transcript for reference */
  transcript: string;
  /** Confidence level of the parse */
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Keyword patterns for different event types
 */
const TASK_COMPLETION_KEYWORDS = [
  'finished',
  'completed',
  'done',
  'complete',
  'finish',
  'wrapped up',
  'all done',
  'knocked out',
];

const TASK_BLOCKED_KEYWORDS = [
  'blocked',
  'waiting',
  'stuck',
  'can\'t proceed',
  'need',
  'missing',
  'held up',
  'on hold',
  'waiting on',
  'waiting for',
];

const PHOTO_KEYWORDS = [
  'photo',
  'picture',
  'pic',
  'snap',
  'image',
  'take a photo',
  'take a picture',
  'document',
];

const INSPECTION_PASSED_KEYWORDS = [
  'inspection passed',
  'passed inspection',
  'inspector approved',
  'inspection good',
  'inspection ok',
];

const INSPECTION_FAILED_KEYWORDS = [
  'inspection failed',
  'failed inspection',
  'inspector rejected',
  'inspection not passed',
  'needs reinspection',
];

const PROGRESS_KEYWORDS = [
  'started',
  'beginning',
  'working on',
  'starting',
  'in progress',
];

/**
 * Parse voice input transcript into a partial activity event
 *
 * @param transcript - The raw voice transcript
 * @returns Parsed event with event_type and event_data
 */
export function parseVoiceInput(transcript: string): ParsedVoiceEvent {
  const lower = transcript.toLowerCase().trim();

  // Check for inspection results (most specific, check first)
  if (matchesAnyKeyword(lower, INSPECTION_PASSED_KEYWORDS)) {
    return {
      event_type: 'inspection.passed',
      event_data: {
        _version: 1,
        notes: transcript,
      },
      transcript,
      confidence: 'high',
    };
  }

  if (matchesAnyKeyword(lower, INSPECTION_FAILED_KEYWORDS)) {
    return {
      event_type: 'inspection.failed',
      event_data: {
        _version: 1,
        notes: transcript,
        reason: extractReason(transcript),
      },
      transcript,
      confidence: 'high',
    };
  }

  // Check for task completion
  if (matchesAnyKeyword(lower, TASK_COMPLETION_KEYWORDS)) {
    return {
      event_type: 'task.completed',
      event_data: {
        _version: 1,
        notes: transcript,
      },
      needsTaskSelector: true,
      transcript,
      confidence: 'high',
    };
  }

  // Check for blocked/waiting status
  if (matchesAnyKeyword(lower, TASK_BLOCKED_KEYWORDS)) {
    return {
      event_type: 'task.blocked',
      event_data: {
        _version: 1,
        reason: transcript,
      },
      needsTaskSelector: true,
      transcript,
      confidence: 'high',
    };
  }

  // Check for photo intent
  if (matchesAnyKeyword(lower, PHOTO_KEYWORDS)) {
    return {
      event_type: 'photo.uploaded',
      event_data: {
        _version: 1,
        caption: transcript.replace(/take a (photo|picture)|photo|picture/gi, '').trim() || undefined,
      },
      openCamera: true,
      transcript,
      confidence: 'medium',
    };
  }

  // Check for task progress
  if (matchesAnyKeyword(lower, PROGRESS_KEYWORDS)) {
    return {
      event_type: 'task.status_changed',
      event_data: {
        _version: 1,
        new_status: 'in-progress',
        notes: transcript,
      },
      needsTaskSelector: true,
      transcript,
      confidence: 'medium',
    };
  }

  // Check for time tracking
  if (lower.includes('clock in') || lower.includes('clocking in')) {
    return {
      event_type: 'time.clock_in',
      event_data: {
        _version: 1,
        notes: transcript,
      },
      transcript,
      confidence: 'high',
    };
  }

  if (lower.includes('clock out') || lower.includes('clocking out')) {
    return {
      event_type: 'time.clock_out',
      event_data: {
        _version: 1,
        notes: transcript,
      },
      transcript,
      confidence: 'high',
    };
  }

  // Default to field note for any other input
  return {
    event_type: 'field_note.created',
    event_data: {
      _version: 1,
      content: transcript,
    },
    transcript,
    confidence: 'low',
  };
}

/**
 * Check if text matches any of the keywords
 */
function matchesAnyKeyword(text: string, keywords: string[]): boolean {
  return keywords.some((keyword) => text.includes(keyword));
}

/**
 * Try to extract a reason from the transcript
 * E.g., "Blocked because waiting for materials" -> "waiting for materials"
 */
function extractReason(transcript: string): string {
  const lower = transcript.toLowerCase();

  // Try to find "because" or "due to"
  const becauseMatch = lower.match(/because\s+(.+)/i);
  if (becauseMatch) {
    return becauseMatch[1].trim();
  }

  const dueToMatch = lower.match(/due to\s+(.+)/i);
  if (dueToMatch) {
    return dueToMatch[1].trim();
  }

  // Return the whole transcript as the reason
  return transcript;
}

/**
 * Get a human-readable label for the event type
 */
export function getEventTypeLabel(eventType: string): string {
  const labels: Record<string, string> = {
    'task.completed': 'Task Completed',
    'task.blocked': 'Task Blocked',
    'task.status_changed': 'Task Status Changed',
    'photo.uploaded': 'Photo',
    'inspection.passed': 'Inspection Passed',
    'inspection.failed': 'Inspection Failed',
    'time.clock_in': 'Clock In',
    'time.clock_out': 'Clock Out',
    'field_note.created': 'Field Note',
  };

  return labels[eventType] || eventType.replace(/\./g, ' ').replace(/_/g, ' ');
}

/**
 * Get event type options for the confirmation card dropdown
 */
export function getEventTypeOptions(): Array<{ value: string; label: string }> {
  return [
    { value: 'task.completed', label: 'Task Completed' },
    { value: 'task.blocked', label: 'Task Blocked' },
    { value: 'task.status_changed', label: 'Task In Progress' },
    { value: 'photo.uploaded', label: 'Photo' },
    { value: 'inspection.passed', label: 'Inspection Passed' },
    { value: 'inspection.failed', label: 'Inspection Failed' },
    { value: 'time.clock_in', label: 'Clock In' },
    { value: 'time.clock_out', label: 'Clock Out' },
    { value: 'field_note.created', label: 'Field Note' },
  ];
}
