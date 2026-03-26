interface TodaySectionProps {
  /** Number of tasks due today */
  tasksDue: number;
  /** Number of blocked items */
  blockedCount: number;
  /** Key highlights for today */
  highlights: Array<{
    id: string;
    text: string;
    type: 'task' | 'blocked' | 'milestone' | 'info';
  }>;
  /** Loading state */
  loading?: boolean;
}

/**
 * TodaySection - Quick summary of today's priorities
 */
export function TodaySection({
  tasksDue,
  blockedCount,
  highlights,
  loading,
}: TodaySectionProps) {
  if (loading) {
    return (
      <div className="border-t border-gray-100 bg-white px-4 py-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Today</h2>
        <div className="space-y-2">
          <div className="h-5 bg-gray-100 rounded animate-pulse w-32" />
          <div className="h-5 bg-gray-100 rounded animate-pulse w-40" />
          <div className="h-5 bg-gray-100 rounded animate-pulse w-48" />
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-gray-100 bg-white px-4 py-4">
      <h2 className="text-lg font-semibold text-gray-900 mb-3">Today</h2>

      <ul className="space-y-2">
        {/* Tasks due summary */}
        {tasksDue > 0 && (
          <li className="flex items-center gap-2 text-gray-700">
            <span className="text-blue-500">•</span>
            <span>{tasksDue} task{tasksDue !== 1 ? 's' : ''} due</span>
          </li>
        )}

        {/* Blocked items warning */}
        {blockedCount > 0 && (
          <li className="flex items-center gap-2 text-gray-700">
            <span className="text-red-500">•</span>
            <span className="text-red-600 font-medium">
              {blockedCount} item{blockedCount !== 1 ? 's' : ''} blocked
            </span>
          </li>
        )}

        {/* Highlights */}
        {highlights.map((highlight) => (
          <li key={highlight.id} className="flex items-center gap-2 text-gray-700">
            <span
              className={
                highlight.type === 'blocked'
                  ? 'text-red-500'
                  : highlight.type === 'milestone'
                    ? 'text-green-500'
                    : 'text-gray-400'
              }
            >
              •
            </span>
            <span>{highlight.text}</span>
          </li>
        ))}

        {/* Empty state */}
        {tasksDue === 0 && blockedCount === 0 && highlights.length === 0 && (
          <li className="text-gray-400 italic">Nothing scheduled for today</li>
        )}
      </ul>
    </div>
  );
}

export default TodaySection;
