'use client';

/**
 * Property Activity Page (Homeowner Portal)
 *
 * Shows activity history for a property - visible to homeowners.
 * This is THE place homeowners see what's happening with their project.
 *
 * Decision Filter Check:
 * - #8 Post-Project: Property history persists after project closes
 * - #10 Education: Helps homeowners understand what happened
 * - #11 Data Persistence: Activity log stays with the property forever
 *
 * Key differences from contractor Activity page:
 * - Only homeowner_visible events
 * - Simplified language (no internal jargon)
 * - Simplified filters (no Three-Axis)
 * - Photo thumbnails inline
 * - Celebration animations for milestones
 * - No voice input FAB
 */

import { useParams, useRouter } from 'next/navigation';
import { useState, useCallback } from 'react';
import {
  HomeownerActivityFeed,
  HomeownerFilterPills,
  type HomeownerFilterOption,
} from '@/components/activity';

export default function PropertyActivityPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params.id as string;

  const [activeFilter, setActiveFilter] = useState<HomeownerFilterOption>('all');

  // Handle photo clicks - could open a lightbox or navigate to photo detail
  const handlePhotoClick = useCallback((photoId: string) => {
    // For now, navigate to photo viewer
    // In future, could open inline lightbox
    router.push(`/properties/${propertyId}/photos/${photoId}`);
  }, [propertyId, router]);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-slate-100">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Back button */}
          <button
            onClick={() => router.back()}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center -ml-2 text-slate-600"
            aria-label="Go back"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-5 h-5"
            >
              <path
                fillRule="evenodd"
                d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          {/* Title */}
          <h1 className="text-lg font-semibold text-slate-800">
            Activity
          </h1>

          {/* Placeholder for balance */}
          <div className="w-[44px]" />
        </div>

        {/* Filter Pills */}
        <div className="px-4 pb-3">
          <HomeownerFilterPills
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
          />
        </div>
      </header>

      {/* Activity Feed */}
      <main className="pb-24">
        <HomeownerActivityFeed
          propertyId={propertyId}
          filter={activeFilter}
          enablePolling={true}
          onPhotoClick={handlePhotoClick}
          className="px-4"
        />
      </main>

      {/* Bottom safe area spacer for mobile */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </div>
  );
}
