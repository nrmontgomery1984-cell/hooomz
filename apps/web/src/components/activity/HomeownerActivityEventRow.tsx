'use client';

/**
 * HomeownerActivityEventRow
 *
 * A simplified activity event row for homeowner view.
 * Uses jargon-free language and simpler layout.
 *
 * Key differences from contractor view:
 * - Uses formatHomeownerMessage (no internal jargon)
 * - Photo thumbnails displayed inline
 * - Celebration animations for milestones
 * - No Three-Axis breadcrumbs (homeowners don't think in categories)
 *
 * Follows Hooomz UI spec:
 * - Light, warm aesthetic
 * - 44px minimum touch targets
 * - Progressive disclosure
 *
 * Decision Filter Check:
 * - #8 Post-Project Value: Events persist after project closes
 * - #10 Homeowner Education: Simplified, educational language
 * - #11 Data Persistence: Data stays with the home
 */

import { useState, useCallback } from 'react';
import {
  getEventIcon,
  formatHomeownerMessage,
  formatRelativeTime,
} from '@hooomz/shared';
import type { ActivityEvent } from '@/lib/api/hooks/useActivity';

interface HomeownerActivityEventRowProps {
  event: ActivityEvent;
  /** Callback when a photo is clicked */
  onPhotoClick?: (photoId: string) => void;
}

export function HomeownerActivityEventRow({
  event,
  onPhotoClick,
}: HomeownerActivityEventRowProps) {
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

  const icon = getEventIcon(event.event_type);
  const message = formatHomeownerMessage(event as any);
  const relativeTime = formatRelativeTime(event.timestamp);

  // Check for linked photos in event_data
  const linkedPhotos = event.event_data?.photos as string[] | undefined;
  const photoUrl = event.event_data?.photo_url as string | undefined;
  const thumbnailUrl = event.event_data?.thumbnail_url as string | undefined;
  const notes = event.event_data?.notes as string | undefined;
  const details = event.event_data?.details as string | undefined;

  // Determine if this is a milestone/celebration event
  const isCelebration = event.event_type === 'project.completed' ||
    event.event_type === 'milestone.reached';

  // Check if there's expandable content
  const hasExpandedContent = Boolean(
    linkedPhotos?.length ||
    photoUrl ||
    notes ||
    details
  );

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleToggle}
      onKeyDown={handleKeyDown}
      aria-expanded={isExpanded}
      className={`
        group cursor-pointer select-none
        transition-all duration-200 ease-out
        min-h-[56px] py-4 px-2
        ${isExpanded ? 'bg-slate-50/50 -mx-2 px-4 rounded-xl' : ''}
        ${isCelebration ? 'bg-green/5 rounded-xl' : ''}
      `}
    >
      {/* Main Row */}
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div
          className={`
            text-2xl flex-shrink-0 mt-0.5
            ${isCelebration ? 'animate-bounce' : ''}
          `}
          role="img"
          aria-label={event.event_type.replace(/\./g, ' ')}
        >
          {isCelebration ? '🎉' : icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Message */}
          <p className={`
            text-base leading-relaxed
            ${isCelebration ? 'text-green font-medium' : 'text-slate-700'}
          `}>
            {message}
          </p>

          {/* Time */}
          <time
            dateTime={event.timestamp}
            className="text-sm text-slate-400 mt-1 block"
          >
            {relativeTime}
          </time>
        </div>

        {/* Inline photo thumbnail (if available and not expanded) */}
        {!isExpanded && (photoUrl || thumbnailUrl) && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (linkedPhotos?.[0]) {
                onPhotoClick?.(linkedPhotos[0]);
              }
            }}
            className="
              flex-shrink-0
              w-14 h-14 rounded-lg overflow-hidden
              bg-slate-100
              hover:ring-2 hover:ring-teal/30 transition-all
            "
          >
            <img
              src={thumbnailUrl || photoUrl}
              alt="Photo"
              className="w-full h-full object-cover"
            />
          </button>
        )}

        {/* Expand indicator */}
        {hasExpandedContent && !photoUrl && !thumbnailUrl && (
          <span
            className={`
              text-slate-300 text-sm transition-transform duration-200
              ${isExpanded ? 'rotate-180' : ''}
            `}
          >
            ▼
          </span>
        )}
      </div>

      {/* Expanded Content */}
      {isExpanded && hasExpandedContent && (
        <div className="mt-4 ml-10 space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
          {/* Notes/Details */}
          {(details || notes) && (
            <p className="text-sm text-slate-600 leading-relaxed">
              {details || notes}
            </p>
          )}

          {/* Photo Gallery */}
          {(photoUrl || (linkedPhotos && linkedPhotos.length > 0)) && (
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2">
              {/* Main photo */}
              {photoUrl && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (linkedPhotos?.[0]) {
                      onPhotoClick?.(linkedPhotos[0]);
                    }
                  }}
                  className="
                    flex-shrink-0
                    w-32 h-32 rounded-xl overflow-hidden
                    bg-slate-100
                    hover:ring-2 hover:ring-teal/30 transition-all
                  "
                >
                  <img
                    src={thumbnailUrl || photoUrl}
                    alt="Photo"
                    className="w-full h-full object-cover"
                  />
                </button>
              )}

              {/* Additional linked photos */}
              {linkedPhotos?.map((photoId) => (
                <button
                  key={photoId}
                  onClick={(e) => {
                    e.stopPropagation();
                    onPhotoClick?.(photoId);
                  }}
                  className="
                    flex-shrink-0
                    w-20 h-20 rounded-lg overflow-hidden
                    bg-slate-100
                    hover:ring-2 hover:ring-teal/30 transition-all
                    flex items-center justify-center text-slate-400
                  "
                >
                  {/* Placeholder if no thumbnail */}
                  <span className="text-2xl">📷</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Skeleton loader for HomeownerActivityEventRow
 */
export function HomeownerActivityEventRowSkeleton() {
  return (
    <div className="flex items-start gap-4 py-4 px-2 animate-pulse">
      <div className="w-8 h-8 rounded-full bg-slate-200" />
      <div className="flex-1 space-y-2">
        <div className="h-5 bg-slate-200 rounded w-3/4" />
        <div className="h-4 bg-slate-100 rounded w-1/3" />
      </div>
    </div>
  );
}

export default HomeownerActivityEventRow;
