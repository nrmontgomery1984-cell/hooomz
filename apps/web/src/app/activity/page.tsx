'use client';

/**
 * Activity Page — The Spine
 *
 * Clean list with status dots, grouped by date.
 * Per spec Section 5C: Inbox/notifications style.
 */

import { useLocalRecentActivity } from '@/lib/hooks/useLocalData';
import { SimpleActivityFeed } from '@/components/activity';

export default function ActivityPage() {
  const { data: activityData, isLoading } = useLocalRecentActivity(50);
  const recentEvents = activityData?.events || [];

  return (
    <div className="min-h-screen pb-24" style={{ background: '#F3F4F6' }}>
      {/* Header */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E5E7EB' }}>
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#111827' }}>Activity</h1>
            <p className="text-xs" style={{ color: '#9CA3AF' }}>Everything that&apos;s happened</p>
          </div>
        </div>
      </div>

      {/* Activity Feed — white card, no extra padding on rows */}
      <div className="max-w-lg mx-auto mt-4">
        <div className="rounded-2xl overflow-hidden mx-4" style={{ background: '#FFFFFF', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-3 rounded-full animate-spin mx-auto mb-3" style={{ borderColor: '#E5E7EB', borderTopColor: '#0F766E' }} />
              <p className="text-sm" style={{ color: '#9CA3AF' }}>Loading activity...</p>
            </div>
          ) : recentEvents.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm" style={{ color: '#9CA3AF' }}>No activity yet</p>
              <p className="text-xs mt-1" style={{ color: '#D1D5DB' }}>Create a project to see activity here</p>
            </div>
          ) : (
            <SimpleActivityFeed events={recentEvents} maxItems={50} showProjectName />
          )}
        </div>
      </div>
    </div>
  );
}
