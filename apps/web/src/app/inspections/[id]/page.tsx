'use client';

/**
 * Inspection Detail Page
 *
 * View and conduct inspection with checklist.
 * Large touch targets for field use.
 */

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import type { Inspection, ChecklistItem, Photo } from '@hooomz/shared-contracts';
import { useFieldDocsService } from '@/lib/services/ServicesContext';
import { Button, Card, LoadingSpinner, Badge, Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui';
import { ChecklistView, PhotoGallery, PhotoUpload, PhotoViewer } from '@/components/features/field';
import { useToast } from '@/components/ui/Toast';

export default function InspectionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const inspectionId = params.id as string;
  const fieldDocsService = useFieldDocsService();
  const { showToast } = useToast();
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('checklist');
  const [viewerPhoto, setViewerPhoto] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, [inspectionId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load inspection
      const inspResponse = await fieldDocsService.getById(inspectionId);
      if (inspResponse.success && inspResponse.data) {
        setInspection(inspResponse.data);

        // Load photos for this inspection
        const photosResponse = await fieldDocsService.listPhotosByInspection(inspectionId);
        if (photosResponse.success && photosResponse.data) {
          setPhotos(photosResponse.data);
        }
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      showToast('Failed to load inspection', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleItemCheck = async (itemId: string, checked: boolean) => {
    if (!inspection) return;

    const updatedItems = inspection.checklistItems?.map((item) =>
      item.id === itemId ? { ...item, checked } : item
    );

    try {
      const response = await fieldDocsService.update(inspectionId, {
        checklistItems: updatedItems,
      });
      if (response.success && response.data) {
        setInspection(response.data);
      }
    } catch (error) {
      console.error('Failed to update checklist:', error);
      showToast('Failed to update checklist', 'error');
    }
  };

  const handleAddNote = async (itemId: string, note: string) => {
    if (!inspection) return;

    const updatedItems = inspection.checklistItems?.map((item) =>
      item.id === itemId ? { ...item, notes: note } : item
    );

    try {
      const response = await fieldDocsService.update(inspectionId, {
        checklistItems: updatedItems,
      });
      if (response.success && response.data) {
        setInspection(response.data);
        showToast('Note saved', 'success');
      }
    } catch (error) {
      console.error('Failed to save note:', error);
      showToast('Failed to save note', 'error');
    }
  };

  const handleAddPhoto = async (files: FileList, itemId?: string) => {
    const newPhotos: Partial<Photo>[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      const photoData: Partial<Photo> = {
        projectId: inspection!.projectId,
        inspectionId,
        checklistItemId: itemId,
        url: URL.createObjectURL(file),
        thumbnailUrl: URL.createObjectURL(file),
        caption: file.name,
        capturedAt: new Date().toISOString(),
        uploadStatus: 'pending',
      };

      newPhotos.push(photoData);
    }

    try {
      for (const photoData of newPhotos) {
        const response = await fieldDocsService.createPhoto(photoData);
        if (!response.success) {
          throw new Error('Failed to create photo');
        }
      }

      showToast(`${newPhotos.length} photo(s) added`, 'success');
      await loadData();
    } catch (error) {
      console.error('Failed to add photos:', error);
      showToast('Failed to add photos', 'error');
    }
  };

  const handleCompleteInspection = async () => {
    if (!inspection) return;

    const requiredItems = inspection.checklistItems?.filter((item) => item.required) || [];
    const completedRequired = requiredItems.filter((item) => item.checked).length;

    if (completedRequired < requiredItems.length) {
      showToast(`${requiredItems.length - completedRequired} required item(s) not completed`, 'error');
      return;
    }

    try {
      const response = await fieldDocsService.update(inspectionId, {
        status: 'completed',
        completedDate: new Date().toISOString(),
      });
      if (response.success && response.data) {
        setInspection(response.data);
        showToast('Inspection marked as completed', 'success');
      }
    } catch (error) {
      console.error('Failed to complete inspection:', error);
      showToast('Failed to complete inspection', 'error');
    }
  };

  const handleMarkFailed = async () => {
    if (!inspection) return;

    try {
      const response = await fieldDocsService.update(inspectionId, {
        status: 'failed',
        completedDate: new Date().toISOString(),
      });
      if (response.success && response.data) {
        setInspection(response.data);
        showToast('Inspection marked as failed', 'success');
      }
    } catch (error) {
      console.error('Failed to mark as failed:', error);
      showToast('Failed to update inspection', 'error');
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    try {
      const response = await fieldDocsService.deletePhoto(photoId);
      if (response.success) {
        showToast('Photo deleted', 'success');
        await loadData();
      }
    } catch (error) {
      console.error('Failed to delete photo:', error);
      showToast('Failed to delete photo', 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <LoadingSpinner size="lg" text="Loading inspection..." />
      </div>
    );
  }

  if (!inspection) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card>
          <div className="text-center py-8 text-gray-500">
            <p className="text-lg mb-2">Inspection not found</p>
            <Button variant="primary" onClick={() => router.push('/field')}>
              Back to Field Dashboard
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning">Pending</Badge>;
      case 'in-progress':
        return <Badge variant="info">In Progress</Badge>;
      case 'completed':
        return <Badge variant="success">Completed</Badge>;
      case 'failed':
        return <Badge variant="error">Failed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getCompletionPercentage = (): number => {
    if (!inspection.checklistItems || inspection.checklistItems.length === 0) return 0;
    const completed = inspection.checklistItems.filter((item) => item.checked).length;
    return Math.round((completed / inspection.checklistItems.length) * 100);
  };

  const completionPercentage = getCompletionPercentage();
  const readOnly = inspection.status === 'completed' || inspection.status === 'failed';

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Page Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push(`/projects/${inspection.projectId}/inspections`)}
          className="mb-2 -ml-2"
        >
          <svg className="h-5 w-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Inspections
        </Button>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">{inspection.title}</h1>
              {getStatusBadge(inspection.status)}
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {inspection.inspectionType}
              </div>
              {inspection.scheduledDate && (
                <div className="flex items-center gap-1">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {new Date(inspection.scheduledDate).toLocaleDateString()}
                </div>
              )}
              {inspection.inspector && (
                <div className="flex items-center gap-1">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  {inspection.inspector}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Card */}
      <Card className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-gray-900">Progress</h3>
          <span className="text-2xl font-bold text-gray-900">{completionPercentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
          <div
            className={`h-4 rounded-full transition-all ${
              completionPercentage === 100
                ? 'bg-green-500'
                : completionPercentage > 0
                ? 'bg-yellow-500'
                : 'bg-gray-300'
            }`}
            style={{ width: `${completionPercentage}%` }}
          />
        </div>

        {/* Action Buttons */}
        {!readOnly && (
          <div className="flex gap-3">
            <Button
              variant="primary"
              onClick={handleCompleteInspection}
              className="flex-1"
            >
              <svg className="h-5 w-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Mark as Passed
            </Button>
            <Button
              variant="error"
              onClick={handleMarkFailed}
              className="flex-1"
            >
              <svg className="h-5 w-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Mark as Failed
            </Button>
          </div>
        )}

        {readOnly && inspection.completedDate && (
          <div className="text-sm text-gray-600">
            Completed on {new Date(inspection.completedDate).toLocaleDateString()}
          </div>
        )}
      </Card>

      {/* Notes */}
      {inspection.notes && (
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <h3 className="text-lg font-bold text-gray-900 mb-2">Notes</h3>
          <p className="text-gray-700">{inspection.notes}</p>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="checklist">
            Checklist ({inspection.checklistItems?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="photos">
            Photos ({photos.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="checklist">
          <ChecklistView
            items={inspection.checklistItems || []}
            onItemCheck={handleItemCheck}
            onAddNote={handleAddNote}
            onAddPhoto={(itemId) => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = 'image/*';
              input.multiple = true;
              input.onchange = (e) => {
                const files = (e.target as HTMLInputElement).files;
                if (files) handleAddPhoto(files, itemId);
              };
              input.click();
            }}
            readOnly={readOnly}
          />
        </TabsContent>

        <TabsContent value="photos">
          <div className="space-y-4">
            {!readOnly && (
              <Card>
                <PhotoUpload
                  onUpload={(files) => handleAddPhoto(files)}
                />
              </Card>
            )}

            {photos.length > 0 ? (
              <PhotoGallery
                photos={photos}
                onPhotoClick={(index) => setViewerPhoto(index)}
                onDelete={readOnly ? undefined : handleDeletePhoto}
              />
            ) : (
              <Card>
                <div className="text-center py-8 text-gray-500">
                  <svg className="h-16 w-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-lg mb-2">No photos yet</p>
                  <p className="text-sm">
                    Capture photos to document inspection findings
                  </p>
                </div>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Photo Viewer */}
      {viewerPhoto !== null && (
        <PhotoViewer
          photos={photos}
          currentIndex={viewerPhoto}
          onClose={() => setViewerPhoto(null)}
          onNavigate={setViewerPhoto}
        />
      )}
    </div>
  );
}
