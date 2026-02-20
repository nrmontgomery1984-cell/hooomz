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

/** Map event types to status dot colors using CSS vars */
function getEventDotColor(eventType: string): string {
  if (eventType.includes('blocked') || eventType.includes('failed') || eventType.includes('shortage')) {
    return 'var(--red)';
  }
  if (eventType.includes('completed') || eventType.includes('passed') || eventType === 'milestone.reached') {
    return 'var(--green)';
  }
  if (eventType.includes('created') || eventType.includes('message') || eventType.includes('sent')) {
    return 'var(--blue)';
  }
  if (eventType.includes('started') || eventType.includes('scheduled') || eventType.includes('delay')) {
    return 'var(--amber)';
  }
  return 'var(--text-3)';
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
      style={{
        display: 'flex',
        flexDirection: 'column',
        padding: '7px 12px',
        cursor: 'pointer',
        userSelect: 'none',
        opacity: isPending ? 0.6 : 1,
        background: isExpanded ? 'var(--surface-2)' : 'transparent',
        transition: 'background 0.1s',
        minHeight: 36,
      }}
    >
      {/* Main row: dot + content + who + time */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        {/* Status dot */}
        <div
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: dotColor,
            flexShrink: 0,
            marginTop: 4,
          }}
        />

        {/* Message */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', lineHeight: 1.4 }}>
            {message}
          </span>

          {/* Who + project name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
            {event.actor_name && (
              <span style={{ fontSize: 10, color: 'var(--blue)', fontWeight: 500, fontFamily: 'var(--font-cond)', letterSpacing: '0.02em' }}>
                {event.actor_name}
              </span>
            )}
            {showProjectName && event.project_name && (
              <span style={{ fontSize: 10, color: 'var(--text-3)' }}>
                {event.project_name}
              </span>
            )}
          </div>
        </div>

        {/* Timestamp */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          {hasExpandedContent && (
            <span style={{ fontSize: 9, color: 'var(--text-3)', display: 'inline-block', transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}>
              ▸
            </span>
          )}
          <time dateTime={event.timestamp} style={{ fontSize: 10, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>
            {relativeTime}
          </time>
        </div>
      </div>

      {/* Expanded details */}
      {isExpanded && hasExpandedContent && (
        <div style={{ marginTop: 6, marginLeft: 15, paddingLeft: 8, borderLeft: '2px solid var(--border)' }}>
          {(details || notes) && (
            <p style={{ fontSize: 11, color: 'var(--text-2)', marginBottom: 2 }}>
              {details || notes}
            </p>
          )}
          {reason && (
            <p style={{ fontSize: 11, color: 'var(--red)', marginBottom: 2 }}>
              {reason}
            </p>
          )}
          {extraFields.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 10px' }}>
              {extraFields.map(([key, value]) => (
                <span key={key} style={{ fontSize: 10, color: 'var(--text-2)' }}>
                  <span style={{ color: 'var(--text-3)' }}>{key.replace(/_/g, ' ')}:</span>{' '}
                  {typeof value === 'number' && key.includes('amount')
                    ? `$${value.toLocaleString()}`
                    : String(value)}
                </span>
              ))}
            </div>
          )}
          {event.entity_type && event.entity_id && onEntityClick && (
            <button
              onClick={(e) => { e.stopPropagation(); onEntityClick(event.entity_type, event.entity_id); }}
              style={{ fontSize: 11, color: 'var(--blue)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', minHeight: 36 }}
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
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '7px 12px', animation: 'pulse 1.5s infinite' }}>
      <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--border)', flexShrink: 0, marginTop: 4 }} />
      <div style={{ flex: 1 }}>
        <div style={{ height: 12, borderRadius: 2, background: 'var(--border)', width: '70%', marginBottom: 4 }} />
        <div style={{ height: 10, borderRadius: 2, background: 'var(--surface-3)', width: '30%' }} />
      </div>
    </div>
  );
}
