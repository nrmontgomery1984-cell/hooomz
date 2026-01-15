'use client';

/**
 * Project Photos Page
 *
 * Photo gallery for a specific project.
 * Camera integration for field photo capture.
 */

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import type { Photo, Project } from '@hooomz/shared-contracts';
import { useFieldDocsService, useProjectService } from '@/lib/services/ServicesContext';
import { Button, Card, LoadingSpinner } from '@/components/ui';
import { PhotoGallery, PhotoUpload, PhotoViewer } from '@/components/features/field';
import { useToast } from '@/components/ui/Toast';

export default function ProjectPhotosPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  const fieldDocsService = useFieldDocsService();
  const projectService = useProjectService();
  const { showToast } = useToast();
  const [project, setProject] = useState<Project | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [viewerPhoto, setViewerPhoto] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load project
      const projectResponse = await projectService.getById(projectId);
      if (projectResponse.success && projectResponse.data) {
        setProject(projectResponse.data);
      }

      // Load photos for this project
      const photosResponse = await fieldDocsService.listPhotosByProject(projectId);
      if (photosResponse.success && photosResponse.data) {
        setPhotos(photosResponse.data);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      showToast('Failed to load photos', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async (files: FileList) => {
    const newPhotos: Partial<Photo>[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Create photo object (in real app, would upload file and get URL)
      const photoData: Partial<Photo> = {
        projectId,
        url: URL.createObjectURL(file),
        thumbnailUrl: URL.createObjectURL(file),
        caption: file.name,
        capturedAt: new Date().toISOString(),
        uploadStatus: 'pending',
      };

      newPhotos.push(photoData);
    }

    try {
      // In real app, would upload files and create photo records
      for (const photoData of newPhotos) {
        const response = await fieldDocsService.createPhoto(photoData);
        if (!response.success) {
          throw new Error('Failed to create photo');
        }
      }

      showToast(`${newPhotos.length} photo(s) uploaded`, 'success');
      setShowUpload(false);
      await loadData();
    } catch (error) {
      console.error('Failed to upload photos:', error);
      showToast('Failed to upload photos', 'error');
    }
  };

  const handlePhotoClick = (photoIndex: number) => {
    setViewerPhoto(photoIndex);
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
        <LoadingSpinner size="lg" text="Loading photos..." />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card>
          <div className="text-center py-8 text-gray-500">
            <p className="text-lg mb-2">Project not found</p>
            <Button variant="primary" onClick={() => router.push('/projects')}>
              Back to Projects
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <Button
            variant="ghost"
            onClick={() => router.push(`/projects/${projectId}`)}
            className="mb-2 -ml-2"
          >
            <svg className="h-5 w-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Project
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
          <p className="text-gray-600 mt-1">Photo Gallery</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => router.push(`/projects/${projectId}/inspections`)}
          >
            <svg className="h-5 w-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            View Inspections
          </Button>
          <Button
            variant="primary"
            onClick={() => setShowUpload(true)}
          >
            <svg className="h-5 w-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Add Photos
          </Button>
        </div>
      </div>

      {/* Photo Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">
              {photos.length}
            </div>
            <div className="text-sm text-gray-600 mt-1">Total Photos</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              {photos.filter((p) => p.uploadStatus === 'completed').length}
            </div>
            <div className="text-sm text-gray-600 mt-1">Synced</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-600">
              {photos.filter((p) => p.uploadStatus === 'pending').length}
            </div>
            <div className="text-sm text-gray-600 mt-1">Pending</div>
          </div>
        </Card>
      </div>

      {/* Upload Section */}
      {showUpload && (
        <Card className="mb-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Upload Photos</h3>
              <Button variant="ghost" onClick={() => setShowUpload(false)}>
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>
            <PhotoUpload onUpload={handleUpload} />
          </div>
        </Card>
      )}

      {/* Photo Gallery */}
      {photos.length > 0 ? (
        <PhotoGallery
          photos={photos}
          onPhotoClick={handlePhotoClick}
          onDelete={handleDeletePhoto}
        />
      ) : (
        <Card>
          <div className="text-center py-12">
            <svg className="h-16 w-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-gray-500 text-lg mb-2">No photos yet</p>
            <p className="text-gray-400 text-sm mb-4">
              Capture photos to document progress and issues
            </p>
            <Button variant="primary" onClick={() => setShowUpload(true)}>
              Add First Photo
            </Button>
          </div>
        </Card>
      )}

      {/* Photo Viewer */}
      {viewerPhoto !== null && (
        <PhotoViewer
          photos={photos}
          currentIndex={viewerPhoto}
          onClose={() => setViewerPhoto(null)}
          onNavigate={setViewerPhoto}
        />
      )}

      {/* Offline Info */}
      {photos.filter((p) => p.uploadStatus === 'pending').length > 0 && (
        <Card className="mt-6 bg-yellow-50 border-yellow-200">
          <div className="flex items-start gap-3">
            <svg className="h-6 w-6 text-yellow-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-semibold text-yellow-800 mb-1">
                Some photos are pending upload
              </p>
              <p className="text-sm text-yellow-700">
                Photos will sync automatically when you're back online
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
