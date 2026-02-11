'use client';

/**
 * SyncStatusIndicator
 *
 * Shows sync status badge for pending activity events.
 * Subtle indicator - doesn't alarm the user.
 *
 * Follows Hooomz UI spec:
 * - 44px minimum touch targets
 * - Light, warm aesthetic
 * - Not alarming (subtle indicator)
 *
 * Decision Filter Check:
 * - #6 Mobile/Field: One-hand operation, clear status
 */

import { useSyncStatus } from '@/lib/offline';

interface SyncStatusIndicatorProps {
  /** Show expanded view with details */
  expanded?: boolean;
  /** Optional class name */
  className?: string;
  /** Click handler to show pending items */
  onPress?: () => void;
}

export function SyncStatusIndicator({
  expanded = false,
  className = '',
  onPress,
}: SyncStatusIndicatorProps) {
  const { pendingCount, failedCount, isSyncing, isOnline } = useSyncStatus();

  // Don't show anything if everything is synced and online
  if (isOnline && pendingCount === 0 && failedCount === 0 && !isSyncing) {
    return null;
  }

  // Determine status color
  const getStatusColor = () => {
    if (!isOnline) return 'bg-slate-400'; // Offline - gray
    if (failedCount > 0) return 'bg-coral'; // Failed - coral
    if (isSyncing) return 'bg-amber'; // Syncing - amber
    if (pendingCount > 0) return 'bg-amber'; // Pending - amber
    return 'bg-teal'; // All good - teal
  };

  // Compact badge view (just a dot with count)
  if (!expanded) {
    return (
      <button
        onClick={onPress}
        disabled={!onPress}
        className={`
          relative inline-flex items-center justify-center
          min-w-[44px] min-h-[44px]
          ${onPress ? 'cursor-pointer' : 'cursor-default'}
          ${className}
        `}
        aria-label={
          !isOnline
            ? 'Offline'
            : isSyncing
              ? 'Syncing...'
              : `${pendingCount} items pending sync`
        }
      >
        {/* Status dot */}
        <span
          className={`
            w-3 h-3 rounded-full
            ${getStatusColor()}
            ${isSyncing ? 'animate-pulse' : ''}
          `}
        />

        {/* Count badge */}
        {pendingCount > 0 && (
          <span
            className="
              absolute -top-1 -right-1
              min-w-[18px] h-[18px]
              flex items-center justify-center
              bg-slate-700 text-white
              text-[10px] font-medium
              rounded-full px-1
            "
          >
            {pendingCount > 99 ? '99+' : pendingCount}
          </span>
        )}
      </button>
    );
  }

  // Expanded view with details
  return (
    <button
      onClick={onPress}
      disabled={!onPress}
      className={`
        flex items-center gap-2 px-3 py-2
        bg-white rounded-lg shadow-sm
        ${onPress ? 'cursor-pointer hover:bg-slate-50' : 'cursor-default'}
        transition-colors duration-200
        ${className}
      `}
    >
      {/* Status indicator */}
      <span
        className={`
          w-2.5 h-2.5 rounded-full
          ${getStatusColor()}
          ${isSyncing ? 'animate-pulse' : ''}
        `}
      />

      {/* Status text */}
      <span className="text-sm text-slate-600">
        {!isOnline ? (
          'Offline'
        ) : isSyncing ? (
          'Syncing...'
        ) : failedCount > 0 ? (
          <span className="text-coral">
            {failedCount} failed
          </span>
        ) : pendingCount > 0 ? (
          `${pendingCount} pending`
        ) : (
          'Synced'
        )}
      </span>

      {/* Cloud icon with status */}
      <CloudIcon isOnline={isOnline} isSyncing={isSyncing} />
    </button>
  );
}

/**
 * Cloud icon component with sync status
 */
function CloudIcon({
  isOnline,
  isSyncing,
}: {
  isOnline: boolean;
  isSyncing: boolean;
}) {
  if (!isOnline) {
    // Offline cloud with slash
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="w-4 h-4 text-slate-400"
      >
        <path d="M2.22 2.22a.75.75 0 011.06 0l14.5 14.5a.75.75 0 11-1.06 1.06L2.22 3.28a.75.75 0 010-1.06z" />
        <path d="M4.73 7.85A5 5 0 0112.97 6a4 4 0 012.24 7.28l-1.06-1.06a2.5 2.5 0 00-1.22-4.62 5.002 5.002 0 00-6.36-1.61L4.73 7.85zM7.06 10.94L5.68 9.56A3.5 3.5 0 004 12.5C4 14.43 5.57 16 7.5 16h5.379l-1.5-1.5H7.5a2 2 0 01-2-2c0-.88.57-1.63 1.36-1.9l.2-.16z" />
      </svg>
    );
  }

  if (isSyncing) {
    // Syncing cloud with arrows
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="w-4 h-4 text-amber animate-spin"
      >
        <path
          fillRule="evenodd"
          d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm-11.23-3.424a.75.75 0 00.75-.75V4.82l.31.31a7 7 0 0011.712 3.138.75.75 0 00-1.449.39 5.5 5.5 0 01-9.201-2.466l-.312.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 00.75.75z"
          clipRule="evenodd"
        />
      </svg>
    );
  }

  // Online cloud
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="w-4 h-4 text-teal"
    >
      <path d="M5.5 16a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.25 4.25 0 1113.25 16H5.5z" />
    </svg>
  );
}

export default SyncStatusIndicator;
