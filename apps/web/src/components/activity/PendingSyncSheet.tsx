'use client';

/**
 * PendingSyncSheet
 *
 * Bottom sheet showing pending sync items.
 * Allows manual retry of failed items.
 *
 * Follows Hooomz UI spec:
 * - 44px minimum touch targets
 * - Light, warm aesthetic
 * - Progressive disclosure
 *
 * Decision Filter Check:
 * - #6 Mobile/Field: Easy to use with gloves
 */

import { useEffect, useState } from 'react';
import { useSyncStatus } from '@/lib/offline';
import { ActivitySyncService } from '@/lib/offline';
import type { SyncQueueItem } from '@/lib/repositories/SyncQueue';
import { initializeStorage } from '@/lib/storage';

interface PendingSyncSheetProps {
  /** Whether the sheet is visible */
  isVisible: boolean;
  /** Close handler */
  onClose: () => void;
}

export function PendingSyncSheet({ isVisible, onClose }: PendingSyncSheetProps) {
  const { pendingCount, failedCount, isSyncing, isOnline, triggerSync, retryFailed } =
    useSyncStatus();
  const [pendingEvents, setPendingEvents] = useState<SyncQueueItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load pending events
  useEffect(() => {
    if (!isVisible) return;

    async function loadEvents() {
      setIsLoading(true);
      try {
        const storage = await initializeStorage();
        const syncService = ActivitySyncService.getInstance(storage);
        const events = await syncService.getPendingEvents();
        setPendingEvents(events);
      } catch (error) {
        console.error('Failed to load pending events:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadEvents();
  }, [isVisible, pendingCount, failedCount]);

  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom duration-300">
        <div className="bg-white rounded-t-2xl shadow-xl max-h-[70vh] flex flex-col">
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 rounded-full bg-slate-300" />
          </div>

          {/* Header */}
          <div className="px-4 pb-3 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">
                  Pending Sync
                </h2>
                <p className="text-sm text-slate-500">
                  {!isOnline ? (
                    'Offline - will sync when connected'
                  ) : pendingCount === 0 && failedCount === 0 ? (
                    'All synced'
                  ) : (
                    `${pendingCount} pending, ${failedCount} failed`
                  )}
                </p>
              </div>

              {/* Close button */}
              <button
                onClick={onClose}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
                aria-label="Close"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-5 h-5"
                >
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-4 py-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal" />
              </div>
            ) : pendingEvents.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">✓</div>
                <p className="text-slate-500">All events synced</p>
              </div>
            ) : (
              <div className="space-y-2">
                {pendingEvents.map((event) => (
                  <PendingEventRow key={event.id} event={event} />
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="px-4 py-4 border-t border-slate-100 space-y-2">
            {/* Sync now button */}
            {isOnline && pendingCount > 0 && (
              <button
                onClick={triggerSync}
                disabled={isSyncing}
                className="
                  w-full min-h-[48px] px-4
                  bg-teal text-white font-medium
                  rounded-xl
                  hover:bg-teal/90 active:scale-[0.98]
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all duration-200
                  flex items-center justify-center gap-2
                "
              >
                {isSyncing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        fillRule="evenodd"
                        d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm-11.23-3.424a.75.75 0 00.75-.75V4.82l.31.31a7 7 0 0011.712 3.138.75.75 0 00-1.449.39 5.5 5.5 0 01-9.201-2.466l-.312.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 00.75.75z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Sync Now
                  </>
                )}
              </button>
            )}

            {/* Retry failed button */}
            {isOnline && failedCount > 0 && (
              <button
                onClick={retryFailed}
                disabled={isSyncing}
                className="
                  w-full min-h-[48px] px-4
                  bg-coral text-white font-medium
                  rounded-xl
                  hover:bg-coral/90 active:scale-[0.98]
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all duration-200
                  flex items-center justify-center gap-2
                "
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.793 2.232a.75.75 0 01-.025 1.06L3.622 7.25h10.003a5.375 5.375 0 010 10.75H10.75a.75.75 0 010-1.5h2.875a3.875 3.875 0 000-7.75H3.622l4.146 3.957a.75.75 0 01-1.036 1.085l-5.5-5.25a.75.75 0 010-1.085l5.5-5.25a.75.75 0 011.06.025z"
                    clipRule="evenodd"
                  />
                </svg>
                Retry Failed ({failedCount})
              </button>
            )}

            {/* Offline notice */}
            {!isOnline && (
              <div className="flex items-center justify-center gap-2 py-2 text-slate-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-5 h-5"
                >
                  <path d="M2.22 2.22a.75.75 0 011.06 0l14.5 14.5a.75.75 0 11-1.06 1.06L2.22 3.28a.75.75 0 010-1.06z" />
                  <path d="M4.73 7.85A5 5 0 0112.97 6a4 4 0 012.24 7.28l-1.06-1.06a2.5 2.5 0 00-1.22-4.62 5.002 5.002 0 00-6.36-1.61L4.73 7.85zM7.06 10.94L5.68 9.56A3.5 3.5 0 004 12.5C4 14.43 5.57 16 7.5 16h5.379l-1.5-1.5H7.5a2 2 0 01-2-2c0-.88.57-1.63 1.36-1.9l.2-.16z" />
                </svg>
                <span className="text-sm">Will sync when online</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * Row showing a pending event
 */
function PendingEventRow({ event }: { event: SyncQueueItem }) {
  const isFailed = event.retryCount >= 3;
  const hasError = Boolean(event.error);

  // Extract event type for display
  const eventType = event.data?.event_type || 'Unknown event';
  const eventLabel = eventType
    .split('.')
    .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

  // Format timestamp
  const timeAgo = formatTimeAgo(new Date(event.timestamp));

  return (
    <div
      className={`
        p-3 rounded-lg
        ${isFailed ? 'bg-coral/10' : hasError ? 'bg-amber/10' : 'bg-slate-50'}
      `}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-800 truncate">
            {eventLabel}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">{timeAgo}</p>
          {event.error && (
            <p className="text-xs text-coral mt-1 truncate">{event.error}</p>
          )}
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-1 ml-2">
          {isFailed ? (
            <span className="text-xs text-coral font-medium">Failed</span>
          ) : hasError ? (
            <span className="text-xs text-amber font-medium">
              Retry {event.retryCount}/3
            </span>
          ) : (
            <span className="text-xs text-slate-400">Pending</span>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Format relative time
 */
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

export default PendingSyncSheet;
