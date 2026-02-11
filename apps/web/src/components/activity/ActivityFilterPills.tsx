'use client';

/**
 * ActivityFilterPills
 *
 * Horizontal scrolling filter pills for the activity feed.
 * Follows Hooomz UI spec:
 * - 44px minimum touch targets (work gloves)
 * - Teal active state, white inactive
 * - Light, warm aesthetic
 */

import { useRef, useEffect } from 'react';

export type FilterOption = 'all' | 'tasks' | 'photos' | 'estimates' | 'payments' | 'time';

interface FilterConfig {
  value: FilterOption;
  label: string;
  icon: string;
}

const FILTERS: FilterConfig[] = [
  { value: 'all', label: 'All', icon: '📋' },
  { value: 'tasks', label: 'Tasks', icon: '☑️' },
  { value: 'photos', label: 'Photos', icon: '📷' },
  { value: 'estimates', label: 'Estimates', icon: '📤' },
  { value: 'payments', label: 'Payments', icon: '💰' },
  { value: 'time', label: 'Time', icon: '⏱️' },
];

interface ActivityFilterPillsProps {
  activeFilter: FilterOption;
  onFilterChange: (filter: FilterOption) => void;
  className?: string;
}

export function ActivityFilterPills({
  activeFilter,
  onFilterChange,
  className = '',
}: ActivityFilterPillsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  // Scroll active filter into view when it changes
  useEffect(() => {
    if (activeRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const active = activeRef.current;
      const containerRect = container.getBoundingClientRect();
      const activeRect = active.getBoundingClientRect();

      // Check if active is outside visible area
      if (activeRect.left < containerRect.left || activeRect.right > containerRect.right) {
        active.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [activeFilter]);

  return (
    <div
      ref={scrollRef}
      className={`flex gap-2 overflow-x-auto scrollbar-hide pb-1 ${className}`}
      role="tablist"
      aria-label="Filter activity by type"
    >
      {FILTERS.map((filter) => {
        const isActive = activeFilter === filter.value;

        return (
          <button
            key={filter.value}
            ref={isActive ? activeRef : null}
            onClick={() => onFilterChange(filter.value)}
            role="tab"
            aria-selected={isActive}
            aria-controls="activity-feed"
            className={`
              flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium
              whitespace-nowrap transition-all duration-200 ease-out
              min-h-[44px] min-w-[44px]
              ${
                isActive
                  ? 'bg-teal text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-teal/30'
              }
            `}
          >
            <span className="text-base" role="img" aria-hidden>
              {filter.icon}
            </span>
            <span>{filter.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * Filter events by category
 */
export function filterEventsByCategory(
  events: Array<{ event_type: string }>,
  filter: FilterOption
): Array<{ event_type: string }> {
  if (filter === 'all') return events;

  const prefixMap: Record<FilterOption, string[]> = {
    all: [],
    tasks: ['task.'],
    photos: ['photo.'],
    estimates: ['estimate.', 'tier.'],
    payments: ['payment.', 'invoice.'],
    time: ['time.'],
  };

  const prefixes = prefixMap[filter];
  return events.filter((event) =>
    prefixes.some((prefix) => event.event_type.startsWith(prefix))
  );
}
