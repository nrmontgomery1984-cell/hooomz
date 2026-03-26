import type { EventType } from '../../types/database';

interface ActivityItem {
  id: string;
  eventType: EventType;
  description: string;
  actorName: string;
  projectName: string;
  timestamp: string;
  hasPhoto?: boolean;
}

interface ActivityPreviewProps {
  /** Recent activity items (2-3 max) */
  activities: ActivityItem[];
  /** Loading state */
  loading?: boolean;
  /** View all handler */
  onViewAll?: () => void;
}

/**
 * Event type to icon mapping
 */
function getEventIcon(eventType: EventType): string {
  const icons: Partial<Record<EventType, string>> = {
    'task.completed': '✓',
    'loop.completed': '✓',
    'task.blocked': '⚠',
    'loop.blocked': '⚠',
    'task.photo_added': '📷',
    'comment.added': '💬',
    'time.clock_in': '🕐',
    'time.clock_out': '🕐',
    'project.imported': '📥',
  };
  return icons[eventType] || '•';
}

/**
 * Get icon color class based on event type
 */
function getEventColorClass(eventType: EventType): string {
  if (eventType.includes('completed')) return 'text-green-500 bg-green-50';
  if (eventType.includes('blocked')) return 'text-red-500 bg-red-50';
  if (eventType.includes('photo')) return 'text-blue-500 bg-blue-50';
  if (eventType.includes('comment')) return 'text-purple-500 bg-purple-50';
  return 'text-gray-500 bg-gray-50';
}

/**
 * Format timestamp to relative or time
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

  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

/**
 * ActivityPreview - Recent activity cards for dashboard
 */
export function ActivityPreview({ activities, loading, onViewAll }: ActivityPreviewProps) {
  if (loading) {
    return (
      <div className="px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
        </div>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="bg-gray-50 rounded-lg p-3 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="px-4 py-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Recent Activity</h2>
        <p className="text-gray-400 text-center py-4 italic">No recent activity</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View all
          </button>
        )}
      </div>

      <div className="space-y-3">
        {activities.slice(0, 3).map((activity) => (
          <div
            key={activity.id}
            className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-start gap-3">
              {/* Icon */}
              <span
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm ${getEventColorClass(activity.eventType)}`}
              >
                {getEventIcon(activity.eventType)}
              </span>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 font-medium truncate">
                  {activity.description}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {activity.actorName} • {activity.projectName} • {formatTime(activity.timestamp)}
                </p>
                {activity.hasPhoto && (
                  <span className="inline-block mt-1 text-xs text-gray-400">
                    [Photo attached]
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ActivityPreview;
