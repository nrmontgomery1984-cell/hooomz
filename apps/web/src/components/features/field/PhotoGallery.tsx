'use client';

/**
 * PhotoGallery Component
 *
 * Grid display of project photos with click to view.
 */

import React from 'react';
import type { Photo } from '@hooomz/shared-contracts';
import { Card, Badge } from '@/components/ui';

interface PhotoGalleryProps {
  photos: Photo[];
  onPhotoClick: (photo: Photo, index: number) => void;
  onDeletePhoto?: (photoId: string) => void;
}

export function PhotoGallery({ photos, onPhotoClick, onDeletePhoto }: PhotoGalleryProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-CA', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (photos.length === 0) {
    return (
      <Card>
        <div className="text-center py-12">
          <svg
            className="h-16 w-16 text-gray-300 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="text-gray-500 text-lg mb-2">No photos yet</p>
          <p className="text-gray-400 text-sm">
            Add photos to document project progress
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {photos.map((photo, index) => (
        <div
          key={photo.id}
          className="relative group cursor-pointer"
          onClick={() => onPhotoClick(photo, index)}
        >
          {/* Photo Card */}
          <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 border-2 border-gray-200 hover:border-primary-500 transition-colors">
            <img
              src={photo.url}
              alt={photo.caption || 'Project photo'}
              className="w-full h-full object-cover"
            />

            {/* Overlay on Hover */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center">
              <svg
                className="h-12 w-12 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                />
              </svg>
            </div>

            {/* Badge for uploaded status */}
            {photo.uploadStatus === 'pending' && (
              <div className="absolute top-2 right-2">
                <Badge variant="warning" size="sm">
                  Pending
                </Badge>
              </div>
            )}
            {photo.uploadStatus === 'failed' && (
              <div className="absolute top-2 right-2">
                <Badge variant="error" size="sm">
                  Failed
                </Badge>
              </div>
            )}
          </div>

          {/* Photo Info */}
          <div className="mt-2">
            {photo.caption && (
              <p className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
                {photo.caption}
              </p>
            )}
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{formatDate(photo.takenAt)}</span>
              {photo.takenBy && <span>{photo.takenBy}</span>}
            </div>
          </div>

          {/* Delete Button */}
          {onDeletePhoto && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm('Delete this photo?')) {
                  onDeletePhoto(photo.id);
                }
              }}
              className="absolute top-2 left-2 p-2 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
              title="Delete photo"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
