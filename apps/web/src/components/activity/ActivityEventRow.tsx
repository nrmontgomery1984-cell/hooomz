'use client';

/**
 * ActivityEventRow
 *
 * Clean list row with status dot on left — per spec Section 5C.
 * Dot + bold title + timestamp (right-aligned).
 * Subtitle: project name in gray. Tap to expand for details.
 */

import { useState, useCallback } from 'react';
import {
  formatEventMessage,
  formatRelativeTime,
} from '@hooomz/shared';
import type { ActivityEvent } from '@/lib/api/hooks/useActivity';
import type { ThreeAxisFilterValues } from './ThreeAxisFilters';

/** Map event types to status dot colors per spec */
function getEventDotColor(eventType: string): string {
  // Red = problem/blocked
  if (eventType.includes('blocked') || eventType.includes('failed') || eventType.includes('shortage')) {
    return '#EF4444';
  }
  // Green = completion/success
  if (eventType.includes('completed') || eventType.includes('passed') || eventType === 'milestone.reached') {
    return '#10B981';
  }
  // Blue = new/message/info
  if (eventType.includes('created') || eventType.includes('message') || eventType.includes('sent')) {
    return '#3B82F6';
  }
  // Amber = in-progress/attention
  if (eventType.includes('started') || eventType.includes('scheduled') || eventType.includes('delay')) {
    return '#F59E0B';
  }
  // Gray = everything else
  return '#9CA3AF';
}

interface ActivityEventRowProps {
  event: ActivityEvent;
  showProjectName?: boolean;
  onPhotoClick?: (photoId: string) => void;
  onEntityClick?: (entityType: string, entityId: string) => void;
  onBreadcrumbFilter?: (axis: keyof ThreeAxisFilterValues, code: string) => void;
}

export function ActivityEventRow({
  event,
  showProjectName = false,
  onEntityClick,
}: ActivityEventRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggle = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleToggle();
      }
    },
    [handleToggle]
  );

  const dotColor = getEventDotColor(event.event_type);
  const message = formatEventMessage(event as any);
  const relativeTime = formatRelativeTime(event.timestamp);

  const syncStatus = event._syncStatus;
  const isPending = syncStatus === 'pending' || syncStatus === 'syncing';

  const details = event.event_data?.details as string | undefined;
  const notes = event.event_data?.notes as string | undefined;
  const reason = event.event_data?.reason as string | undefined;

  // Build extra fields from event_data (excluding already-displayed ones)
  const HIDDEN_KEYS = new Set(['details', 'notes', 'reason', 'project_name']);
  const extraFields = event.event_data
    ? Object.entries(event.event_data).filter(
        ([k, v]) => !HIDDEN_KEYS.has(k) && v !== undefined && v !== null && v !== ''
      )
    : [];

  // Always expandable — show event_data fields even without details/notes
  const hasExpandedContent = Boolean(
    details || reason || notes || extraFields.length > 0 || (event.entity_type && event.entity_id)
  );

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleToggle}
      onKeyDown={handleKeyDown}
      aria-expanded={isExpanded}
      className="cursor-pointer select-none min-h-[48px] py-3 px-4 transition-colors"
      style={{
        opacity: isPending ? 0.6 : 1,
        background: isExpanded ? '#F9FAFB' : 'transparent',
      }}
    >
      {/* Main row: dot + message + timestamp */}
      <div className="flex items-start gap-3">
        {/* Status dot — 8-10px per spec */}
        <div
          className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5"
          style={{ background: dotColor }}
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium leading-snug" style={{ color: '#111827' }}>
              {message}
            </p>
            <span className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
              {hasExpandedContent && (
                <span
                  className="text-[10px] transition-transform"
                  style={{ color: '#9CA3AF', display: 'inline-block', transform: isExpanded ? 'rotate(90deg)' : 'none' }}
                >
                  ▸
                </span>
              )}
              <time
                dateTime={event.timestamp}
                className="text-xs whitespace-nowrap"
                style={{ color: '#9CA3AF' }}
              >
                {relativeTime}
              </time>
            </span>
          </div>

          {/* Project name subtitle */}
          {showProjectName && event.project_name && (
            <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>
              {event.project_name}
            </p>
          )}
        </div>
      </div>

      {/* Expanded details */}
      {isExpanded && hasExpandedContent && (
        <div className="mt-2 ml-5 pl-3 space-y-1.5" style={{ borderLeft: '2px solid #E5E7EB' }}>
          {(details || notes) && (
            <p className="text-xs" style={{ color: '#6B7280' }}>
              {details || notes}
            </p>
          )}
          {reason && (
            <p className="text-xs" style={{ color: '#EF4444' }}>
              {reason}
            </p>
          )}
          {/* Show event_data fields as key-value pairs */}
          {extraFields.length > 0 && (
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              {extraFields.map(([key, value]) => (
                <span key={key} className="text-[11px]" style={{ color: '#6B7280' }}>
                  <span className="font-medium" style={{ color: '#9CA3AF' }}>
                    {key.replace(/_/g, ' ')}:
                  </span>{' '}
                  {typeof value === 'number' && key.includes('amount')
                    ? `$${value.toLocaleString()}`
                    : String(value)}
                </span>
              ))}
            </div>
          )}
          {event.entity_type && event.entity_id && onEntityClick && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEntityClick(event.entity_type, event.entity_id);
              }}
              className="text-xs font-medium min-h-[36px] px-3 rounded-lg"
              style={{ color: '#0F766E' }}
            >
              View {event.entity_type.replace(/_/g, ' ')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Skeleton loader for ActivityEventRow
 */
export function ActivityEventRowSkeleton() {
  return (
    <div className="flex items-start gap-3 py-3 px-4 animate-pulse">
      <div className="w-2.5 h-2.5 rounded-full mt-1.5" style={{ background: '#E5E7EB' }} />
      <div className="flex-1 space-y-2">
        <div className="h-4 rounded w-3/4" style={{ background: '#E5E7EB' }} />
        <div className="h-3 rounded w-1/3" style={{ background: '#F3F4F6' }} />
      </div>
    </div>
  );
}
