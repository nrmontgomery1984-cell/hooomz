'use client';

/**
 * Field Dashboard Page
 *
 * Dashboard of inspections and recent activity.
 * Large touch targets for field use.
 */

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Inspection, Photo } from '@hooomz/shared-contracts';
import { useFieldDocsService } from '@/lib/services/ServicesContext';
import { Button, Card, LoadingSpinner } from '@/components/ui';
import { InspectionCard } from '@/components/features/field';
import { useToast } from '@/components/ui/Toast';

export default function FieldDocsPage() {
  const router = useRouter();
  const fieldDocsService = useFieldDocsService();
  const { showToast } = useToast();
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [recentPhotos, setRecentPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load all inspections
      const inspResponse = await fieldDocsService.listAll();
      if (inspResponse.success && inspResponse.data) {
        setInspections(inspResponse.data);
      }

      // Load recent photos (last 8)
      const photosResponse = await fieldDocsService.listPhotos();
      if (photosResponse.success && photosResponse.data) {
        const recent = photosResponse.data
          .sort((a, b) => new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime())
          .slice(0, 8);
        setRecentPhotos(recent);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      showToast('Failed to load field data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const getUpcomingInspections = (): Inspection[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return inspections
      .filter((insp) => {
        if (!insp.scheduledDate || insp.status === 'completed') return false;
        return new Date(insp.scheduledDate) >= today;
      })
      .sort((a, b) => new Date(a.scheduledDate!).getTime() - new Date(b.scheduledDate!).getTime())
      .slice(0, 5);
  };

  const getPendingPhotos = (): number => {
    return recentPhotos.filter((photo) => photo.uploadStatus === 'pending').length;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <LoadingSpinner size="lg" text="Loading field dashboard..." />
      </div>
    );
  }

  const upcomingInspections = getUpcomingInspections();
  const pendingPhotos = getPendingPhotos();

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Field Dashboard</h1>
        <p className="text-gray-600">
          Inspections, photos, and checklists for job sites
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">
              {inspections.length}
            </div>
            <div className="text-sm text-gray-600 mt-1">Inspections</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-600">
              {upcomingInspections.length}
            </div>
            <div className="text-sm text-gray-600 mt-1">Upcoming</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              {inspections.filter((i) => i.status === 'completed').length}
            </div>
            <div className="text-sm text-gray-600 mt-1">Completed</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">
              {recentPhotos.length}
            </div>
            <div className="text-sm text-gray-600 mt-1">Photos</div>
          </div>
        </Card>
      </div>

      {/* Quick Actions - Large Touch Targets */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <Button
          variant="primary"
          className="h-20 text-lg"
          onClick={() => router.push('/projects')}
        >
          <svg className="h-8 w-8 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          View Projects
        </Button>
        <Button
          variant="secondary"
          className="h-20 text-lg"
          onClick={() => {
            // Navigate to first project with inspections, or projects list
            if (inspections.length > 0) {
              router.push(`/projects/${inspections[0].projectId}/inspections`);
            } else {
              router.push('/projects');
            }
          }}
        >
          <svg className="h-8 w-8 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Inspections
        </Button>
      </div>

      {/* Upcoming Inspections */}
      {upcomingInspections.length > 0 ? (
        <div className="space-y-4 mb-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              Upcoming Inspections
            </h2>
          </div>
          <div className="space-y-4">
            {upcomingInspections.map((inspection) => (
              <InspectionCard
                key={inspection.id}
                inspection={inspection}
                showProject={true}
              />
            ))}
          </div>
        </div>
      ) : (
        <Card className="mb-8">
          <div className="text-center py-8 text-gray-500">
            <svg className="h-16 w-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-lg mb-2">No upcoming inspections</p>
            <p className="text-sm text-gray-400">
              Schedule inspections from project pages
            </p>
          </div>
        </Card>
      )}

      {/* Recent Photos */}
      {recentPhotos.length > 0 ? (
        <div className="space-y-4 mb-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Recent Photos</h2>
            <Button
              variant="ghost"
              onClick={() => {
                // Navigate to first project with photos
                if (recentPhotos.length > 0) {
                  router.push(`/projects/${recentPhotos[0].projectId}/photos`);
                }
              }}
            >
              View All
            </Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {recentPhotos.map((photo) => (
              <Card key={photo.id} className="p-2">
                {photo.thumbnailUrl ? (
                  <img
                    src={photo.thumbnailUrl}
                    alt={photo.caption || 'Photo'}
                    className="w-full aspect-square object-cover rounded-lg mb-2"
                  />
                ) : (
                  <div className="w-full aspect-square bg-gray-200 rounded-lg mb-2 flex items-center justify-center">
                    <svg className="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                <div className="text-sm text-gray-900 font-medium truncate">
                  {photo.caption || 'Untitled'}
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(photo.capturedAt).toLocaleDateString()}
                </div>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <Card className="mb-8">
          <div className="text-center py-8 text-gray-500">
            <svg className="h-16 w-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-lg mb-2">No photos yet</p>
            <p className="text-sm text-gray-400">
              Capture photos from inspection pages
            </p>
          </div>
        </Card>
      )}

      {/* Offline Status Indicator */}
      {pendingPhotos > 0 ? (
        <Card className="bg-yellow-50 border-yellow-200">
          <div className="flex items-start gap-3">
            <svg className="h-6 w-6 text-yellow-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="font-semibold text-yellow-800 mb-1">
                {pendingPhotos} {pendingPhotos === 1 ? 'photo' : 'photos'} pending upload
              </p>
              <p className="text-sm text-yellow-700">
                Photos will upload automatically when you're back online
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="bg-green-50 border-green-200">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0" />
            <div>
              <p className="font-semibold text-green-800">All data synced</p>
              <p className="text-sm text-green-700">
                {inspections.length} {inspections.length === 1 ? 'inspection' : 'inspections'} and{' '}
                {recentPhotos.length} {recentPhotos.length === 1 ? 'photo' : 'photos'} ready for offline use
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
