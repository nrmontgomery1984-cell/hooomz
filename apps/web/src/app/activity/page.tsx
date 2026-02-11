'use client';

/**
 * Activity Page — The Spine
 *
 * Clean list with status dots, grouped by date.
 * Per spec Section 5C: Inbox/notifications style.
 */

import { Activity } from 'lucide-react';
import { useLocalRecentActivity } from '@/lib/hooks/useLocalData';
import { SimpleActivityFeed } from '@/components/activity';

export default function ActivityPage() {
  const { data: activityData, isLoading } = useLocalRecentActivity(50);
  const recentEvents = activityData?.events || [];

  return (
    <div className="min-h-screen pb-24" style={{ background: '#F3F4F6' }}>
      {/* Header */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E5E7EB' }}>
        <div className="max-w-lg md:max-w-4xl mx-auto px-4 md:px-8 py-4 md:py-6">
          <h1 className="text-xl md:text-2xl font-bold" style={{ color: '#111827' }}>Activity</h1>
          <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>Everything that&apos;s happened</p>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="max-w-lg md:max-w-4xl mx-auto px-4 md:px-8 mt-6">
        <div className="rounded-xl overflow-hidden" style={{ background: '#FFFFFF', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="w-10 h-10 border-3 rounded-full animate-spin mx-auto mb-3" style={{ borderColor: '#E5E7EB', borderTopColor: '#0F766E' }} />
              <p className="text-sm" style={{ color: '#9CA3AF' }}>Loading activity...</p>
            </div>
          ) : recentEvents.length === 0 ? (
            <div className="text-center py-12">
              <Activity size={32} className="mx-auto mb-3" style={{ color: '#D1D5DB' }} />
              <p className="text-base font-medium mb-1" style={{ color: '#111827' }}>No activity yet</p>
              <p className="text-sm" style={{ color: '#9CA3AF' }}>Create a project to see activity here</p>
            </div>
          ) : (
            <SimpleActivityFeed events={recentEvents} maxItems={50} showProjectName />
          )}
        </div>
      </div>
    </div>
  );
}
