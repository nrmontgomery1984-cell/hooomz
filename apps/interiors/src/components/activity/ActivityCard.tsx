/**
 * ActivityCard Component
 * Displays a single activity event with icon, description, actor, and timestamp
 * Per spec: Part 4.4 Activity Feed Component
 */

import type { ActivityEvent, EventType } from '../../types/database';

// ============================================================================
// ICON MAPPING
// ============================================================================

/**
 * Icon mapping for activity event types
 * From HOOOMZ_HOMESHOW_BUILD_PLAN.md Part 4.4
 */
const eventIcons: Record<EventType, string> = {
  // Status changes
  'loop.created': '+',
  'loop.status_changed': '~',
  'loop.completed': '\u2713',
  'loop.blocked': '\u26A0',
  'loop.unblocked': '\u2713',
  // Field actions
  'task.started': '\u25B6',
  'task.progress_logged': '\u2022',
  'task.completed': '\u2713',
  'task.blocked': '\u26A0',
  'task.note_added': '\u270E',
  'task.photo_added': '\uD83D\uDCF7',
  // Time tracking
  'time.clock_in': '\uD83D\uDD50',
  'time.clock_out': '\uD83D\uDD51',
  'time.entry_logged': '\u23F1',
  // Communication
  'comment.added': '\uD83D\uDCAC',
  'comment.reply': '\u21A9',
  'notification.sent': '\uD83D\uDD14',
  // Floor plan
  'floorplan.element_tapped': '\uD83D\uDC46',
  'floorplan.status_updated': '\uD83D\uDDFA',
  // Project lifecycle
  'project.imported': '\uD83D\uDCE5',
  'project.estimate_generated': '\uD83D\uDCCA',
  'project.scope_approved': '\u2705',
  'change_order.created': '\uD83D\uDCDD',
};

/**
 * Background colors for icon badges based on event category
 */
const getIconBgColor = (eventType: EventType): string => {
  if (eventType.includes('completed') || eventType.includes('approved')) {
    return 'bg-green-100 text-green-700';
  }
  if (eventType.includes('blocked')) {
    return 'bg-red-100 text-red-700';
  }
  if (eventType.includes('photo') || eventType.includes('comment')) {
    return 'bg-purple-100 text-purple-700';
  }
  if (eventType.includes('time') || eventType.includes('clock')) {
    return 'bg-amber-100 text-amber-700';
  }
  if (eventType.includes('imported') || eventType.includes('created')) {
    return 'bg-blue-100 text-blue-700';
  }
  return 'bg-gray-100 text-gray-700';
};

// ============================================================================
// DESCRIPTION GENERATION
// ============================================================================

/**
 * Generate human-readable description from event type and payload
 */
function getEventDescription(event: ActivityEvent): string {
  const payload = event.payload as Record<string, unknown>;

  switch (event.event_type) {
    case 'loop.created':
      return `Created "${payload.name || 'item'}"`;
    case 'loop.status_changed':
      return `Status changed to ${payload.new_status || 'unknown'}`;
    case 'loop.completed':
      return `Completed "${payload.name || 'item'}"`;
    case 'loop.blocked':
      return `Blocked: ${payload.reason || 'No reason given'}`;
    case 'loop.unblocked':
      return `Unblocked "${payload.name || 'item'}"`;

    case 'task.started':
      return `Started work on "${payload.name || 'task'}"`;
    case 'task.progress_logged':
      return `Logged progress: ${payload.progress || 'update'}`;
    case 'task.completed':
      return `Completed "${payload.name || 'task'}"`;
    case 'task.blocked':
      return `Task blocked: ${payload.reason || 'waiting'}`;
    case 'task.note_added':
      return payload.note ? `"${String(payload.note).slice(0, 50)}..."` : 'Added a note';
    case 'task.photo_added':
      return payload.caption ? `Photo: "${payload.caption}"` : 'Added a photo';

    case 'time.clock_in':
      return 'Clocked in';
    case 'time.clock_out':
      return `Clocked out${payload.hours ? ` (${payload.hours}h)` : ''}`;
    case 'time.entry_logged':
      return `Logged ${payload.hours || 0} hours`;

    case 'comment.added':
      return payload.content ? `"${String(payload.content).slice(0, 50)}..."` : 'Added a comment';
    case 'comment.reply':
      return 'Replied to comment';
    case 'notification.sent':
      return `Notification: ${payload.message || 'sent'}`;

    case 'floorplan.element_tapped':
      return `Viewed "${payload.element_name || 'element'}"`;
    case 'floorplan.status_updated':
      return `Updated "${payload.element_name || 'element'}" status`;

    case 'project.imported':
      return `Project imported from ${payload.source || 'file'}`;
    case 'project.estimate_generated':
      return 'Estimate generated';
    case 'project.scope_approved':
      return 'Scope approved by client';
    case 'change_order.created':
      return `Change order: ${payload.description || 'created'}`;

    default:
      // Handle any unknown event types gracefully
      return (event.event_type as string).replace(/[._]/g, ' ');
  }
}

// ============================================================================
// TIME FORMATTING
// ============================================================================

/**
 * Format timestamp for display
 */
function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  // Same year: show month and day with time
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  // Different year
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// ============================================================================
// COMPONENT
// ============================================================================

export interface ActivityCardProps {
  event: ActivityEvent;
  /** Show project name (for portfolio/company-wide view) */
  showProject?: boolean;
  /** Project name to display if showProject is true */
  projectName?: string;
  /** Actor name (from profile lookup) */
  actorName?: string;
  /** Whether there's an attached photo */
  hasPhoto?: boolean;
  /** Photo URL for preview */
  photoUrl?: string;
  /** Click handler */
  onClick?: () => void;
  /** Compact mode for embedding in other components */
  compact?: boolean;
}

export function ActivityCard({
  event,
  showProject = false,
  projectName,
  actorName,
  hasPhoto,
  photoUrl,
  onClick,
  compact = false,
}: ActivityCardProps) {
  const icon = eventIcons[event.event_type] || '\u2022';
  const iconBgColor = getIconBgColor(event.event_type);
  const description = getEventDescription(event);
  const time = formatTime(event.timestamp);

  // Determine actor display
  const actor = actorName || (event.actor_type === 'system' ? 'System' : 'Unknown');

  if (compact) {
    return (
      <div
        className="flex items-start gap-2 py-2"
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
      >
        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${iconBgColor}`}>
          {icon}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-900 truncate">{description}</p>
          <p className="text-xs text-gray-500">
            {actor} &bull; {time}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`
        bg-white rounded-lg border border-gray-200 p-4
        ${onClick ? 'cursor-pointer hover:border-gray-300 hover:shadow-sm transition-all' : ''}
      `}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="flex items-start gap-3">
        {/* Icon badge */}
        <span className={`w-10 h-10 rounded-full flex items-center justify-center text-base flex-shrink-0 ${iconBgColor}`}>
          {icon}
        </span>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Description */}
          <p className="text-gray-900 font-medium">{description}</p>

          {/* Meta line: actor, project (optional), timestamp */}
          <p className="text-sm text-gray-500 mt-0.5">
            {actor}
            {showProject && projectName && (
              <>
                <span className="mx-1">&bull;</span>
                <span className="text-blue-600">{projectName}</span>
              </>
            )}
            <span className="mx-1">&bull;</span>
            {time}
          </p>

          {/* Photo preview if attached */}
          {hasPhoto && photoUrl && (
            <div className="mt-2">
              <img
                src={photoUrl}
                alt="Attached photo"
                className="h-20 w-auto rounded-md object-cover"
              />
            </div>
          )}
          {hasPhoto && !photoUrl && (
            <p className="mt-1 text-xs text-gray-500 flex items-center gap-1">
              <span>📷</span> Photo attached
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default ActivityCard;
