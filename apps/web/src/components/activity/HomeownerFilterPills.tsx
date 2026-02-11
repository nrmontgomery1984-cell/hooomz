'use client';

/**
 * HomeownerFilterPills
 *
 * Simplified filter pills for homeowner activity view.
 * Uses simpler categories that match how homeowners think:
 * - All
 * - Progress (task completions, milestones)
 * - Photos (shared photos)
 * - Payments (invoices, payments)
 *
 * Follows Hooomz UI spec:
 * - 44px minimum touch targets
 * - Light, warm aesthetic
 * - Horizontal scroll on mobile
 *
 * Decision Filter Check:
 * - #10 Homeowner Education: Uses language homeowners understand
 */

import type { ActivityEvent } from '@/lib/api/hooks/useActivity';

/**
 * Homeowner filter options (simplified from contractor view)
 */
export type HomeownerFilterOption = 'all' | 'progress' | 'photos' | 'payments';

interface HomeownerFilterPillsProps {
  /** Currently active filter */
  activeFilter: HomeownerFilterOption;
  /** Callback when filter changes */
  onFilterChange: (filter: HomeownerFilterOption) => void;
  /** Optional class name */
  className?: string;
}

/**
 * Filter pills configuration
 */
const FILTER_CONFIG: Array<{
  value: HomeownerFilterOption;
  label: string;
  icon: string;
}> = [
  { value: 'all', label: 'All', icon: '📋' },
  { value: 'progress', label: 'Progress', icon: '✓' },
  { value: 'photos', label: 'Photos', icon: '📷' },
  { value: 'payments', label: 'Payments', icon: '💳' },
];

/**
 * Event types that map to each homeowner filter category
 */
const FILTER_EVENT_TYPES: Record<HomeownerFilterOption, string[]> = {
  all: [], // Empty means show all
  progress: [
    'task.completed',
    'task.blocked_shared',
    'milestone.reached',
    'inspection.passed',
    'inspection.failed',
    'inspection.scheduled',
    'project.status_changed',
    'project.completed',
  ],
  photos: [
    'photo.shared',
  ],
  payments: [
    'estimate.sent',
    'estimate.approved',
    'estimate.rejected',
    'change_order.sent',
    'change_order.approved',
    'change_order.rejected',
    'invoice.sent',
    'payment.received',
  ],
};

export function HomeownerFilterPills({
  activeFilter,
  onFilterChange,
  className = '',
}: HomeownerFilterPillsProps) {
  return (
    <div
      role="tablist"
      aria-label="Filter activity"
      className={`
        flex gap-2 overflow-x-auto pb-2 -mx-4 px-4
        scrollbar-hide
        ${className}
      `}
    >
      {FILTER_CONFIG.map((filter) => (
        <button
          key={filter.value}
          role="tab"
          aria-selected={activeFilter === filter.value}
          onClick={() => onFilterChange(filter.value)}
          className={`
            flex items-center gap-1.5
            px-4 py-2.5 min-h-[44px]
            text-sm font-medium whitespace-nowrap
            rounded-full
            transition-all duration-200
            ${
              activeFilter === filter.value
                ? 'bg-teal text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }
          `}
        >
          <span className="text-base">{filter.icon}</span>
          <span>{filter.label}</span>
        </button>
      ))}
    </div>
  );
}

/**
 * Filter events by homeowner category
 *
 * @param events - Array of activity events
 * @param filter - The filter to apply
 * @returns Filtered events
 */
export function filterHomeownerEvents(
  events: ActivityEvent[],
  filter: HomeownerFilterOption
): ActivityEvent[] {
  // "all" shows everything
  if (filter === 'all') {
    return events;
  }

  const allowedTypes = FILTER_EVENT_TYPES[filter];
  if (!allowedTypes || allowedTypes.length === 0) {
    return events;
  }

  return events.filter((event) => allowedTypes.includes(event.event_type));
}

export default HomeownerFilterPills;
